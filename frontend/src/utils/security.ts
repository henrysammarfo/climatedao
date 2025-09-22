// Security utilities for ClimateDAO

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Validate Ethereum address format
 */
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Validate proposal data
 */
export const validateProposalData = (data: {
  title: string
  description: string
  requestedAmount: number
  duration: number
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!data.title || data.title.length < 5) {
    errors.push('Title must be at least 5 characters long')
  }

  if (!data.description || data.description.length < 20) {
    errors.push('Description must be at least 20 characters long')
  }

  if (data.requestedAmount < 1000 || data.requestedAmount > 100000000) {
    errors.push('Requested amount must be between $1,000 and $100,000,000')
  }

  if (data.duration < 1 || data.duration > 3650) {
    errors.push('Duration must be between 1 and 3650 days')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map()
  private readonly maxAttempts: number
  private readonly windowMs: number

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
  }

  isAllowed(key: string): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs)
    
    if (validAttempts.length >= this.maxAttempts) {
      return false
    }

    validAttempts.push(now)
    this.attempts.set(key, validAttempts)
    return true
  }

  reset(key: string): void {
    this.attempts.delete(key)
  }
}

/**
 * Secure random string generator
 */
export const generateSecureId = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const crypto = window.crypto || (window as any).msCrypto
  
  if (crypto && crypto.getRandomValues) {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length]
    }
  } else {
    // Fallback for older browsers
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }
  }
  
  return result
}

/**
 * Validate and sanitize URL
 */
export const validateUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url)
    return ['http:', 'https:'].includes(parsedUrl.protocol)
  } catch {
    return false
  }
}

/**
 * Content Security Policy helpers
 */
export const getCSPNonce = (): string => {
  return generateSecureId(16)
}

/**
 * Input validation for different field types
 */
export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  url: (url: string): boolean => {
    return validateUrl(url)
  },

  positiveNumber: (num: number): boolean => {
    return num > 0 && !isNaN(num) && isFinite(num)
  },

  textLength: (text: string, min: number, max: number): boolean => {
    return text.length >= min && text.length <= max
  }
}
