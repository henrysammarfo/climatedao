// Tribes SDK Monitoring and Analytics Service
import { ConfigurationStatus } from './tribesService'

export interface TribesOperation {
  operation: string
  success: boolean
  duration: number
  error?: string
  timestamp: number
  userId?: string
  metadata?: Record<string, any>
}

export interface TribesUsageStats {
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  averageResponseTime: number
  mostUsedFeatures: Array<{ feature: string; count: number }>
  errorPatterns: Array<{ error: string; count: number }>
  dailyStats: Array<{ date: string; operations: number; errors: number }>
}

export interface TribesPerformanceMetrics {
  sdkInitializationTime: number
  walletConnectionTime: number
  userProfileLoadTime: number
  eventLoadTime: number
  leaderboardLoadTime: number
  tokenOperationTime: number
  averageApiResponseTime: number
}

export interface TribesErrorPattern {
  errorType: 'configuration' | 'network' | 'permission' | 'sdk' | 'wallet' | 'unknown'
  errorMessage: string
  count: number
  firstOccurrence: number
  lastOccurrence: number
  frequency: number // errors per hour
}

export interface TribesAnalyticsData {
  operations: TribesOperation[]
  configurationValidation: Array<{
    timestamp: number
    status: ConfigurationStatus
    duration: number
  }>
  performanceMetrics: TribesPerformanceMetrics
  errorPatterns: TribesErrorPattern[]
  usageStats: TribesUsageStats
  lastUpdated: number
}

class TribesAnalyticsService {
  private static instance: TribesAnalyticsService
  private analyticsData: TribesAnalyticsData
  private readonly STORAGE_KEY = 'tribes_analytics_data'
  private readonly MAX_OPERATIONS = 1000 // Keep last 1000 operations
  private readonly MAX_ERROR_PATTERNS = 100 // Keep last 100 error patterns

  private constructor() {
    this.analyticsData = this.loadAnalyticsData()
    this.cleanupOldData()
  }

  static getInstance(): TribesAnalyticsService {
    if (!TribesAnalyticsService.instance) {
      TribesAnalyticsService.instance = new TribesAnalyticsService()
    }
    return TribesAnalyticsService.instance
  }

  /**
   * Track a Tribes SDK operation
   */
  trackTribesOperation(
    operation: string,
    success: boolean,
    duration: number,
    error?: string,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    const operationData: TribesOperation = {
      operation,
      success,
      duration,
      error,
      timestamp: Date.now(),
      userId,
      metadata
    }

    this.analyticsData.operations.push(operationData)
    
    // Keep only the most recent operations
    if (this.analyticsData.operations.length > this.MAX_OPERATIONS) {
      this.analyticsData.operations = this.analyticsData.operations.slice(-this.MAX_OPERATIONS)
    }

    // Update error patterns if this is an error
    if (!success && error) {
      this.updateErrorPatterns(error)
    }

    this.saveAnalyticsData()
  }

  /**
   * Track configuration validation
   */
  trackConfigurationValidation(
    status: ConfigurationStatus,
    duration: number
  ): void {
    this.analyticsData.configurationValidation.push({
      timestamp: Date.now(),
      status,
      duration
    })

    // Keep only recent validation attempts
    if (this.analyticsData.configurationValidation.length > 50) {
      this.analyticsData.configurationValidation = this.analyticsData.configurationValidation.slice(-50)
    }

    this.saveAnalyticsData()
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(metrics: Partial<TribesPerformanceMetrics>): void {
    this.analyticsData.performanceMetrics = {
      ...this.analyticsData.performanceMetrics,
      ...metrics
    }
    this.saveAnalyticsData()
  }

  /**
   * Get comprehensive usage statistics
   */
  getTribesUsageStats(): TribesUsageStats {
    const operations = this.analyticsData.operations
    const totalOperations = operations.length
    const successfulOperations = operations.filter(op => op.success).length
    const failedOperations = totalOperations - successfulOperations

    // Calculate average response time
    const totalDuration = operations.reduce((sum, op) => sum + op.duration, 0)
    const averageResponseTime = totalOperations > 0 ? totalDuration / totalOperations : 0

    // Get most used features
    const featureCounts: Record<string, number> = {}
    operations.forEach(op => {
      featureCounts[op.operation] = (featureCounts[op.operation] || 0) + 1
    })
    const mostUsedFeatures = Object.entries(featureCounts)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Get error patterns
    const errorCounts: Record<string, number> = {}
    operations.filter(op => !op.success && op.error).forEach(op => {
      errorCounts[op.error!] = (errorCounts[op.error!] || 0) + 1
    })
    const errorPatterns = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Get daily stats (last 30 days)
    const dailyStats = this.getDailyStats()

    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      averageResponseTime,
      mostUsedFeatures,
      errorPatterns,
      dailyStats
    }
  }

  /**
   * Get error patterns with frequency analysis
   */
  getTribesErrorPatterns(): TribesErrorPattern[] {
    return this.analyticsData.errorPatterns
  }

  /**
   * Get performance metrics
   */
  getTribesPerformanceMetrics(): TribesPerformanceMetrics {
    return this.analyticsData.performanceMetrics
  }

  /**
   * Get configuration validation history
   */
  getConfigurationValidationHistory(): Array<{
    timestamp: number
    status: ConfigurationStatus
    duration: number
  }> {
    return this.analyticsData.configurationValidation
  }

  /**
   * Get analytics summary for debugging
   */
  getAnalyticsSummary(): {
    totalOperations: number
    successRate: number
    averageResponseTime: number
    topErrors: string[]
    configurationIssues: number
    lastActivity: number
  } {
    const operations = this.analyticsData.operations
    const totalOperations = operations.length
    const successfulOperations = operations.filter(op => op.success).length
    const successRate = totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 0

    const totalDuration = operations.reduce((sum, op) => sum + op.duration, 0)
    const averageResponseTime = totalOperations > 0 ? totalDuration / totalOperations : 0

    const errorCounts: Record<string, number> = {}
    operations.filter(op => !op.success && op.error).forEach(op => {
      errorCounts[op.error!] = (errorCounts[op.error!] || 0) + 1
    })
    const topErrors = Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([error]) => error)

    const configurationIssues = this.analyticsData.configurationValidation
      .filter(validation => !validation.status.isValid).length

    const lastActivity = operations.length > 0 
      ? Math.max(...operations.map(op => op.timestamp))
      : 0

    return {
      totalOperations,
      successRate,
      averageResponseTime,
      topErrors,
      configurationIssues,
      lastActivity
    }
  }

  /**
   * Clear all analytics data
   */
  clearAnalyticsData(): void {
    this.analyticsData = {
      operations: [],
      configurationValidation: [],
      performanceMetrics: {
        sdkInitializationTime: 0,
        walletConnectionTime: 0,
        userProfileLoadTime: 0,
        eventLoadTime: 0,
        leaderboardLoadTime: 0,
        tokenOperationTime: 0,
        averageApiResponseTime: 0
      },
      errorPatterns: [],
      usageStats: {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageResponseTime: 0,
        mostUsedFeatures: [],
        errorPatterns: [],
        dailyStats: []
      },
      lastUpdated: Date.now()
    }
    this.saveAnalyticsData()
  }

  /**
   * Export analytics data for debugging
   */
  exportAnalyticsData(): string {
    return JSON.stringify(this.analyticsData, null, 2)
  }

  /**
   * Import analytics data
   */
  importAnalyticsData(data: string): boolean {
    try {
      const importedData = JSON.parse(data)
      this.analyticsData = importedData
      this.saveAnalyticsData()
      return true
    } catch (error) {
      console.error('Failed to import analytics data:', error)
      return false
    }
  }

  private updateErrorPatterns(error: string): void {
    const errorType = this.categorizeError(error)
    const now = Date.now()
    
    // Find existing pattern or create new one
    let pattern = this.analyticsData.errorPatterns.find(p => p.errorMessage === error)
    
    if (pattern) {
      pattern.count++
      pattern.lastOccurrence = now
      pattern.frequency = this.calculateFrequency(pattern)
    } else {
      pattern = {
        errorType,
        errorMessage: error,
        count: 1,
        firstOccurrence: now,
        lastOccurrence: now,
        frequency: 0
      }
      this.analyticsData.errorPatterns.push(pattern)
    }

    // Keep only the most recent error patterns
    if (this.analyticsData.errorPatterns.length > this.MAX_ERROR_PATTERNS) {
      this.analyticsData.errorPatterns = this.analyticsData.errorPatterns
        .sort((a, b) => b.lastOccurrence - a.lastOccurrence)
        .slice(0, this.MAX_ERROR_PATTERNS)
    }
  }

  private categorizeError(error: string): TribesErrorPattern['errorType'] {
    const message = error.toLowerCase()
    
    if (message.includes('configuration') || message.includes('config')) {
      return 'configuration'
    } else if (message.includes('network') || message.includes('connection')) {
      return 'network'
    } else if (message.includes('permission') || message.includes('unauthorized')) {
      return 'permission'
    } else if (message.includes('sdk') || message.includes('initialization')) {
      return 'sdk'
    } else if (message.includes('wallet') || message.includes('provider')) {
      return 'wallet'
    } else {
      return 'unknown'
    }
  }

  private calculateFrequency(pattern: TribesErrorPattern): number {
    const timeSpan = pattern.lastOccurrence - pattern.firstOccurrence
    const hours = timeSpan / (1000 * 60 * 60)
    return hours > 0 ? pattern.count / hours : 0
  }

  private getDailyStats(): Array<{ date: string; operations: number; errors: number }> {
    const operations = this.analyticsData.operations
    const dailyStats: Record<string, { operations: number; errors: number }> = {}
    
    // Get last 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    const recentOperations = operations.filter(op => op.timestamp >= thirtyDaysAgo)
    
    recentOperations.forEach(op => {
      const date = new Date(op.timestamp).toISOString().split('T')[0]
      if (!dailyStats[date]) {
        dailyStats[date] = { operations: 0, errors: 0 }
      }
      dailyStats[date].operations++
      if (!op.success) {
        dailyStats[date].errors++
      }
    })

    return Object.entries(dailyStats)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  private loadAnalyticsData(): TribesAnalyticsData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error)
    }

    return {
      operations: [],
      configurationValidation: [],
      performanceMetrics: {
        sdkInitializationTime: 0,
        walletConnectionTime: 0,
        userProfileLoadTime: 0,
        eventLoadTime: 0,
        leaderboardLoadTime: 0,
        tokenOperationTime: 0,
        averageApiResponseTime: 0
      },
      errorPatterns: [],
      usageStats: {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageResponseTime: 0,
        mostUsedFeatures: [],
        errorPatterns: [],
        dailyStats: []
      },
      lastUpdated: Date.now()
    }
  }

  private saveAnalyticsData(): void {
    try {
      this.analyticsData.lastUpdated = Date.now()
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.analyticsData))
    } catch (error) {
      console.error('Failed to save analytics data:', error)
    }
  }

  private cleanupOldData(): void {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    
    // Remove old operations
    this.analyticsData.operations = this.analyticsData.operations.filter(
      op => op.timestamp >= thirtyDaysAgo
    )
    
    // Remove old configuration validations
    this.analyticsData.configurationValidation = this.analyticsData.configurationValidation.filter(
      validation => validation.timestamp >= thirtyDaysAgo
    )
    
    // Remove old error patterns
    this.analyticsData.errorPatterns = this.analyticsData.errorPatterns.filter(
      pattern => pattern.lastOccurrence >= thirtyDaysAgo
    )
  }
}

// Export singleton instance
export const tribesAnalytics = TribesAnalyticsService.getInstance()

// Helper functions for easy tracking
export const trackTribesOperation = (
  operation: string,
  success: boolean,
  duration: number,
  error?: string,
  userId?: string,
  metadata?: Record<string, any>
) => {
  tribesAnalytics.trackTribesOperation(operation, success, duration, error, userId, metadata)
}

export const trackConfigurationValidation = (
  status: ConfigurationStatus,
  duration: number
) => {
  tribesAnalytics.trackConfigurationValidation(status, duration)
}

export const updatePerformanceMetrics = (metrics: Partial<TribesPerformanceMetrics>) => {
  tribesAnalytics.updatePerformanceMetrics(metrics)
}
