interface APICall {
  id: string
  endpoint: string
  timestamp: Date
  duration: number
  success: boolean
  error?: string
  errorType?: 'network' | 'auth' | 'rateLimit' | 'model' | 'parsing' | 'unknown'
  responseSize?: number
  tokensUsed?: number
}

interface UsageStats {
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  averageResponseTime: number
  totalTokensUsed: number
  callsByEndpoint: Record<string, number>
  callsByHour: Record<string, number>
  errorPatterns: Record<string, number>
}

interface PerformanceMetrics {
  responseTime: {
    min: number
    max: number
    average: number
    p95: number
    p99: number
  }
  successRate: number
  errorRate: number
  uptime: number
  last24Hours: {
    calls: number
    errors: number
    averageResponseTime: number
  }
}

interface RateLimitStatus {
  isNearLimit: boolean
  estimatedQuotaUsed: number
  estimatedQuotaRemaining: number
  resetTime?: Date
  recommendations: string[]
}

export class AIAnalytics {
  private static readonly STORAGE_KEY = 'ai_analytics_data'
  private static readonly MAX_STORED_CALLS = 1000
  private static readonly RATE_LIMIT_WARNING_THRESHOLD = 0.8

  /**
   * Track an API call
   */
  static trackApiCall(
    endpoint: string,
    success: boolean,
    duration: number,
    error?: string,
    responseSize?: number,
    tokensUsed?: number
  ): void {
    const call: APICall = {
      id: this.generateId(),
      endpoint,
      timestamp: new Date(),
      duration,
      success,
      error,
      errorType: this.categorizeError(error),
      responseSize,
      tokensUsed
    }

    this.storeApiCall(call)
    this.checkRateLimitStatus()
  }

  /**
   * Get comprehensive usage statistics
   */
  static getUsageStats(): UsageStats {
    const calls = this.getStoredCalls()
    
    const totalCalls = calls.length
    const successfulCalls = calls.filter(c => c.success).length
    const failedCalls = totalCalls - successfulCalls
    const averageResponseTime = calls.length > 0 
      ? calls.reduce((sum, c) => sum + c.duration, 0) / calls.length 
      : 0
    const totalTokensUsed = calls.reduce((sum, c) => sum + (c.tokensUsed || 0), 0)

    // Group by endpoint
    const callsByEndpoint: Record<string, number> = {}
    calls.forEach(call => {
      callsByEndpoint[call.endpoint] = (callsByEndpoint[call.endpoint] || 0) + 1
    })

    // Group by hour
    const callsByHour: Record<string, number> = {}
    calls.forEach(call => {
      const hour = call.timestamp.getHours().toString().padStart(2, '0')
      callsByHour[hour] = (callsByHour[hour] || 0) + 1
    })

    // Error patterns
    const errorPatterns: Record<string, number> = {}
    calls.filter(c => !c.success).forEach(call => {
      const errorType = call.errorType || 'unknown'
      errorPatterns[errorType] = (errorPatterns[errorType] || 0) + 1
    })

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      averageResponseTime,
      totalTokensUsed,
      callsByEndpoint,
      callsByHour,
      errorPatterns
    }
  }

  /**
   * Get performance metrics
   */
  static getPerformanceMetrics(): PerformanceMetrics {
    const calls = this.getStoredCalls()
    const last24Hours = this.getLast24HoursCalls(calls)

    if (calls.length === 0) {
      return {
        responseTime: { min: 0, max: 0, average: 0, p95: 0, p99: 0 },
        successRate: 0,
        errorRate: 0,
        uptime: 0,
        last24Hours: { calls: 0, errors: 0, averageResponseTime: 0 }
      }
    }

    const durations = calls.map(c => c.duration).sort((a, b) => a - b)
    const successfulCalls = calls.filter(c => c.success).length
    const failedCalls = calls.length - successfulCalls

    return {
      responseTime: {
        min: durations[0] || 0,
        max: durations[durations.length - 1] || 0,
        average: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        p95: this.percentile(durations, 95),
        p99: this.percentile(durations, 99)
      },
      successRate: (successfulCalls / calls.length) * 100,
      errorRate: (failedCalls / calls.length) * 100,
      uptime: (successfulCalls / calls.length) * 100,
      last24Hours: {
        calls: last24Hours.length,
        errors: last24Hours.filter(c => !c.success).length,
        averageResponseTime: last24Hours.length > 0 
          ? last24Hours.reduce((sum, c) => sum + c.duration, 0) / last24Hours.length 
          : 0
      }
    }
  }

  /**
   * Get error patterns and trends
   */
  static getErrorPatterns(): {
    recentErrors: APICall[]
    errorTrends: Record<string, number>
    commonErrorMessages: Record<string, number>
    recommendations: string[]
  } {
    const calls = this.getStoredCalls()
    const recentErrors = calls
      .filter(c => !c.success)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)

    const errorTrends: Record<string, number> = {}
    const commonErrorMessages: Record<string, number> = {}

    recentErrors.forEach(call => {
      const errorType = call.errorType || 'unknown'
      errorTrends[errorType] = (errorTrends[errorType] || 0) + 1

      if (call.error) {
        const message = call.error.toLowerCase()
        commonErrorMessages[message] = (commonErrorMessages[message] || 0) + 1
      }
    })

    const recommendations = this.generateErrorRecommendations(errorTrends)

    return {
      recentErrors,
      errorTrends,
      commonErrorMessages,
      recommendations
    }
  }

  /**
   * Check rate limit status and provide recommendations
   */
  static getRateLimitStatus(): RateLimitStatus {
    const calls = this.getLast24HoursCalls(this.getStoredCalls())
    const estimatedQuotaUsed = calls.length
    const estimatedQuotaRemaining = Math.max(0, 1000 - estimatedQuotaUsed) // Assuming 1000 calls/day limit
    const isNearLimit = estimatedQuotaUsed / 1000 > this.RATE_LIMIT_WARNING_THRESHOLD

    const recommendations: string[] = []
    if (isNearLimit) {
      recommendations.push('You are approaching your daily API limit')
      recommendations.push('Consider upgrading to a paid Hugging Face plan')
      recommendations.push('Optimize your requests to reduce API usage')
    }

    return {
      isNearLimit,
      estimatedQuotaUsed,
      estimatedQuotaRemaining,
      recommendations
    }
  }

  /**
   * Get usage recommendations based on analytics
   */
  static getUsageRecommendations(): string[] {
    const stats = this.getUsageStats()
    const metrics = this.getPerformanceMetrics()
    const rateLimit = this.getRateLimitStatus()
    const recommendations: string[] = []

    // Performance recommendations
    if (metrics.responseTime.average > 5000) {
      recommendations.push('API response times are slow - consider optimizing your requests')
    }

    if (metrics.successRate < 90) {
      recommendations.push('Low success rate detected - check your API key and network connection')
    }

    // Usage recommendations
    if (stats.totalCalls > 100 && stats.averageResponseTime > 3000) {
      recommendations.push('High API usage with slow responses - consider caching results')
    }

    // Rate limit recommendations
    if (rateLimit.isNearLimit) {
      recommendations.push(...rateLimit.recommendations)
    }

    // Error pattern recommendations
    const errorPatterns = this.getErrorPatterns()
    if (errorPatterns.errorTrends.rateLimit > 0) {
      recommendations.push('Rate limit errors detected - implement request throttling')
    }

    if (errorPatterns.errorTrends.network > 0) {
      recommendations.push('Network errors detected - implement retry logic with exponential backoff')
    }

    return recommendations
  }

  /**
   * Clear analytics data
   */
  static clearAnalytics(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  /**
   * Export analytics data
   */
  static exportAnalytics(): string {
    const data = {
      usageStats: this.getUsageStats(),
      performanceMetrics: this.getPerformanceMetrics(),
      errorPatterns: this.getErrorPatterns(),
      rateLimitStatus: this.getRateLimitStatus(),
      recommendations: this.getUsageRecommendations(),
      exportedAt: new Date().toISOString()
    }

    return JSON.stringify(data, null, 2)
  }

  // Private helper methods

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private static categorizeError(error?: string): APICall['errorType'] {
    if (!error) return 'unknown'
    
    const message = error.toLowerCase()
    if (message.includes('api key') || message.includes('unauthorized') || message.includes('401')) {
      return 'auth'
    } else if (message.includes('rate limit') || message.includes('429')) {
      return 'rateLimit'
    } else if (message.includes('timeout') || message.includes('connection')) {
      return 'network'
    } else if (message.includes('model') || message.includes('503')) {
      return 'model'
    } else if (message.includes('parse') || message.includes('format')) {
      return 'parsing'
    }
    return 'unknown'
  }

  private static storeApiCall(call: APICall): void {
    try {
      const stored = this.getStoredCalls()
      stored.push(call)
      
      // Keep only the most recent calls
      if (stored.length > this.MAX_STORED_CALLS) {
        stored.splice(0, stored.length - this.MAX_STORED_CALLS)
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored))
    } catch (error) {
      console.error('Failed to store API call:', error)
    }
  }

  private static getStoredCalls(): APICall[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []
      
      const calls = JSON.parse(stored)
      return calls.map((call: any) => ({
        ...call,
        timestamp: new Date(call.timestamp)
      }))
    } catch (error) {
      console.error('Failed to retrieve stored calls:', error)
      return []
    }
  }

  private static getLast24HoursCalls(calls: APICall[]): APICall[] {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    return calls.filter(call => call.timestamp >= yesterday)
  }

  private static percentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1
    const result = sortedArray[Math.max(0, index)] || 0
    console.log(`Percentile ${percentile}: index=${index}, value=${result}, array_length=${sortedArray.length}`)
    return result
  }

  private static generateErrorRecommendations(errorTrends: Record<string, number>): string[] {
    const recommendations: string[] = []
    
    if (errorTrends.auth > 0) {
      recommendations.push('Authentication errors detected - verify your API key configuration')
    }
    
    if (errorTrends.rateLimit > 0) {
      recommendations.push('Rate limit errors detected - implement request throttling')
    }
    
    if (errorTrends.network > 0) {
      recommendations.push('Network errors detected - check your internet connection')
    }
    
    if (errorTrends.model > 0) {
      recommendations.push('Model errors detected - the AI model may be temporarily unavailable')
    }
    
    if (errorTrends.parsing > 0) {
      recommendations.push('Parsing errors detected - the AI service may be returning unexpected formats')
    }
    
    return recommendations
  }

  private static checkRateLimitStatus(): void {
    const rateLimit = this.getRateLimitStatus()
    
    if (rateLimit.isNearLimit) {
      console.warn('AI Analytics: Approaching rate limit', rateLimit)
      
      // In a real application, you might want to show a notification to the user
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('ai-rate-limit-warning', {
          detail: rateLimit
        }))
      }
    }
  }
}

// Event listener for rate limit warnings (can be used by components)
export const addRateLimitWarningListener = (callback: (rateLimit: RateLimitStatus) => void) => {
  if (typeof window !== 'undefined') {
    window.addEventListener('ai-rate-limit-warning', (event: any) => {
      callback(event.detail)
    })
  }
}

export const removeRateLimitWarningListener = (callback: (rateLimit: RateLimitStatus) => void) => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('ai-rate-limit-warning', callback as unknown as EventListener)
  }
}
