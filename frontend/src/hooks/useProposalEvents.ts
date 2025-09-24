// Proposal Events Hook - Manages real-time proposal event subscriptions with progressive loading
import { useState, useEffect, useCallback, useRef } from 'react'
import { ProposalService } from '../services/proposalService'
import { EventCache } from '../services/eventCache'
import { CLIMATE_DAO_ADDRESS } from '../config/contracts'
import { xdcTestnet } from 'viem/chains'
import { useOptimisticProposals } from './useOptimisticProposals'
import { UIProposal } from '../types/proposal'
import { performanceService } from '../services/performanceService'
import toast from 'react-hot-toast'

const CHAIN_ID = xdcTestnet.id

export interface UseProposalEventsReturn {
  proposals: UIProposal[]
  isLoading: boolean
  isConnected: boolean
  error: string | null
  refetchProposals: () => Promise<void>
  refreshProposals: () => Promise<void>
  newProposalCount: number
  clearNewProposalCount: () => void
  cacheStats: {
    hasCache: boolean
    isValid: boolean
    proposalCount: number
    lastUpdated?: Date
  }
  loadingStages: {
    cacheLoading: boolean
    freshDataLoading: boolean
    realTimeUpdates: boolean
  }
  performanceMetrics: {
    cacheLoadTime: number
    freshDataLoadTime: number
    totalLoadTime: number
    cacheHitRate: number
  }
}

export const useProposalEvents = (): UseProposalEventsReturn => {
  const [proposals, setProposals] = useState<UIProposal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newProposalCount, setNewProposalCount] = useState(0)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)
  
  // Progressive loading states
  const [loadingStages, setLoadingStages] = useState({
    cacheLoading: false,
    freshDataLoading: false,
    realTimeUpdates: false,
  })
  
  // Performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState({
    cacheLoadTime: 0,
    freshDataLoadTime: 0,
    totalLoadTime: 0,
    cacheHitRate: 0,
  })
  
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const isInitializedRef = useRef(false)
  const { getOptimisticProposals } = useOptimisticProposals()

  // Get cache statistics
  const cacheStats = EventCache.getCacheStats(CHAIN_ID, CLIMATE_DAO_ADDRESS)

  // Fetch proposals function with performance tracking
  const fetchProposals = useCallback(async () => {
    try {
      setError(null)
      
      const fetchedProposals = await ProposalService.getAllProposals()
      setProposals(fetchedProposals)
      setLastUpdatedAt(Date.now())
      
    } catch (err) {
      console.error('Failed to fetch proposals:', err)
      setError('Failed to fetch proposals')
      
      // Try to use cached data as fallback
      const cachedProposals = EventCache.getCachedProposals(CHAIN_ID, CLIMATE_DAO_ADDRESS)
      if (cachedProposals.length > 0) {
        setProposals(cachedProposals)
      }
    }
  }, [])

  // Refresh proposals function (simplified)
  const refreshProposals = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      setLoadingStages(prev => ({ ...prev, freshDataLoading: true }))
      
      const refreshedProposals = await ProposalService.refreshProposals()
      
      setProposals(refreshedProposals)
      setLastUpdatedAt(Date.now())
      
      toast.success('Proposals refreshed successfully')
    } catch (err) {
      console.error('Failed to refresh proposals:', err)
      setError('Failed to refresh proposals')
      toast.error('Failed to refresh proposals')
    } finally {
      setIsLoading(false)
      setLoadingStages(prev => ({ ...prev, freshDataLoading: false }))
    }
  }, [])

  // Refetch proposals function (uses cache) with performance tracking
  const refetchProposals = useCallback(async () => {
    try {
      setIsLoading(true)
      setLoadingStages(prev => ({ ...prev, freshDataLoading: true }))
      await fetchProposals()
    } catch (err) {
      console.error('Failed to refetch proposals:', err)
      setError('Failed to refetch proposals')
    } finally {
      setIsLoading(false)
      setLoadingStages(prev => ({ ...prev, freshDataLoading: false }))
    }
  }, [fetchProposals])

  // Clear new proposal count
  const clearNewProposalCount = useCallback(() => {
    setNewProposalCount(0)
  }, [])

  // Handle new proposal events with simplified approach
  const handleNewProposal = useCallback((newProposal: UIProposal) => {
    console.log('New proposal received:', newProposal)
    
    setProposals(prevProposals => {
      // Check if proposal already exists to avoid duplicates
      const exists = prevProposals.some(p => p.id === newProposal.id)
      if (exists) return prevProposals
      
      // Add new proposal at the beginning (newest first)
      const updatedProposals = [newProposal, ...prevProposals]
      
      // Increment new proposal count
      setNewProposalCount(prev => prev + 1)
      
      // Show toast notification
      toast.success(`New proposal: ${newProposal.title}`, {
        duration: 5000,
        position: 'top-right'
      })
      
      return updatedProposals
    })
  }, [])

  // Initialize proposals with simplified approach
  useEffect(() => {
    if (isInitializedRef.current) return
    
    let mounted = true

    const initialize = async () => {
      try {
        setIsLoading(true)
        
        // Simple direct fetch without complex caching
        await fetchProposals()

        // Set up real-time event subscription
        if (mounted) {
          const unsubscribe = ProposalService.watchProposals(handleNewProposal)
          unsubscribeRef.current = unsubscribe
          setIsConnected(true)
          console.log('Real-time proposal events subscription started')
        }
      } catch (err) {
        console.error('Failed to initialize proposal events:', err)
        setError('Failed to initialize proposal events')
        setIsConnected(false)
      } finally {
        if (mounted) {
          setIsLoading(false)
          isInitializedRef.current = true
        }
      }
    }

    initialize()

    return () => {
      mounted = false
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
        setIsConnected(false)
        console.log('Real-time proposal events subscription stopped')
      }
    }
  }, []) // Remove dependencies to prevent infinite loops

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  // Auto-refresh proposals periodically (every 10 minutes) with smart refresh
  useEffect(() => {
    if (!isInitializedRef.current) return

    const interval = setInterval(() => {
      if (!isLoading && !loadingStages.freshDataLoading) {
        // Only refresh if we haven't had recent updates
        const timeSinceLastUpdate = Date.now() - (lastUpdatedAt ?? 0)
        
        if (timeSinceLastUpdate > 5 * 60 * 1000) { // 5 minutes
          fetchProposals()
        }
      }
    }, 10 * 60 * 1000) // 10 minutes - reduced frequency for better performance

    return () => clearInterval(interval)
  }, [fetchProposals, isLoading, loadingStages.freshDataLoading, lastUpdatedAt])

  // Update cache hit rate periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const cacheHits = performanceService.getMetrics('cache-hit').length
      const cacheMisses = performanceService.getMetrics('cache-miss').length
      const total = cacheHits + cacheMisses
      const hitRate = total > 0 ? cacheHits / total : 0
      
      setPerformanceMetrics(prev => ({
        ...prev,
        cacheHitRate: hitRate,
      }))
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [])

  // Combine real proposals with optimistic ones
  const allProposals = [...getOptimisticProposals(), ...proposals]

  return {
    proposals: allProposals,
    isLoading,
    isConnected,
    error,
    refetchProposals,
    refreshProposals,
    newProposalCount,
    clearNewProposalCount,
    cacheStats,
    loadingStages,
    performanceMetrics
  }
}
