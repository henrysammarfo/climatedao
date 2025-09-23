interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  metadata?: Record<string, any>
}

interface PerformanceBudget {
  name: string
  threshold: number
  unit: 'ms' | 'count' | 'bytes'
  severity: 'warning' | 'error'
}

interface LoadingStage {
  name: string
  startTime: number
  endTime?: number
  duration?: number
}

class PerformanceService {
  private metrics: PerformanceMetric[] = []
  private budgets: PerformanceBudget[] = []
  private loadingStages: Map<string, LoadingStage> = new Map()
  private observers: Map<string, PerformanceObserver> = new Map()

  constructor() {
    this.initializeBudgets()
    this.setupPerformanceObservers()
  }

  private initializeBudgets() {
    this.budgets = [
      { name: 'proposal-loading', threshold: 2000, unit: 'ms', severity: 'warning' },
      { name: 'proposal-loading', threshold: 5000, unit: 'ms', severity: 'error' },
      { name: 'cache-hit-rate', threshold: 0.8, unit: 'count', severity: 'warning' },
      { name: 'api-response-time', threshold: 1000, unit: 'ms', severity: 'warning' },
      { name: 'api-response-time', threshold: 3000, unit: 'ms', severity: 'error' },
      { name: 'render-time', threshold: 100, unit: 'ms', severity: 'warning' },
      { name: 'render-time', threshold: 300, unit: 'ms', severity: 'error' },
      { name: 'memory-usage', threshold: 50 * 1024 * 1024, unit: 'bytes', severity: 'warning' }, // 50MB
      { name: 'memory-usage', threshold: 100 * 1024 * 1024, unit: 'bytes', severity: 'error' }, // 100MB
    ]
  }

  private setupPerformanceObservers() {
    // Observe navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              this.recordMetric('navigation-timing', entry.duration, {
                type: entry.name,
                loadEventEnd: (entry as PerformanceNavigationTiming).loadEventEnd,
                domContentLoaded: (entry as PerformanceNavigationTiming).domContentLoadedEventEnd,
              })
            }
          })
        })
        navObserver.observe({ entryTypes: ['navigation'] })
        this.observers.set('navigation', navObserver)
      } catch (error) {
        console.warn('Navigation timing observer not supported:', error)
      }

      // Observe paint timing
      try {
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.entryType === 'paint') {
              this.recordMetric(`paint-${entry.name}`, entry.startTime, {
                type: entry.name,
              })
            }
          })
        })
        paintObserver.observe({ entryTypes: ['paint'] })
        this.observers.set('paint', paintObserver)
      } catch (error) {
        console.warn('Paint timing observer not supported:', error)
      }

      // Observe long tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            this.recordMetric('long-task', entry.duration, {
              startTime: entry.startTime,
              name: entry.name,
            })
          })
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.set('longtask', longTaskObserver)
      } catch (error) {
        console.warn('Long task observer not supported:', error)
      }
    }
  }

  // Record a performance metric
  recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    }

    this.metrics.push(metric)
    this.checkBudget(metric)

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${value}ms`, metadata)
    }
  }

  // Start timing a loading stage
  startLoadingStage(name: string) {
    this.loadingStages.set(name, {
      name,
      startTime: performance.now(),
    })
  }

  // End timing a loading stage
  endLoadingStage(name: string) {
    const stage = this.loadingStages.get(name)
    if (stage) {
      stage.endTime = performance.now()
      stage.duration = stage.endTime - stage.startTime
      
      this.recordMetric(`loading-stage-${name}`, stage.duration, {
        stage: name,
        startTime: stage.startTime,
        endTime: stage.endTime,
      })

      this.loadingStages.delete(name)
    }
  }

  // Measure function execution time
  measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    
    this.recordMetric(`function-${name}`, end - start, {
      function: name,
    })

    return result
  }

  // Measure async function execution time
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    
    this.recordMetric(`async-function-${name}`, end - start, {
      function: name,
    })

    return result
  }

  // Check if metric exceeds budget
  private checkBudget(metric: PerformanceMetric) {
    const relevantBudgets = this.budgets.filter(budget => budget.name === metric.name)
    
    relevantBudgets.forEach(budget => {
      if (metric.value > budget.threshold) {
        const message = `Performance budget exceeded: ${metric.name} (${metric.value}${budget.unit}) > ${budget.threshold}${budget.unit}`
        
        if (budget.severity === 'error') {
          console.error(`[Performance Error] ${message}`, metric.metadata)
        } else {
          console.warn(`[Performance Warning] ${message}`, metric.metadata)
        }

        // Emit custom event for performance monitoring
        window.dispatchEvent(new CustomEvent('performance-budget-exceeded', {
          detail: { metric, budget }
        }))
      }
    })
  }

  // Get metrics by name
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(metric => metric.name === name)
    }
    return [...this.metrics]
  }

  // Get average metric value
  getAverageMetric(name: string, timeWindow?: number): number {
    let relevantMetrics = this.getMetrics(name)
    
    if (timeWindow) {
      const cutoff = Date.now() - timeWindow
      relevantMetrics = relevantMetrics.filter(metric => metric.timestamp > cutoff)
    }

    if (relevantMetrics.length === 0) return 0

    const sum = relevantMetrics.reduce((acc, metric) => acc + metric.value, 0)
    return sum / relevantMetrics.length
  }

  // Get performance summary
  getPerformanceSummary() {
    const now = Date.now()
    const last5Minutes = now - 5 * 60 * 1000
    const lastHour = now - 60 * 60 * 1000

    const recentMetrics = this.metrics.filter(m => m.timestamp > last5Minutes)
    const hourlyMetrics = this.metrics.filter(m => m.timestamp > lastHour)

    return {
      totalMetrics: this.metrics.length,
      recentMetrics: recentMetrics.length,
      hourlyMetrics: hourlyMetrics.length,
      averageLoadTime: this.getAverageMetric('proposal-loading', last5Minutes),
      averageApiResponse: this.getAverageMetric('api-response-time', last5Minutes),
      averageRenderTime: this.getAverageMetric('render-time', last5Minutes),
      cacheHitRate: this.calculateCacheHitRate(last5Minutes),
      longTasks: this.getMetrics('long-task').filter(m => m.timestamp > last5Minutes).length,
      memoryUsage: this.getCurrentMemoryUsage(),
      budgets: this.budgets.map(budget => ({
        ...budget,
        currentValue: this.getAverageMetric(budget.name, last5Minutes),
        exceeded: this.getAverageMetric(budget.name, last5Minutes) > budget.threshold
      }))
    }
  }

  // Calculate cache hit rate
  private calculateCacheHitRate(timeWindow: number): number {
    const cacheHits = this.getMetrics('cache-hit').filter(m => m.timestamp > timeWindow).length
    const cacheMisses = this.getMetrics('cache-miss').filter(m => m.timestamp > timeWindow).length
    const total = cacheHits + cacheMisses
    
    return total > 0 ? cacheHits / total : 0
  }

  // Get current memory usage (if available)
  private getCurrentMemoryUsage(): number | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return memory.usedJSHeapSize
    }
    return null
  }

  // Record cache hit
  recordCacheHit(cacheKey: string, hitTime: number) {
    this.recordMetric('cache-hit', hitTime, { cacheKey })
  }

  // Record cache miss
  recordCacheMiss(cacheKey: string, missTime: number) {
    this.recordMetric('cache-miss', missTime, { cacheKey })
  }

  // Record API response time
  recordApiResponse(endpoint: string, responseTime: number, statusCode: number) {
    this.recordMetric('api-response-time', responseTime, {
      endpoint,
      statusCode,
    })
  }

  // Record render time
  recordRenderTime(component: string, renderTime: number) {
    this.recordMetric('render-time', renderTime, {
      component,
    })
  }

  // Record user interaction delay
  recordInteractionDelay(action: string, delay: number) {
    this.recordMetric('interaction-delay', delay, {
      action,
    })
  }

  // Record proposal loading metrics
  recordProposalLoading(stage: string, duration: number, proposalCount: number) {
    this.recordMetric('proposal-loading', duration, {
      stage,
      proposalCount,
    })
  }

  // Record virtual scrolling performance
  recordVirtualScrollPerformance(itemCount: number, visibleCount: number, scrollTime: number) {
    this.recordMetric('virtual-scroll', scrollTime, {
      itemCount,
      visibleCount,
      efficiency: visibleCount / itemCount,
    })
  }

  // Clear all metrics
  clearMetrics() {
    this.metrics = []
    this.loadingStages.clear()
  }

  // Export metrics for analysis
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      summary: this.getPerformanceSummary(),
      timestamp: Date.now(),
    }, null, 2)
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
  }
}

// Create singleton instance
export const performanceService = new PerformanceService()

// Export types
export type { PerformanceMetric, PerformanceBudget, LoadingStage }
export default performanceService
