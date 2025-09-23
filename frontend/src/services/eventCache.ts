// Event Cache Service - Manages blockchain event fetching efficiently
import { UIProposal } from '../types/proposal'

export type CachedProposalData = UIProposal & { timestamp: number }

export class EventCache {
  private static readonly CACHE_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes
  private static readonly MAX_CACHE_SIZE = 100 // Maximum number of proposals to cache

  /**
   * Generate namespaced cache key for chain and DAO address
   */
  private static getCacheKey(chainId: number, daoAddress: string, key: string): string {
    return `climate_dao_${chainId}_${daoAddress}_${key}`
  }

  /**
   * Get the last fetched block number from localStorage
   */
  static getLastFetchedBlock(chainId: number, daoAddress: string): number {
    try {
      const lastBlockKey = this.getCacheKey(chainId, daoAddress, 'last_block')
      const lastBlock = localStorage.getItem(lastBlockKey)
      return lastBlock ? parseInt(lastBlock, 10) : 0
    } catch (error) {
      console.error('Failed to get last fetched block from localStorage:', error)
      return 0
    }
  }

  /**
   * Set the last fetched block number in localStorage
   */
  static setLastFetchedBlock(chainId: number, daoAddress: string, blockNumber: number): void {
    try {
      const lastBlockKey = this.getCacheKey(chainId, daoAddress, 'last_block')
      localStorage.setItem(lastBlockKey, blockNumber.toString())
    } catch (error) {
      console.error('Failed to set last fetched block in localStorage:', error)
    }
  }

  /**
   * Get cached proposal data from localStorage
   */
  static getCachedProposals(chainId: number, daoAddress: string): CachedProposalData[] {
    try {
      const cacheKey = this.getCacheKey(chainId, daoAddress, 'event_cache')
      const cached = localStorage.getItem(cacheKey)
      if (!cached) return []

      const data = JSON.parse(cached)
      const now = Date.now()

      // Check if cache is expired
      if (now - data.timestamp > this.CACHE_EXPIRY_MS) {
        this.clearCache(chainId, daoAddress)
        return []
      }

      return data.proposals || []
    } catch (error) {
      console.error('Failed to get cached proposals from localStorage:', error)
      return []
    }
  }

  /**
   * Set cached proposal data in localStorage
   */
  static setCachedProposals(chainId: number, daoAddress: string, proposals: CachedProposalData[]): void {
    try {
      // Limit cache size to prevent localStorage from growing too large
      const limitedProposals = proposals.slice(0, this.MAX_CACHE_SIZE)
      
      const data = {
        proposals: limitedProposals,
        timestamp: Date.now()
      }

      const cacheKey = this.getCacheKey(chainId, daoAddress, 'event_cache')
      localStorage.setItem(cacheKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to set cached proposals in localStorage:', error)
    }
  }

  /**
   * Add a new proposal to the cache
   */
  static addProposalToCache(chainId: number, daoAddress: string, proposal: CachedProposalData): void {
    try {
      const cached = this.getCachedProposals(chainId, daoAddress)
      
      // Check if proposal already exists
      const existingIndex = cached.findIndex(p => p.id === proposal.id)
      if (existingIndex >= 0) {
        // Update existing proposal
        cached[existingIndex] = { ...proposal, timestamp: Date.now() }
      } else {
        // Add new proposal at the beginning (newest first)
        cached.unshift({ ...proposal, timestamp: Date.now() })
      }

      this.setCachedProposals(chainId, daoAddress, cached)
    } catch (error) {
      console.error('Failed to add proposal to cache:', error)
    }
  }

  /**
   * Update a proposal in the cache
   */
  static updateProposalInCache(chainId: number, daoAddress: string, proposalId: number, updates: Partial<CachedProposalData>): void {
    try {
      const cached = this.getCachedProposals(chainId, daoAddress)
      const index = cached.findIndex(p => p.id === proposalId)
      
      if (index >= 0) {
        cached[index] = { ...cached[index], ...updates, timestamp: Date.now() }
        this.setCachedProposals(chainId, daoAddress, cached)
      }
    } catch (error) {
      console.error('Failed to update proposal in cache:', error)
    }
  }

  /**
   * Clear all cached data for a specific chain and DAO
   */
  static clearCache(chainId: number, daoAddress: string): void {
    try {
      const cacheKey = this.getCacheKey(chainId, daoAddress, 'event_cache')
      const lastBlockKey = this.getCacheKey(chainId, daoAddress, 'last_block')
      localStorage.removeItem(cacheKey)
      localStorage.removeItem(lastBlockKey)
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  /**
   * Check if cache is valid (not expired)
   */
  static isCacheValid(chainId: number, daoAddress: string): boolean {
    try {
      const cacheKey = this.getCacheKey(chainId, daoAddress, 'event_cache')
      const cached = localStorage.getItem(cacheKey)
      if (!cached) return false

      const data = JSON.parse(cached)
      const now = Date.now()
      
      return now - data.timestamp <= this.CACHE_EXPIRY_MS
    } catch (error) {
      console.error('Failed to check cache validity:', error)
      return false
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(chainId: number, daoAddress: string): {
    hasCache: boolean
    isValid: boolean
    proposalCount: number
    lastUpdated?: Date
  } {
    try {
      const cacheKey = this.getCacheKey(chainId, daoAddress, 'event_cache')
      const cached = localStorage.getItem(cacheKey)
      if (!cached) {
        return { hasCache: false, isValid: false, proposalCount: 0 }
      }

      const data = JSON.parse(cached)
      const isValid = this.isCacheValid(chainId, daoAddress)
      
      return {
        hasCache: true,
        isValid,
        proposalCount: data.proposals?.length || 0,
        lastUpdated: new Date(data.timestamp)
      }
    } catch (error) {
      console.error('Failed to get cache stats:', error)
      return { hasCache: false, isValid: false, proposalCount: 0 }
    }
  }

  /**
   * Merge new proposals with cached ones, avoiding duplicates
   */
  static mergeProposals(newProposals: CachedProposalData[], cachedProposals: CachedProposalData[]): CachedProposalData[] {
    const merged = [...cachedProposals]
    
    for (const newProposal of newProposals) {
      const existingIndex = merged.findIndex(p => p.id === newProposal.id)
      if (existingIndex >= 0) {
        // Update existing proposal with newer data
        merged[existingIndex] = { ...newProposal, timestamp: Date.now() }
      } else {
        // Add new proposal
        merged.unshift({ ...newProposal, timestamp: Date.now() })
      }
    }

    // Sort by ID descending (newest first) and limit size
    return merged
      .sort((a, b) => b.id - a.id)
      .slice(0, this.MAX_CACHE_SIZE)
  }
}