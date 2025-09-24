import { useState, useEffect } from 'react'
import { performanceService } from '../services/performanceService'

interface PerformanceMonitorProps {
  className?: string
}

const PerformanceMonitor = ({ className = '' }: PerformanceMonitorProps) => {
  const [metrics, setMetrics] = useState(performanceService.getPerformanceSummary())
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceService.getPerformanceSummary())
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        {isVisible ? 'Hide' : 'Show'} Perf
      </button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[300px]">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Performance Metrics</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Cache Hit Rate:</span>
              <span className="font-mono text-green-600">
                {(metrics.cacheHitRate * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Avg Load Time:</span>
              <span className="font-mono text-blue-600">
                {metrics.averageLoadTime.toFixed(0)}ms
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Memory Usage:</span>
              <span className="font-mono text-purple-600">
                {metrics.memoryUsage ? `${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB` : 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Long Tasks:</span>
              <span className="font-mono text-orange-600">
                {metrics.longTasks}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Total Metrics:</span>
              <span className="font-mono text-gray-600">
                {metrics.totalMetrics}
              </span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Budget Status:
            </div>
            {metrics.budgets.map((budget, index) => (
              <div key={index} className="flex justify-between text-xs mt-1">
                <span className="text-gray-600 dark:text-gray-300">{budget.name}:</span>
                <span className={`font-mono ${budget.exceeded ? 'text-red-600' : 'text-green-600'}`}>
                  {budget.currentValue.toFixed(0)}{budget.unit} / {budget.threshold}{budget.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PerformanceMonitor
