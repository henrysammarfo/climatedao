// Comprehensive Tribes SDK Error Handling Component
import React, { Component, ReactNode } from 'react'
import { 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink, 
  Settings, 
  Wifi, 
  Shield, 
  Key,
  FileText,
  HelpCircle
} from 'lucide-react'
import { getConfigurationDebugInfo } from '../utils/tribesConfig'

interface TribesErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  retryCount: number
  lastRetryTime: number | null
}

interface TribesErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

/**
 * Error boundary component that catches Tribes-specific errors
 * and displays helpful error messages with setup instructions
 */
export class TribesErrorBoundary extends Component<TribesErrorBoundaryProps, TribesErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null

  constructor(props: TribesErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastRetryTime: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<TribesErrorBoundaryState> {
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
    console.error('Tribes Error Boundary caught an error:', error, errorInfo)
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }
  }

  handleRetry = () => {
    const { retryCount } = this.state
    const maxRetries = 3
    
    if (retryCount >= maxRetries) {
      return
    }

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, retryCount) * 1000

    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        lastRetryTime: Date.now()
      }))
    }, delay)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastRetryTime: null
    })
  }

  getErrorType = (error: Error): string => {
    const message = error.message.toLowerCase()
    
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

  getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case 'configuration':
        return <Settings className="w-6 h-6" />
      case 'network':
        return <Wifi className="w-6 h-6" />
      case 'permission':
        return <Shield className="w-6 h-6" />
      case 'sdk':
        return <Key className="w-6 h-6" />
      case 'wallet':
        return <Key className="w-6 h-6" />
      default:
        return <AlertTriangle className="w-6 h-6" />
    }
  }

  getErrorColor = (errorType: string) => {
    switch (errorType) {
      case 'configuration':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'network':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'permission':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'sdk':
        return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'wallet':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  getErrorTitle = (errorType: string) => {
    switch (errorType) {
      case 'configuration':
        return 'Configuration Error'
      case 'network':
        return 'Network Connection Error'
      case 'permission':
        return 'Permission Denied'
      case 'sdk':
        return 'SDK Initialization Error'
      case 'wallet':
        return 'Wallet Connection Error'
      default:
        return 'Tribes SDK Error'
    }
  }

  getErrorInstructions = (errorType: string) => {
    switch (errorType) {
      case 'configuration':
        return [
          'Check your environment variables in the .env file',
          'Ensure all required Tribes configuration is set',
          'Verify API key format and validity',
          'Check contract addresses are correct',
          'Make sure chain ID matches your network'
        ]
      case 'network':
        return [
          'Check your internet connection',
          'Verify Tribes services are accessible',
          'Try switching networks or VPN',
          'Check if there are any firewall restrictions',
          'Wait a moment and try again'
        ]
      case 'permission':
        return [
          'Verify your API key has required permissions',
          'Check if your account has access to the tribe',
          'Ensure you have the necessary roles',
          'Contact tribe administrators if needed',
          'Try refreshing your API key'
        ]
      case 'sdk':
        return [
          'Ensure Tribes SDK is properly installed',
          'Check SDK version compatibility',
          'Verify all dependencies are up to date',
          'Try clearing browser cache and reloading',
          'Check browser console for additional errors'
        ]
      case 'wallet':
        return [
          'Make sure your wallet is connected',
          'Check if you\'re on the correct network',
          'Verify wallet has sufficient funds for gas',
          'Try reconnecting your wallet',
          'Check wallet permissions and settings'
        ]
      default:
        return [
          'Check the browser console for more details',
          'Try refreshing the page',
          'Clear browser cache and cookies',
          'Contact support if the issue persists'
        ]
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const errorType = this.getErrorType(this.state.error)
      const colorClasses = this.getErrorColor(errorType)
      const Icon = this.getErrorIcon(errorType)
      const title = this.getErrorTitle(errorType)
      const instructions = this.getErrorInstructions(errorType)
      const { retryCount, lastRetryTime } = this.state

      return (
        <div className={`card border-2 ${colorClasses}`}>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {Icon}
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="mb-4">
                {this.state.error.message || 'An unexpected error occurred with the Tribes SDK.'}
              </p>

              {/* Error Details */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">Troubleshooting Steps:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ul>
              </div>

              {/* Retry Information */}
              {retryCount > 0 && (
                <div className="mb-4 p-3 bg-white/50 rounded-lg">
                  <p className="text-sm">
                    Retry attempt {retryCount} of 3
                    {lastRetryTime && (
                      <span className="text-gray-500 ml-2">
                        (Last retry: {new Date(lastRetryTime).toLocaleTimeString()})
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={this.handleRetry}
                  disabled={retryCount >= 3}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-current rounded-lg hover:bg-opacity-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry ({3 - retryCount} attempts left)</span>
                </button>

                <button
                  onClick={this.handleReset}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-current rounded-lg hover:bg-opacity-10 transition-colors"
                >
                  <span>Reset</span>
                </button>

                {import.meta.env.DEV && (
                  <button
                    onClick={() => {
                      const debugInfo = getConfigurationDebugInfo()
                      console.log('Tribes Debug Info:', debugInfo)
                      alert('Debug info logged to console')
                    }}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-current rounded-lg hover:bg-opacity-10 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Debug Info</span>
                  </button>
                )}
              </div>

              {/* Helpful Links */}
              <div className="mt-4 pt-4 border-t border-current border-opacity-20">
                <h4 className="font-medium mb-2">Get Help:</h4>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="https://docs.tribes.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-sm underline hover:no-underline"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Documentation</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  
                  <a
                    href="https://discord.gg/tribes"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-sm underline hover:no-underline"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>Community Support</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  
                  <a
                    href="https://tribes.xyz/support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-sm underline hover:no-underline"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>Contact Support</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

interface TribesStatusIndicatorProps {
  status: 'connected' | 'disconnected' | 'error' | 'loading' | 'configuration-error'
  className?: string
}

/**
 * Real-time Tribes SDK status indicator component
 */
export const TribesStatusIndicator: React.FC<TribesStatusIndicatorProps> = ({ 
  status, 
  className = '' 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <div className="w-2 h-2 bg-green-500 rounded-full" />,
          text: 'Tribes Connected',
          color: 'text-green-600'
        }
      case 'disconnected':
        return {
          icon: <div className="w-2 h-2 bg-gray-400 rounded-full" />,
          text: 'Tribes Disconnected',
          color: 'text-gray-600'
        }
      case 'error':
        return {
          icon: <div className="w-2 h-2 bg-red-500 rounded-full" />,
          text: 'Tribes Error',
          color: 'text-red-600'
        }
      case 'loading':
        return {
          icon: <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />,
          text: 'Connecting...',
          color: 'text-yellow-600'
        }
      case 'configuration-error':
        return {
          icon: <div className="w-2 h-2 bg-orange-500 rounded-full" />,
          text: 'Config Error',
          color: 'text-orange-600'
        }
      default:
        return {
          icon: <div className="w-2 h-2 bg-gray-400 rounded-full" />,
          text: 'Unknown Status',
          color: 'text-gray-600'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {config.icon}
      <span className={`text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    </div>
  )
}

// Export default error boundary for easy use
export default TribesErrorBoundary
