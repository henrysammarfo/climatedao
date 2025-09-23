import axios from 'axios'

const HF_API_URL = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3'
const HF_TOKEN = (import.meta as any).env?.VITE_HF_API_KEY

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
   * Analyze a proposal and generate impact metrics using Hugging Face Inference API
   */
  static async analyzeProposal(proposal: ProposalData): Promise<ProposalAnalysis> {
    if (!HF_TOKEN) {
      throw new Error('Hugging Face API key is required for AI analysis. Please configure VITE_HF_API_KEY in your environment variables.')
    }

    try {
      const prompt = this.createAnalysisPrompt(proposal)
      
      // Call Hugging Face Inference API with axios
      const response = await axios.post(
        HF_API_URL,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 1000,
            temperature: 0.3,
            return_full_text: false,
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

      const analysisText = response.data[0]?.generated_text || response.data
      return this.parseAnalysisResponse(analysisText, proposal)
    } catch (error) {
      console.error('AI analysis failed:', error)
      
      // Handle specific error cases
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('AI service rate limit exceeded. Please try again later.')
        } else if (error.response?.status === 401) {
          throw new Error('Invalid Hugging Face API key. Please check your VITE_HF_API_KEY configuration.')
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('AI service request timeout. Please try again.')
        } else if (error.response && error.response.status >= 500) {
          throw new Error('AI service is temporarily unavailable. Please try again later.')
        }
      }
      
      throw new Error('AI analysis failed. Please try again or contact support.')
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
   * Parse the AI response into structured data
   */
  private static parseAnalysisResponse(text: string, _proposal: ProposalData): ProposalAnalysis {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const jsonStr = jsonMatch[0]
        const parsed = JSON.parse(jsonStr)
        
        return {
          impactScore: Math.max(0, Math.min(100, parsed.impactScore || 0)),
          co2Reduction: Math.max(0, parsed.co2Reduction || 0),
          energyGeneration: Math.max(0, parsed.energyGeneration || 0),
          jobsCreated: Math.max(0, parsed.jobsCreated || 0),
          confidence: Math.max(0, Math.min(100, parsed.confidence || 0)),
          reasoning: parsed.reasoning || 'AI analysis completed',
          risks: Array.isArray(parsed.risks) ? parsed.risks : [],
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
        }
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error)
    }

    throw new Error('Failed to parse AI response. The AI service returned an invalid format.')
  }

  /**
   * Fallback analysis when AI fails
   */
  static getFallbackAnalysis(proposal: ProposalData): ProposalAnalysis {
    const categoryMultipliers = {
      'Renewable Energy': { impact: 0.9, co2: 0.8, energy: 0.9, jobs: 0.7 },
      'Carbon Capture': { impact: 0.95, co2: 0.95, energy: 0.1, jobs: 0.6 },
      'Reforestation': { impact: 0.85, co2: 0.9, energy: 0.0, jobs: 0.8 },
      'Ocean Cleanup': { impact: 0.8, co2: 0.3, energy: 0.0, jobs: 0.5 },
      'Sustainable Agriculture': { impact: 0.75, co2: 0.6, energy: 0.2, jobs: 0.9 },
      'Climate Education': { impact: 0.7, co2: 0.4, energy: 0.0, jobs: 0.6 },
      'Other': { impact: 0.6, co2: 0.5, energy: 0.3, jobs: 0.5 }
    }

    const multiplier = categoryMultipliers[proposal.category as keyof typeof categoryMultipliers] || categoryMultipliers.Other
    
    // Base calculations
    const baseImpact = 70
    const baseCO2 = proposal.requestedAmount / 1000 // $1000 per ton CO2
    const baseEnergy = proposal.category === 'Renewable Energy' ? proposal.requestedAmount / 50 : 0 // $50 per MWh
    const baseJobs = proposal.requestedAmount / 100000 // $100k per job

    return {
      impactScore: Math.round(baseImpact * multiplier.impact),
      co2Reduction: Math.round(baseCO2 * multiplier.co2),
      energyGeneration: Math.round(baseEnergy * multiplier.energy),
      jobsCreated: Math.round(baseJobs * multiplier.jobs),
      confidence: 75,
      reasoning: `Fallback analysis based on project category (${proposal.category}) and industry standards. This is an estimated assessment pending detailed review.`,
      risks: [
        'Project execution timeline may vary',
        'Market conditions could affect outcomes',
        'Regulatory approval required'
      ],
      recommendations: [
        'Provide detailed project timeline',
        'Include risk mitigation strategies',
        'Demonstrate community support'
      ]
    }
  }

  /**
   * Get AI-powered project suggestions
   */
  static async getProjectSuggestions(category: string, location: string): Promise<string[]> {
    if (!HF_TOKEN) {
      throw new Error('Hugging Face API key is required for AI suggestions. Please configure VITE_HF_API_KEY in your environment variables.')
    }

    try {
      const prompt = `[INST] Suggest 3 innovative environmental projects for ${category} in ${location}.
Focus on high-impact, feasible solutions that could be funded through a DAO.
Provide brief, actionable project ideas.

Format as a simple list:
1. Project idea 1
2. Project idea 2  
3. Project idea 3 [/INST]`

      const response = await axios.post(
        HF_API_URL,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 300,
            temperature: 0.7,
            return_full_text: false,
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

      const suggestions = (response.data[0]?.generated_text || response.data)
        .split('\n')
        .filter((line: string) => line.trim().match(/^\d+\./))
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, 3)

      if (suggestions.length === 0) {
        throw new Error('AI service returned no valid suggestions')
      }

      return suggestions
    } catch (error) {
      console.error('Failed to get AI suggestions:', error)
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('AI service rate limit exceeded. Please try again later.')
        } else if (error.response?.status === 401) {
          throw new Error('Invalid Hugging Face API key. Please check your VITE_HF_API_KEY configuration.')
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

      const response = await axios.post(
        HF_API_URL,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 400,
            temperature: 0.4,
            return_full_text: false,
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

      const responseText = response.data[0]?.generated_text || response.data
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          averageImpact: Math.max(0, Math.min(100, parsed.averageImpact || 70)),
          commonChallenges: Array.isArray(parsed.commonChallenges) ? parsed.commonChallenges : [],
          successFactors: Array.isArray(parsed.successFactors) ? parsed.successFactors : []
        }
      }
      
      throw new Error('AI service returned invalid insights format')
    } catch (error) {
      console.error('Failed to get category insights:', error)
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('AI service rate limit exceeded. Please try again later.')
        } else if (error.response?.status === 401) {
          throw new Error('Invalid Hugging Face API key. Please check your VITE_HF_API_KEY configuration.')
        }
      }
      throw new Error('Failed to get AI insights. Please try again.')
    }
  }
}
