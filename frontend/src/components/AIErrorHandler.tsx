import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, ExternalLink, Wifi, WifiOff, Key, Clock, Server } from 'lucide-react'

interface AIErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  retryCount: number
}

interface AIErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class AIErrorBoundary extends Component<AIErrorBoundaryProps, AIErrorBoundaryState> {
  constructor(props: AIErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<AIErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log error for debugging
    console.error('AI Error Boundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <AIErrorDisplay
          error={this.state.error}
          retryCount={this.state.retryCount}
          onRetry={this.handleRetry}
        />
      )
    }

    return this.props.children
  }
}

interface AIErrorDisplayProps {
  error: Error | null
  retryCount: number
  onRetry: () => void
}

export const AIErrorDisplay: React.FC<AIErrorDisplayProps> = ({ error, retryCount, onRetry }) => {
  const getErrorType = (error: Error | null) => {
    if (!error) return 'unknown'
    
    const message = error.message.toLowerCase()
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

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'auth':
        return <Key className="w-5 h-5 text-red-600" />
      case 'rateLimit':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'network':
        return <WifiOff className="w-5 h-5 text-red-600" />
      case 'model':
        return <Server className="w-5 h-5 text-orange-600" />
      case 'parsing':
        return <AlertTriangle className="w-5 h-5 text-purple-600" />
      default:
        return <AlertTriangle className="w-5 h-5 text-red-600" />
    }
  }

  const getErrorTitle = (type: string) => {
    switch (type) {
      case 'auth':
        return 'Authentication Error'
      case 'rateLimit':
        return 'Rate Limit Exceeded'
      case 'network':
        return 'Connection Error'
      case 'model':
        return 'Model Unavailable'
      case 'parsing':
        return 'Response Format Error'
      default:
        return 'AI Service Error'
    }
  }

  const getErrorDescription = (type: string) => {
    switch (type) {
      case 'auth':
        return 'Your Hugging Face API key is invalid or has insufficient permissions.'
      case 'rateLimit':
        return 'You have exceeded your API usage limit. Please wait before trying again.'
      case 'network':
        return 'Unable to connect to the AI service. Please check your internet connection.'
      case 'model':
        return 'The AI model is currently loading or temporarily unavailable.'
      case 'parsing':
        return 'The AI service returned an unexpected response format.'
      default:
        return 'An unexpected error occurred with the AI service.'
    }
  }

  const getTroubleshootingSteps = (type: string) => {
    switch (type) {
      case 'auth':
        return [
          'Verify your VITE_HF_API_KEY is correctly set in your .env file',
          'Check that your API key starts with "hf_" and is not a placeholder',
          'Ensure your Hugging Face account has the necessary permissions',
          'Visit your Hugging Face settings to verify the token is active'
        ]
      case 'rateLimit':
        return [
          'Wait a few minutes before trying again',
          'Check your Hugging Face usage quota at https://huggingface.co/settings/billing',
          'Consider upgrading to a paid plan for higher limits',
          'Optimize your requests to reduce API usage'
        ]
      case 'network':
        return [
          'Check your internet connection',
          'Verify that Hugging Face services are operational',
          'Try refreshing the page and attempting again',
          'Check if your firewall or network settings are blocking the connection'
        ]
      case 'model':
        return [
          'Wait 1-2 minutes for the model to finish loading',
          'Check the Hugging Face status page for service updates',
          'Try again with a simpler request',
          'Consider using a different model if available'
        ]
      case 'parsing':
        return [
          'Try again with a different request format',
          'Check if the AI service is returning valid responses',
          'Verify your request parameters are correct',
          'Contact support if the issue persists'
        ]
      default:
        return [
          'Check your internet connection',
          'Verify your API key configuration',
          'Try refreshing the page',
          'Contact support if the problem continues'
        ]
    }
  }

  const getRetryDelay = (type: string) => {
    switch (type) {
      case 'rateLimit':
        return '2-5 minutes'
      case 'model':
        return '1-2 minutes'
      case 'network':
        return '30 seconds'
      default:
        return 'immediately'
    }
  }

  const errorType = getErrorType(error)
  const canRetry = errorType !== 'auth' && retryCount < 3

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
      <div className="flex items-start space-x-4">
        {getErrorIcon(errorType)}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            {getErrorTitle(errorType)}
          </h3>
          
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            {getErrorDescription(errorType)}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/40 rounded text-xs font-mono text-red-800 dark:text-red-200">
              {error.message}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                Troubleshooting Steps:
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                {getTroubleshootingSteps(errorType).map((step, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-2 mt-0.5">•</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {errorType === 'rateLimit' && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Rate Limit:</strong> Please wait {getRetryDelay(errorType)} before trying again.
                </p>
              </div>
            )}

            {errorType === 'model' && (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  <strong>Model Loading:</strong> The AI model is being loaded on Hugging Face servers. 
                  This usually takes {getRetryDelay(errorType)}.
                </p>
              </div>
            )}

            <div className="flex items-center space-x-4 pt-2">
              {canRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again ({3 - retryCount} attempts left)</span>
                </button>
              )}
              
              <a
                href="https://huggingface.co/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Hugging Face Settings</span>
              </a>
            </div>

            {import.meta.env.DEV && (
              <details className="mt-4">
                <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                  Debug Information
                </summary>
                <pre className="mt-2 text-xs text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-900/40 p-2 rounded overflow-auto">
                  {JSON.stringify({ errorType, retryCount, error: error?.stack }, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface AIStatusIndicatorProps {
  status: 'connected' | 'disconnected' | 'error' | 'loading'
  lastChecked?: Date
  onRefresh?: () => void
}

export const AIStatusIndicator: React.FC<AIStatusIndicatorProps> = ({ 
  status, 
  lastChecked, 
  onRefresh 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <Wifi className="w-4 h-4 text-green-600" />,
          text: 'AI Service Connected',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-800 dark:text-green-200'
        }
      case 'disconnected':
        return {
          icon: <WifiOff className="w-4 h-4 text-gray-600" />,
          text: 'AI Service Disconnected',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          textColor: 'text-gray-800 dark:text-gray-200'
        }
      case 'error':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
          text: 'AI Service Error',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-800 dark:text-red-200'
        }
      case 'loading':
        return {
          icon: <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />,
          text: 'Checking AI Service...',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-800 dark:text-blue-200'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {config.icon}
          <span className={`text-sm font-medium ${config.textColor}`}>
            {config.text}
          </span>
        </div>
        
        {onRefresh && status !== 'loading' && (
          <button
            onClick={onRefresh}
            className="text-xs px-2 py-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
          >
            Refresh
          </button>
        )}
      </div>
      
      {lastChecked && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Last checked: {lastChecked.toLocaleTimeString()}
        </p>
      )}
    </div>
  )
}

export default AIErrorBoundary
