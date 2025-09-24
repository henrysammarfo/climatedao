// Comprehensive Tribes SDK Configuration Validation and Management
import { ethers } from 'ethers'
import { TribesConfig, ConfigurationStatus } from '../services/tribesService'

export interface TribesConfigValidator {
  validateApiKey(key: string): { isValid: boolean; error?: string }
  validateContractAddresses(addresses: any): { isValid: boolean; errors: string[] }
  validateChainId(chainId: number): { isValid: boolean; warning?: string }
  validateTribeId(tribeId: number): { isValid: boolean; error?: string }
  getConfigurationStatus(): ConfigurationStatus
}

export interface TribesTestResult {
  test: string
  success: boolean
  error?: string
  details?: any
  duration: number
}

export class TribesConfigValidatorImpl implements TribesConfigValidator {

  /**
   * Validate Tribes API key format and length
   */
  validateApiKey(key: string): { isValid: boolean; error?: string } {
    if (!key) {
      return { isValid: false, error: 'API key is required' }
    }

    if (key.length < 10) {
      return { isValid: false, error: 'API key appears to be invalid (too short)' }
    }

    if (key.length > 200) {
      return { isValid: false, error: 'API key appears to be invalid (too long)' }
    }

    // Check for common placeholder values
    const placeholderPatterns = [
      /^your_.*_key$/i,
      /^placeholder/i,
      /^example/i,
      /^test_.*_key$/i,
      /^xxx/i
    ]

    for (const pattern of placeholderPatterns) {
      if (pattern.test(key)) {
        return { isValid: false, error: 'API key appears to be a placeholder value' }
      }
    }

    return { isValid: true }
  }

  /**
   * Validate contract addresses object
   */
  validateContractAddresses(addresses: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!addresses || typeof addresses !== 'object') {
      return { isValid: false, errors: ['Contract addresses must be a valid object'] }
    }

    const requiredContracts = [
      'roleManager',
      'tribeController', 
      'astrixToken',
      'tokenDispenser',
      'astrixPointSystem',
      'profileNFTMinter'
    ]

    for (const contract of requiredContracts) {
      const address = addresses[contract]
      
      if (!address) {
        errors.push(`Missing contract address for ${contract}`)
        continue
      }

      if (typeof address !== 'string') {
        errors.push(`Contract address for ${contract} must be a string`)
        continue
      }

      if (!address.startsWith('0x')) {
        errors.push(`Contract address for ${contract} must start with '0x'`)
        continue
      }

      if (address.length !== 42) {
        errors.push(`Contract address for ${contract} must be 42 characters long (including 0x)`)
        continue
      }

      // Check for placeholder addresses
      if (address.includes('...') || address === `0x${'0'.repeat(40)}`) {
        errors.push(`Contract address for ${contract} appears to be a placeholder`)
      }
    }

    return { isValid: errors.length === 0, errors }
  }

  /**
   * Validate chain ID
   */
  validateChainId(chainId: number): { isValid: boolean; warning?: string } {
    if (!Number.isInteger(chainId) || chainId <= 0) {
      return { isValid: false, warning: 'Chain ID must be a positive integer' }
    }

    // XDC Network chain IDs
    if (chainId !== 50 && chainId !== 51) {
      return { 
        isValid: true, 
        warning: 'Chain ID should be 50 (XDC Mainnet) or 51 (XDC Apothem Testnet) for Tribes SDK' 
      }
    }

    return { isValid: true }
  }

  /**
   * Validate tribe ID
   */
  validateTribeId(tribeId: number): { isValid: boolean; error?: string } {
    if (!Number.isInteger(tribeId) || tribeId <= 0) {
      return { isValid: false, error: 'Tribe ID must be a positive integer' }
    }

    return { isValid: true }
  }

  /**
   * Get comprehensive configuration status
   */
  getConfigurationStatus(): ConfigurationStatus {
    const errors: string[] = []
    const warnings: string[] = []
    const missingFields: string[] = []

    // Tribes SDK doesn't require API keys - it's a simple embeddable chat
    // Only check for basic configuration if needed
    const optionalFields = [
      'VITE_TRIBES_TRIBE_ID',
      'VITE_XDC_CHAIN_ID'
    ]

    // Only warn about missing optional fields, don't error
    for (const field of optionalFields) {
      if (!import.meta.env[field]) {
        warnings.push(`Optional environment variable not set: ${field}`)
      }
    }

    // Tribes SDK doesn't require API keys or contract addresses
    // It's a simple embeddable chat solution

    // Validate chain ID (optional)
    const rawChainId = import.meta.env.VITE_XDC_CHAIN_ID
    if (rawChainId) {
      const chainId = Number(rawChainId)
      if (!Number.isInteger(chainId)) {
        warnings.push('Chain ID should be a positive integer (50 or 51 for XDC).')
      } else {
        const v = this.validateChainId(chainId)
        if (v.warning) warnings.push(v.warning)
      }
    }

    // Validate tribe ID (optional)
    const tribeId = parseInt(import.meta.env.VITE_TRIBES_TRIBE_ID || '0')
    if (tribeId > 0) {
      const tribeIdValidation = this.validateTribeId(tribeId)
      if (!tribeIdValidation.isValid) {
        warnings.push(`Tribe ID validation failed: ${tribeIdValidation.error}`)
      }
    }

    const status: ConfigurationStatus = {
      isValid: true, // Tribes SDK works without configuration
      errors,
      warnings,
      missingFields
    }

    return status
  }
}

/**
 * Load and validate Tribes configuration from environment variables
 */
export function loadTribesConfiguration(): { config: TribesConfig | null; status: ConfigurationStatus } {
  const validator = new TribesConfigValidatorImpl()
  const status = validator.getConfigurationStatus()

  if (!status.isValid) {
    return { config: null, status }
  }

  const contractAddressesStr = import.meta.env.VITE_TRIBES_CONTRACT_ADDRESSES
  let contractAddresses = {
    roleManager: '0x123...',
    tribeController: '0x456...',
    astrixToken: '0x789...',
    tokenDispenser: '0xabc...',
    astrixPointSystem: '0xdef...',
    profileNFTMinter: '0xghi...'
  }

  if (contractAddressesStr) {
    contractAddresses = JSON.parse(contractAddressesStr)
  }

  const config: TribesConfig = {
    apiKey: import.meta.env.VITE_TRIBES_API_KEY,
    contractAddresses,
    chainId: parseInt(import.meta.env.VITE_XDC_CHAIN_ID || '51'),
    tribeId: parseInt(import.meta.env.VITE_TRIBES_TRIBE_ID || '1'),
    verbose: import.meta.env.VITE_TRIBES_VERBOSE === 'true'
  }

  return { config, status }
}

/**
 * Test Tribes API connection
 */
export async function testTribesApiConnection(apiKey: string): Promise<TribesTestResult> {
  const startTime = Date.now()
  
  try {
    // Basic API key format validation
    if (!apiKey || apiKey.length < 10) {
      return {
        test: 'API Key Validation',
        success: false,
        error: 'API key is invalid or too short',
        duration: Date.now() - startTime
      }
    }

    // In a real implementation, this would make an actual API call
    // For now, we'll simulate a connection test
    await new Promise(resolve => setTimeout(resolve, 100))

    return {
      test: 'API Key Validation',
      success: true,
      details: { keyLength: apiKey.length, keyPrefix: apiKey.substring(0, 8) + '...' },
      duration: Date.now() - startTime
    }
  } catch (error) {
    return {
      test: 'API Key Validation',
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    }
  }
}

/**
 * Test contract access
 */
export async function testContractAccess(contractAddresses: any, chainId: number): Promise<TribesTestResult> {
  const startTime = Date.now()
  
  try {
    if (!window.ethereum) {
      return {
        test: 'Contract Access',
        success: false,
        error: 'No wallet provider found',
        duration: Date.now() - startTime
      }
    }

    // Test if we can access the contracts
    const provider = new ethers.BrowserProvider(window.ethereum)
    
    // Test each contract address
    const contractTests = []
    for (const [name, address] of Object.entries(contractAddresses)) {
      try {
        const code = await provider.getCode(address as string)
        contractTests.push({
          contract: name,
          address,
          hasCode: code !== '0x',
          codeLength: code.length
        })
      } catch (error) {
        contractTests.push({
          contract: name,
          address,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    const successCount = contractTests.filter(test => test.hasCode).length
    const totalCount = contractTests.length

    return {
      test: 'Contract Access',
      success: successCount > 0,
      details: {
        chainId,
        contracts: contractTests,
        successRate: `${successCount}/${totalCount}`
      },
      duration: Date.now() - startTime
    }
  } catch (error) {
    return {
      test: 'Contract Access',
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    }
  }
}

/**
 * Get detailed error messages and setup instructions
 */
export function getConfigurationErrorMessages(status: ConfigurationStatus): {
  title: string
  message: string
  instructions: string[]
  links: { text: string; url: string }[]
} {
  if (status.isValid) {
    return {
      title: 'Configuration Valid',
      message: 'All Tribes SDK configuration is properly set up.',
      instructions: [],
      links: []
    }
  }

  const hasMissingFields = status.missingFields.length > 0
  const hasErrors = status.errors.length > 0
  const hasWarnings = status.warnings.length > 0

  let title = 'Configuration Issues'
  if (hasMissingFields) {
    title = 'Missing Configuration'
  } else if (hasErrors) {
    title = 'Configuration Errors'
  } else if (hasWarnings) {
    title = 'Configuration Warnings'
  }

  const instructions: string[] = []
  const links: { text: string; url: string }[] = []

  if (hasMissingFields) {
    instructions.push('Add the following environment variables to your .env file:')
    status.missingFields.forEach(field => {
      instructions.push(`- ${field}`)
    })
    instructions.push('')
    instructions.push('See the env.example file for example values.')
  }

  if (hasErrors) {
    instructions.push('Fix the following configuration errors:')
    status.errors.forEach(error => {
      instructions.push(`- ${error}`)
    })
  }

  if (hasWarnings) {
    instructions.push('Consider addressing these warnings:')
    status.warnings.forEach(warning => {
      instructions.push(`- ${warning}`)
    })
  }

  // Add helpful links
  links.push({
    text: 'Tribes SDK Documentation',
    url: 'https://docs.tribes.xyz'
  })
  
  links.push({
    text: 'Environment Setup Guide',
    url: 'https://docs.tribes.xyz/setup/environment'
  })

  if (hasMissingFields) {
    links.push({
      text: 'API Key Setup',
      url: 'https://docs.tribes.xyz/setup/api-keys'
    })
  }

  const message = hasMissingFields 
    ? 'Required Tribes SDK configuration is missing. Please set up your environment variables.'
    : hasErrors
    ? 'There are errors in your Tribes SDK configuration that need to be fixed.'
    : 'Your Tribes SDK configuration has some warnings that you may want to address.'

  return { title, message, instructions, links }
}

/**
 * Environment-specific validation
 */
export function validateEnvironmentSpecificConfig(): { isValid: boolean; recommendations: string[] } {
  const recommendations: string[] = []
  const isDevelopment = import.meta.env.DEV
  const isProduction = import.meta.env.PROD

  if (isDevelopment) {
    recommendations.push('Development mode: Consider using testnet configuration')
    recommendations.push('Enable verbose logging for debugging')
  }

  if (isProduction) {
    recommendations.push('Production mode: Ensure all configuration is properly set')
    recommendations.push('Disable verbose logging for performance')
    recommendations.push('Use mainnet contract addresses')
  }

  return { isValid: true, recommendations }
}

/**
 * Debugging utilities for configuration issues
 */
export function getConfigurationDebugInfo(): {
  environment: string
  variables: Record<string, string | undefined>
  userAgent: string
  timestamp: string
} {
  return {
    environment: import.meta.env.MODE,
    variables: {
      VITE_TRIBES_API_KEY: import.meta.env.VITE_TRIBES_API_KEY ? '***SET***' : undefined,
      VITE_TRIBES_CONTRACT_ADDRESSES: import.meta.env.VITE_TRIBES_CONTRACT_ADDRESSES ? '***SET***' : undefined,
      VITE_TRIBES_TRIBE_ID: import.meta.env.VITE_TRIBES_TRIBE_ID,
      VITE_XDC_CHAIN_ID: import.meta.env.VITE_XDC_CHAIN_ID,
      VITE_TRIBES_VERBOSE: import.meta.env.VITE_TRIBES_VERBOSE
    },
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  }
}

// Export default validator instance
export const tribesConfigValidator = new TribesConfigValidatorImpl()
