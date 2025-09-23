import axios from 'axios'
import { AIAnalytics } from './aiAnalytics'

const HF_API_URL = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3'
const HF_TOKEN = import.meta.env.VITE_HF_API_KEY

export interface ProposalAnalysis {
  impactScore: number // 0-100
  co2Reduction: number // tons per year
  energyGeneration: number // MWh per year
  jobsCreated: number
  confidence: number // 0-100
  reasoning: string
  risks: string[]
  recommendations: string[]
}

export interface ProposalData {
  title: string
  description: string
  category: string
  location: string
  requestedAmount: number
  duration: number
}

export class AIService {
  /**
   * Helper function to make requests with retry logic for transient failures
   */
  private static async requestWithRetry<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn()
      } catch (error) {
        lastError = error as Error
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break
        }
        
        // Check if this is a retryable error
        if (axios.isAxiosError(error)) {
          const status = error.response?.status
          const code = error.code
          
          // Retry on transient errors
          if (
            code === 'ECONNABORTED' ||
            status === 429 ||
            status === 503 ||
            (status && status >= 500)
          ) {
            // Calculate delay with exponential backoff
            const delay = baseDelay * Math.pow(2, attempt)
            
            // For 429 errors, respect Retry-After header if present
            if (status === 429 && error.response?.headers['retry-after']) {
              const retryAfter = parseInt(error.response.headers['retry-after'])
              if (!isNaN(retryAfter)) {
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
                continue
              }
            }
            
            console.log(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`)
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
        }
        
        // Non-retryable error, break immediately
        break
      }
    }
    
    throw lastError || new Error('Request failed after all retry attempts')
  }

  /**
   * Analyze a proposal and generate impact metrics using Hugging Face Inference API
   */
  static async analyzeProposal(proposal: ProposalData): Promise<ProposalAnalysis> {
    if (!HF_TOKEN) {
      throw new Error('Hugging Face API key is required for AI analysis. Please configure VITE_HF_API_KEY in your environment variables.')
    }

    const startTime = Date.now()
    try {
      const prompt = this.createAnalysisPrompt(proposal)
      
      // Call Hugging Face Inference API with retry logic
      const response = await this.requestWithRetry(async () => {
        return await axios.post(
          HF_API_URL,
          {
            inputs: prompt,
            parameters: {
              max_new_tokens: 1000,
              temperature: 0.3,
              return_full_text: false,
            },
            options: {
              wait_for_model: true
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${HF_TOKEN}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 second timeout
          }
        )
      })

      const analysisText = response.data[0]?.generated_text || response.data
      const result = this.parseAnalysisResponse(analysisText, proposal)
      
      // Track successful API call
      const duration = Date.now() - startTime
      AIAnalytics.trackApiCall('analyzeProposal', true, duration)
      
      return result
    } catch (error) {
      // Track failed API call
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      AIAnalytics.trackApiCall('analyzeProposal', false, duration, errorMessage)
      console.error('AI analysis failed:', error)
      
      // Handle specific error cases with detailed messages
      if (axios.isAxiosError(error)) {
        // Extract Hugging Face error message if available
        const hfError = error.response?.data?.error || error.response?.data?.message
        const baseMessage = hfError ? ` ${hfError}` : ''
        
        if (error.response?.status === 429) {
          throw new Error(`AI service rate limit exceeded. You have exceeded the API usage limit. Please wait before making another request or upgrade your Hugging Face plan.${baseMessage}`)
        } else if (error.response?.status === 401) {
          throw new Error(`Invalid Hugging Face API key. Please verify your VITE_HF_API_KEY is correct and has the necessary permissions for the Mistral-7B-Instruct-v0.3 model.${baseMessage}`)
        } else if (error.response?.status === 503) {
          throw new Error(`AI model is currently loading. The Mistral-7B-Instruct-v0.3 model is being loaded on Hugging Face servers. Please try again in 1-2 minutes.${baseMessage}`)
        } else if (error.code === 'ECONNABORTED') {
          throw new Error(`AI service request timeout. The request took too long to complete. Please check your internet connection and try again.${baseMessage}`)
        } else if (error.response && error.response.status >= 500) {
          throw new Error(`Hugging Face service is temporarily unavailable. Please try again later or check the Hugging Face status page for updates.${baseMessage}`)
        } else if (error.response?.status === 400) {
          throw new Error(`Invalid request format. There was an issue with the request parameters. Please try again.${baseMessage}`)
        }
      }
      
      throw new Error('AI analysis failed due to an unexpected error. Please check your internet connection and try again. If the problem persists, contact support.')
    }
  }

  /**
   * Create a structured prompt for AI analysis using the specified format
   */
  private static createAnalysisPrompt(proposal: ProposalData): string {
    return `[INST] Analyze this climate project for potential impact score (0-100), feasibility, and suggestions. 

Project: ${proposal.title}
Description: ${proposal.description}
Category: ${proposal.category}
Location: ${proposal.location}
Requested Amount: $${proposal.requestedAmount.toLocaleString()}
Duration: ${proposal.duration} days

Please provide your analysis in the following JSON format:
{
  "impactScore": <number 0-100>,
  "co2Reduction": <estimated tons CO2 reduced per year>,
  "energyGeneration": <estimated MWh generated per year, 0 if not applicable>,
  "jobsCreated": <estimated number of jobs created>,
  "confidence": <confidence level 0-100>,
  "reasoning": "<detailed explanation of the analysis>",
  "risks": ["<risk1>", "<risk2>", "<risk3>"],
  "recommendations": ["<recommendation1>", "<recommendation2>", "<recommendation3>"]
}

Consider factors like environmental impact potential, feasibility, scalability, cost-effectiveness, community benefits, technical viability, regulatory considerations, and market conditions. Provide realistic, data-driven estimates based on similar projects and industry standards. [/INST]`
  }

  /**
   * Parse the AI response into structured data with enhanced validation
   */
  private static parseAnalysisResponse(text: string, _proposal: ProposalData): ProposalAnalysis {
    console.log('Raw AI response:', text) // Debug logging
    
    try {
      // Try multiple JSON extraction patterns, prioritizing fenced blocks
      let jsonStr = ''
      
      // Pattern 1: JSON wrapped in markdown code blocks (prioritized)
      const codeBlockMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/)
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1]
      } else {
        // Pattern 2: Standard JSON object (non-greedy)
        const jsonMatch = text.match(/\{[\s\S]*?\}/)
        if (jsonMatch) {
          jsonStr = jsonMatch[0]
        } else {
          // Pattern 3: Look for JSON after common prefixes
          const afterPrefixMatch = text.match(/(?:Here's|Here is|Analysis:|Result:)\s*\n?\s*(\{[\s\S]*?\})/i)
          if (afterPrefixMatch) {
            jsonStr = afterPrefixMatch[1]
          }
        }
      }
      
      if (!jsonStr) {
        throw new Error('No valid JSON found in AI response')
      }
      
      console.log('Extracted JSON substring:', jsonStr) // Unit log to confirm extraction
      const parsed = JSON.parse(jsonStr)
      
      // Validate and sanitize the parsed data
      const result: ProposalAnalysis = {
        impactScore: Math.max(0, Math.min(100, Number(parsed.impactScore) || 0)),
        co2Reduction: Math.max(0, Number(parsed.co2Reduction) || 0),
        energyGeneration: Math.max(0, Number(parsed.energyGeneration) || 0),
        jobsCreated: Math.max(0, Number(parsed.jobsCreated) || 0),
        confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 0)),
        reasoning: String(parsed.reasoning || 'AI analysis completed').trim(),
        risks: Array.isArray(parsed.risks) ? parsed.risks.filter((r: any) => typeof r === 'string').map((r: any) => r.trim()) : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.filter((r: any) => typeof r === 'string').map((r: any) => r.trim()) : []
      }
      
      // Additional validation
      if (result.reasoning.length === 0) {
        result.reasoning = 'AI analysis completed successfully'
      }
      
      console.log('Parsed AI analysis:', result) // Debug logging
      return result
      
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      console.error('Response text:', text)
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown parsing error'}. The AI service may have returned an unexpected format.`)
    }
  }

  /**
   * Validate AI service configuration
   */
  static validateConfiguration(): { isValid: boolean; error?: string } {
    if (!HF_TOKEN) {
      return {
        isValid: false,
        error: 'Hugging Face API key is missing. Please configure VITE_HF_API_KEY in your environment variables.'
      }
    }

    if (typeof HF_TOKEN !== 'string' || HF_TOKEN.trim() === '') {
      return {
        isValid: false,
        error: 'Hugging Face API key is empty or invalid. Please check your VITE_HF_API_KEY configuration.'
      }
    }

    if (!HF_TOKEN.startsWith('hf_')) {
      return {
        isValid: false,
        error: 'Invalid Hugging Face API key format. API key should start with "hf_". Please check your VITE_HF_API_KEY configuration.'
      }
    }

    return { isValid: true }
  }

  /**
   * Test API connection with a simple request
   */
  static async testConnection(): Promise<{ success: boolean; error?: string }> {
    const validation = this.validateConfiguration()
    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }

    try {
      await this.requestWithRetry(async () => {
        return await axios.post(
          HF_API_URL,
          {
            inputs: 'Test connection',
            parameters: {
              max_new_tokens: 10,
              temperature: 0.1,
              return_full_text: false,
            },
            options: {
              wait_for_model: true
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${HF_TOKEN}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000, // 10 second timeout for test
          }
        )
      })

      // If we get here, the connection is working
      return { success: true }
    } catch (error) {
      console.error('AI connection test failed:', error)
      
      if (axios.isAxiosError(error)) {
        // Extract Hugging Face error message if available
        const hfError = error.response?.data?.error || error.response?.data?.message
        const baseMessage = hfError ? ` ${hfError}` : ''
        
        if (error.response?.status === 401) {
          return { success: false, error: `Invalid Hugging Face API key. Please check your VITE_HF_API_KEY configuration.${baseMessage}` }
        } else if (error.response?.status === 429) {
          return { success: false, error: `Hugging Face API rate limit exceeded. Please try again later.${baseMessage}` }
        } else if (error.response?.status === 503) {
          return { success: false, error: `Hugging Face model is loading. Please try again in a few minutes.${baseMessage}` }
        } else if (error.code === 'ECONNABORTED') {
          return { success: false, error: `Connection timeout. Please check your internet connection.${baseMessage}` }
        } else if (error.response && error.response.status >= 500) {
          return { success: false, error: `Hugging Face service is temporarily unavailable. Please try again later.${baseMessage}` }
        }
      }
      
      return { success: false, error: 'Failed to connect to AI service. Please check your configuration and try again.' }
    }
  }

  /**
   * Get AI-powered project suggestions
   */
  static async getProjectSuggestions(category: string, location: string): Promise<string[]> {
    if (!HF_TOKEN) {
      throw new Error('Hugging Face API key is required for AI suggestions. Please configure VITE_HF_API_KEY in your environment variables.')
    }

    const startTime = Date.now()
    try {
      const prompt = `[INST] Suggest 3 innovative environmental projects for ${category} in ${location}.
Focus on high-impact, feasible solutions that could be funded through a DAO.
Provide brief, actionable project ideas.

Format as a simple list:
1. Project idea 1
2. Project idea 2  
3. Project idea 3 [/INST]`

      const response = await this.requestWithRetry(async () => {
        return await axios.post(
          HF_API_URL,
          {
            inputs: prompt,
            parameters: {
              max_new_tokens: 300,
              temperature: 0.7,
              return_full_text: false,
            },
            options: {
              wait_for_model: true
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${HF_TOKEN}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        )
      })

      const suggestions = (response.data[0]?.generated_text || response.data)
        .split('\n')
        .filter((line: string) => line.trim().match(/^\d+\./))
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, 3)

      if (suggestions.length === 0) {
        throw new Error('AI service returned no valid suggestions')
      }

      // Track successful API call
      const duration = Date.now() - startTime
      AIAnalytics.trackApiCall('getProjectSuggestions', true, duration)

      return suggestions
    } catch (error) {
      // Track failed API call
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      AIAnalytics.trackApiCall('getProjectSuggestions', false, duration, errorMessage)
      console.error('Failed to get AI suggestions:', error)
      if (axios.isAxiosError(error)) {
        // Extract Hugging Face error message if available
        const hfError = error.response?.data?.error || error.response?.data?.message
        const baseMessage = hfError ? ` ${hfError}` : ''
        
        if (error.response?.status === 429) {
          throw new Error(`AI service rate limit exceeded. Please try again later.${baseMessage}`)
        } else if (error.response?.status === 401) {
          throw new Error(`Invalid Hugging Face API key. Please check your VITE_HF_API_KEY configuration.${baseMessage}`)
        }
      }
      throw new Error('Failed to get AI suggestions. Please try again.')
    }
  }

  /**
   * Analyze project category trends
   */
  static async getCategoryInsights(category: string): Promise<{
    averageImpact: number
    commonChallenges: string[]
    successFactors: string[]
  }> {
    if (!HF_TOKEN) {
      throw new Error('Hugging Face API key is required for AI insights. Please configure VITE_HF_API_KEY in your environment variables.')
    }

    const startTime = Date.now()
    try {
      const prompt = `[INST] Analyze the ${category} sector for environmental projects.
Provide insights on:
- Average impact score (0-100)
- Common challenges (3 items)
- Success factors (3 items)

Format as JSON:
{
  "averageImpact": <number>,
  "commonChallenges": ["challenge1", "challenge2", "challenge3"],
  "successFactors": ["factor1", "factor2", "factor3"]
} [/INST]`

      const response = await this.requestWithRetry(async () => {
        return await axios.post(
          HF_API_URL,
          {
            inputs: prompt,
            parameters: {
              max_new_tokens: 400,
              temperature: 0.4,
              return_full_text: false,
            },
            options: {
              wait_for_model: true
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${HF_TOKEN}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        )
      })

      const responseText = response.data[0]?.generated_text || response.data
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        // Validate averageImpact field
        if (typeof parsed.averageImpact !== 'number' || isNaN(parsed.averageImpact)) {
          throw new Error('Invalid AI response format: averageImpact field is missing or invalid')
        }
        
        const result = {
          averageImpact: Math.max(0, Math.min(100, parsed.averageImpact)),
          commonChallenges: Array.isArray(parsed.commonChallenges) ? parsed.commonChallenges : [],
          successFactors: Array.isArray(parsed.successFactors) ? parsed.successFactors : []
        }
        
        // Track successful API call
        const duration = Date.now() - startTime
        AIAnalytics.trackApiCall('getCategoryInsights', true, duration)
        
        return result
      }
      
      throw new Error('AI service returned invalid insights format')
    } catch (error) {
      // Track failed API call
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      AIAnalytics.trackApiCall('getCategoryInsights', false, duration, errorMessage)
      console.error('Failed to get category insights:', error)
      if (axios.isAxiosError(error)) {
        // Extract Hugging Face error message if available
        const hfError = error.response?.data?.error || error.response?.data?.message
        const baseMessage = hfError ? ` ${hfError}` : ''
        
        if (error.response?.status === 429) {
          throw new Error(`AI service rate limit exceeded. Please try again later.${baseMessage}`)
        } else if (error.response?.status === 401) {
          throw new Error(`Invalid Hugging Face API key. Please check your VITE_HF_API_KEY configuration.${baseMessage}`)
        }
      }
      throw new Error('Failed to get AI insights. Please try again.')
    }
  }
}
