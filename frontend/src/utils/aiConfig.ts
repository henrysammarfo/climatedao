import axios from 'axios'

const HF_API_URL = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3'

export interface AIConfigStatus {
  isValid: boolean
  error?: string
  details?: {
    hasApiKey: boolean
    apiKeyFormat: boolean
    connectionTest: boolean
    modelAccess: boolean
  }
}

export interface AIHealthCheck {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  services: {
    apiKey: 'ok' | 'error' | 'warning'
    connection: 'ok' | 'error' | 'warning'
    model: 'ok' | 'error' | 'warning'
    rateLimit: 'ok' | 'warning' | 'error'
  }
  lastChecked: Date
  recommendations: string[]
}

export class AIConfigValidator {
  /**
   * Validate API key format and basic structure
   */
  static validateApiKey(key: string): { isValid: boolean; error?: string } {
    if (!key) {
      return { isValid: false, error: 'API key is missing' }
    }

    if (typeof key !== 'string') {
      return { isValid: false, error: 'API key must be a string' }
    }

    if (key.trim() === '') {
      return { isValid: false, error: 'API key is empty' }
    }

    if (!key.startsWith('hf_')) {
      return { isValid: false, error: 'API key must start with "hf_"' }
    }

    if (key.length < 20) {
      return { isValid: false, error: 'API key appears to be too short' }
    }

    if (key.length > 100) {
      return { isValid: false, error: 'API key appears to be too long' }
    }

    // Check for common invalid patterns
    if (key.includes('your_api_key') || key.includes('hf_your_api_key')) {
      return { isValid: false, error: 'Please replace the placeholder API key with your actual key' }
    }

    return { isValid: true }
  }

  /**
   * Test API connection with a simple request
   */
  static async testApiConnection(key: string): Promise<{ success: boolean; error?: string; responseTime?: number }> {
    const startTime = Date.now()
    
    try {
      await axios.post(
        HF_API_URL,
        {
          inputs: 'Test connection',
          parameters: {
            max_new_tokens: 5,
            temperature: 0.1,
            return_full_text: false,
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      )

      const responseTime = Date.now() - startTime
      return { success: true, responseTime }
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return { success: false, error: 'Invalid API key - authentication failed', responseTime }
        } else if (error.response?.status === 429) {
          return { success: false, error: 'Rate limit exceeded - too many requests', responseTime }
        } else if (error.response?.status === 503) {
          return { success: false, error: 'Model is loading - please try again in a few minutes', responseTime }
        } else if (error.code === 'ECONNABORTED') {
          return { success: false, error: 'Connection timeout - check your internet connection', responseTime }
        } else if (error.response && error.response.status >= 500) {
          return { success: false, error: 'Server error - Hugging Face service is temporarily unavailable', responseTime }
        }
      }
      
      return { success: false, error: 'Connection test failed', responseTime }
    }
  }

  /**
   * Check if API key has access to the specific model
   */
  static async validateModelAccess(key: string, model: string = 'mistralai/Mistral-7B-Instruct-v0.3'): Promise<{ hasAccess: boolean; error?: string }> {
    try {
      await axios.get(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          headers: {
            'Authorization': `Bearer ${key}`,
          },
          timeout: 5000,
        }
      )

      return { hasAccess: true }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return { hasAccess: false, error: 'Invalid API key' }
        } else if (error.response?.status === 403) {
          return { hasAccess: false, error: 'Access denied to this model' }
        } else if (error.response?.status === 404) {
          return { hasAccess: false, error: 'Model not found' }
        }
      }
      
      return { hasAccess: false, error: 'Unable to verify model access' }
    }
  }

  /**
   * Get comprehensive configuration status
   */
  static async getConfigurationStatus(): Promise<AIConfigStatus> {
    const apiKey = import.meta.env.VITE_HF_API_KEY
    
    const details = {
      hasApiKey: !!apiKey,
      apiKeyFormat: false,
      connectionTest: false,
      modelAccess: false
    }

    // Check if API key exists
    if (!apiKey) {
      return {
        isValid: false,
        error: 'VITE_HF_API_KEY environment variable is not set',
        details
      }
    }

    // Validate API key format
    const keyValidation = this.validateApiKey(apiKey)
    if (!keyValidation.isValid) {
      return {
        isValid: false,
        error: keyValidation.error,
        details
      }
    }
    details.apiKeyFormat = true

    // Test connection
    const connectionTest = await this.testApiConnection(apiKey)
    if (!connectionTest.success) {
      return {
        isValid: false,
        error: connectionTest.error,
        details
      }
    }
    details.connectionTest = true

    // Check model access
    const modelAccess = await this.validateModelAccess(apiKey)
    if (!modelAccess.hasAccess) {
      return {
        isValid: false,
        error: modelAccess.error,
        details
      }
    }
    details.modelAccess = true

    return {
      isValid: true,
      details
    }
  }

  /**
   * Perform comprehensive health check
   */
  static async performHealthCheck(): Promise<AIHealthCheck> {
    const recommendations: string[] = []
    const services: {
      apiKey: 'ok' | 'error' | 'warning'
      connection: 'ok' | 'error' | 'warning'
      model: 'ok' | 'error' | 'warning'
      rateLimit: 'ok' | 'warning' | 'error'
    } = {
      apiKey: 'ok',
      connection: 'ok',
      model: 'ok',
      rateLimit: 'ok'
    }

    try {
      const status = await this.getConfigurationStatus()
      
      if (!status.isValid) {
        services.apiKey = 'error'
        services.connection = 'error'
        services.model = 'error'
        
        if (status.error?.includes('API key')) {
          recommendations.push('Check your VITE_HF_API_KEY environment variable')
          recommendations.push('Verify the API key format (should start with "hf_")')
        } else if (status.error?.includes('connection')) {
          recommendations.push('Check your internet connection')
          recommendations.push('Verify Hugging Face service status')
        } else if (status.error?.includes('model')) {
          recommendations.push('Ensure your API key has access to the Mistral model')
          recommendations.push('Check your Hugging Face account permissions')
        }
      } else {
        // Test rate limit status
        const rateLimitTest = await this.testApiConnection(import.meta.env.VITE_HF_API_KEY)
        if (rateLimitTest.error?.includes('rate limit')) {
          services.rateLimit = 'error'
          recommendations.push('You have exceeded your API rate limit')
          recommendations.push('Consider upgrading your Hugging Face plan')
        } else if (rateLimitTest.responseTime && rateLimitTest.responseTime > 5000) {
          services.rateLimit = 'warning'
          recommendations.push('API response time is slow - this may indicate high usage')
        }
      }

      const overall = services.apiKey === 'error' || services.connection === 'error' || services.model === 'error' 
        ? 'unhealthy' 
        : services.rateLimit === 'error' 
        ? 'degraded' 
        : 'healthy'

      return {
        overall,
        services,
        lastChecked: new Date(),
        recommendations
      }
    } catch (error) {
      console.error('Health check failed:', error)
      return {
        overall: 'unhealthy',
        services: {
          apiKey: 'error',
          connection: 'error',
          model: 'error',
          rateLimit: 'error'
        },
        lastChecked: new Date(),
        recommendations: ['Health check failed - please check your configuration']
      }
    }
  }

  /**
   * Get environment-specific validation recommendations
   */
  static getEnvironmentRecommendations(): string[] {
    const recommendations: string[] = []
    
    if (import.meta.env.DEV) {
      recommendations.push('Development mode: Use a test API key with limited quota')
      recommendations.push('Enable debug logging to troubleshoot issues')
    } else {
      recommendations.push('Production mode: Use a production API key with sufficient quota')
      recommendations.push('Monitor API usage and set up alerts for rate limits')
    }

    return recommendations
  }
}

/**
 * React hook for AI configuration validation (for use in components)
 */
export const useAIConfig = () => {
  const [status, setStatus] = useState<AIConfigStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const validateConfig = async () => {
    setIsLoading(true)
    try {
      const result = await AIConfigValidator.getConfigurationStatus()
      setStatus(result)
      return result
    } catch (error) {
      console.error('Configuration validation failed:', error)
      setStatus({
        isValid: false,
        error: 'Failed to validate configuration'
      })
      return status
    } finally {
      setIsLoading(false)
    }
  }

  const performHealthCheck = async () => {
    setIsLoading(true)
    try {
      const result = await AIConfigValidator.performHealthCheck()
      return result
    } catch (error) {
      console.error('Health check failed:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    status,
    isLoading,
    validateConfig,
    performHealthCheck
  }
}

// Import useState for the hook
import { useState } from 'react'
