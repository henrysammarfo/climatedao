// Development-only Tribes Configuration Testing Component
import React, { useState, useEffect } from 'react'
import {
  Settings,
  Play,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Copy,
  ExternalLink,
  Wifi,
  Key,
  FileText,
  Database,
  Zap
} from 'lucide-react'
import { TribesIntegration } from '../services/tribesService'
import { 
  tribesConfigValidator, 
  testTribesApiConnection, 
  testContractAccess,
  getConfigurationDebugInfo
} from '../utils/tribesConfig'
import { tribesAnalytics } from '../services/tribesAnalytics'
import toast from 'react-hot-toast'

interface TestResult {
  test: string
  success: boolean
  error?: string
  details?: any
  duration: number
  timestamp: number
}

interface ConfigurationBackup {
  timestamp: number
  environment: string
  variables: Record<string, string>
  notes?: string
}

const TribesConfigTester: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string | null>(null)
  const [configBackups, setConfigBackups] = useState<ConfigurationBackup[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Only show in development mode
  useEffect(() => {
    setIsVisible(import.meta.env.DEV)
  }, [])

  // Load configuration backups from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('tribes_config_backups')
    if (stored) {
      try {
        setConfigBackups(JSON.parse(stored))
      } catch (error) {
        console.error('Failed to load configuration backups:', error)
      }
    }
  }, [])

  const runTest = async (testName: string, testFunction: () => Promise<any>): Promise<TestResult> => {
    const startTime = Date.now()
    setCurrentTest(testName)
    
    try {
      const result = await testFunction()
      const duration = Date.now() - startTime
      
      const testResult: TestResult = {
        test: testName,
        success: true,
        details: result,
        duration,
        timestamp: Date.now()
      }
      
      setTestResults(prev => [testResult, ...prev.slice(0, 19)]) // Keep last 20 results
      return testResult
    } catch (error) {
      const duration = Date.now() - startTime
      
      const testResult: TestResult = {
        test: testName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
        timestamp: Date.now()
      }
      
      setTestResults(prev => [testResult, ...prev.slice(0, 19)])
      return testResult
    } finally {
      setCurrentTest(null)
    }
  }

  const testApiKey = async () => {
    const apiKey = import.meta.env.VITE_TRIBES_API_KEY
    if (!apiKey) {
      throw new Error('API key not found in environment variables')
    }
    return await testTribesApiConnection(apiKey)
  }

  const testContractAddresses = async () => {
    const contractAddressesStr = import.meta.env.VITE_TRIBES_CONTRACT_ADDRESSES
    if (!contractAddressesStr) {
      throw new Error('Contract addresses not found in environment variables')
    }
    
    const contractAddresses = JSON.parse(contractAddressesStr)
    const chainId = parseInt(import.meta.env.VITE_XDC_CHAIN_ID || '51')
    
    return await testContractAccess(contractAddresses, chainId)
  }

  const testSDKInitialization = async () => {
    return await TribesIntegration.testTribesConnection()
  }

  const testConfigurationValidation = async () => {
    const startTime = Date.now()
    const status = tribesConfigValidator.getConfigurationStatus()
    const duration = Date.now() - startTime
    
    // Track configuration validation
    tribesAnalytics.trackConfigurationValidation(status, duration)
    
    return {
      status,
      duration,
      isValid: status.isValid,
      errors: status.errors,
      warnings: status.warnings,
      missingFields: status.missingFields
    }
  }

  const testNetworkConnectivity = async () => {
    const startTime = Date.now()
    
    // Test basic network connectivity
    const response = await fetch('https://api.tribes.xyz/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const duration = Date.now() - startTime
    
    if (!response.ok) {
      throw new Error(`Network test failed: ${response.status} ${response.statusText}`)
    }
    
    return {
      status: response.status,
      responseTime: duration,
      headers: Object.fromEntries(response.headers.entries())
    }
  }

  const testWalletConnection = async () => {
    if (!window.ethereum) {
      throw new Error('No wallet provider found')
    }
    
    const startTime = Date.now()
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      
      const duration = Date.now() - startTime
      
      return {
        connected: accounts.length > 0,
        accounts: accounts.length,
        chainId: parseInt(chainId, 16),
        expectedChainId: parseInt(import.meta.env.VITE_XDC_CHAIN_ID || '51'),
        duration
      }
    } catch (error) {
      throw new Error(`Wallet connection test failed: ${error}`)
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])
    
    const tests = [
      { name: 'Configuration Validation', fn: testConfigurationValidation },
      { name: 'API Key Validation', fn: testApiKey },
      { name: 'Contract Addresses', fn: testContractAddresses },
      { name: 'Network Connectivity', fn: testNetworkConnectivity },
      { name: 'Wallet Connection', fn: testWalletConnection },
      { name: 'SDK Initialization', fn: testSDKInitialization }
    ]
    
    for (const test of tests) {
      await runTest(test.name, test.fn)
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setIsRunning(false)
    toast.success('All tests completed!')
  }

  const runSingleTest = async (testName: string) => {
    const testMap: Record<string, () => Promise<any>> = {
      'Configuration Validation': testConfigurationValidation,
      'API Key Validation': testApiKey,
      'Contract Addresses': testContractAddresses,
      'Network Connectivity': testNetworkConnectivity,
      'Wallet Connection': testWalletConnection,
      'SDK Initialization': testSDKInitialization
    }
    
    const testFunction = testMap[testName]
    if (testFunction) {
      await runTest(testName, testFunction)
    }
  }

  const createConfigurationBackup = () => {
    const backup: ConfigurationBackup = {
      timestamp: Date.now(),
      environment: import.meta.env.MODE,
      variables: {
        VITE_TRIBES_API_KEY: import.meta.env.VITE_TRIBES_API_KEY ? '***SET***' : 'NOT_SET',
        VITE_TRIBES_CONTRACT_ADDRESSES: import.meta.env.VITE_TRIBES_CONTRACT_ADDRESSES ? '***SET***' : 'NOT_SET',
        VITE_TRIBES_TRIBE_ID: import.meta.env.VITE_TRIBES_TRIBE_ID,
        VITE_XDC_CHAIN_ID: import.meta.env.VITE_XDC_CHAIN_ID,
        VITE_TRIBES_VERBOSE: import.meta.env.VITE_TRIBES_VERBOSE
      },
      notes: `Backup created at ${new Date().toLocaleString()}`
    }
    
    const newBackups = [backup, ...configBackups.slice(0, 9)] // Keep last 10 backups
    setConfigBackups(newBackups)
    localStorage.setItem('tribes_config_backups', JSON.stringify(newBackups))
    toast.success('Configuration backup created!')
  }

  const exportConfiguration = () => {
    const debugInfo = getConfigurationDebugInfo()
    const dataStr = JSON.stringify(debugInfo, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `tribes-config-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    URL.revokeObjectURL(url)
    toast.success('Configuration exported!')
  }

  const copyDebugInfo = () => {
    const debugInfo = getConfigurationDebugInfo()
    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
    toast.success('Debug info copied to clipboard!')
  }

  const getTestIcon = (testName: string) => {
    switch (testName) {
      case 'Configuration Validation':
        return <Settings className="w-4 h-4" />
      case 'API Key Validation':
        return <Key className="w-4 h-4" />
      case 'Contract Addresses':
        return <Database className="w-4 h-4" />
      case 'Network Connectivity':
        return <Wifi className="w-4 h-4" />
      case 'Wallet Connection':
        return <Key className="w-4 h-4" />
      case 'SDK Initialization':
        return <Zap className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Tribes Config Tester</h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Quick Actions */}
          <div className="flex space-x-2">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex-1 btn-primary text-sm disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run All Tests
                </>
              )}
            </button>
            
            <button
              onClick={createConfigurationBackup}
              className="btn-outline text-sm"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* Individual Tests */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Individual Tests:</h4>
            {[
              'Configuration Validation',
              'API Key Validation', 
              'Contract Addresses',
              'Network Connectivity',
              'Wallet Connection',
              'SDK Initialization'
            ].map((testName) => (
              <button
                key={testName}
                onClick={() => runSingleTest(testName)}
                disabled={isRunning || currentTest === testName}
                className="w-full flex items-center justify-between p-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="flex items-center space-x-2">
                  {getTestIcon(testName)}
                  <span>{testName}</span>
                </div>
                {currentTest === testName && (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                )}
              </button>
            ))}
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Test Results:</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {testResults.slice(0, 5).map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 text-xs rounded ${
                      result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {result.success ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      <span className="font-medium">{result.test}</span>
                    </div>
                    <span>{result.duration}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Options */}
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>
            
            {showAdvanced && (
              <div className="mt-2 space-y-2">
                <button
                  onClick={exportConfiguration}
                  className="w-full flex items-center space-x-2 p-2 text-sm border rounded hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Configuration</span>
                </button>
                
                <button
                  onClick={copyDebugInfo}
                  className="w-full flex items-center space-x-2 p-2 text-sm border rounded hover:bg-gray-50"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Debug Info</span>
                </button>
                
                <a
                  href="https://docs.tribes.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center space-x-2 p-2 text-sm border rounded hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Documentation</span>
                </a>
              </div>
            )}
          </div>

          {/* Configuration Backups */}
          {configBackups.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Recent Backups:</h4>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {configBackups.slice(0, 3).map((backup, index) => (
                  <div key={index} className="text-xs text-gray-600 p-1 bg-gray-50 rounded">
                    {new Date(backup.timestamp).toLocaleString()} - {backup.environment}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TribesConfigTester
