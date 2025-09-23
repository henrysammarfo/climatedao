import { useState, useEffect, useCallback } from 'react'
import { ProposalService } from '../services/proposalService'
import { UIProposal } from '../types/proposal'

// Hook for monitoring proposal status changes in real-time for a specific proposal
export const useProposalStatusMonitor = (proposalAddress?: string) => {
  const [statusEvents, setStatusEvents] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!proposalAddress) {
      setStatusEvents([])
      setIsConnected(false)
      setError(null)
      return
    }

    let unsubscribe: (() => void) | null = null

    const handleStatusChange = (event: any) => {
      console.log('Proposal status changed:', event)
      setStatusEvents(prev => [event, ...prev.slice(0, 49)]) // Keep last 50 events
    }

    try {
      unsubscribe = ProposalService.watchProposalStatusEventsFor(proposalAddress, handleStatusChange)
      setIsConnected(true)
      setError(null)
    } catch (err) {
      console.error('Failed to start status monitoring:', err)
      setError(err instanceof Error ? err.message : 'Failed to start monitoring')
      setIsConnected(false)
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
        setIsConnected(false)
      }
    }
  }, [proposalAddress])

  return {
    statusEvents,
    isConnected,
    error,
    latestEvent: statusEvents[0] || null
  }
}

// Hook for monitoring fund distribution events
export const useFundDistributionMonitor = () => {
  const [fundEvents, setFundEvents] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    const handleFundDistribution = (event: any) => {
      console.log('Fund distribution event:', event)
      setFundEvents(prev => [event, ...prev.slice(0, 49)]) // Keep last 50 events
      
      // Trigger DAO stats refresh on each fund distribution event
      setTimeout(async () => {
        try {
          console.log('Fund distribution event detected, DAO stats should be refreshed')
          // This would typically trigger a DAO stats refetch via context or callback
        } catch (error) {
          console.error('Failed to refresh DAO stats after fund distribution event:', error)
        }
      }, 1000)
    }

    try {
      unsubscribe = ProposalService.watchFundDistributionEvents(handleFundDistribution)
      setIsConnected(true)
      setError(null)
    } catch (err) {
      console.error('Failed to start fund monitoring:', err)
      setError(err instanceof Error ? err.message : 'Failed to start monitoring')
      setIsConnected(false)
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
        setIsConnected(false)
      }
    }
  }, [])

  return {
    fundEvents,
    isConnected,
    error,
    latestEvent: fundEvents[0] || null
  }
}

// Hook for managing execution queue
export const useExecutionQueue = () => {
  const [executionQueue, setExecutionQueue] = useState<{
    voting: UIProposal[]
    funding: UIProposal[]
  }>({ voting: [], funding: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshQueue = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // This would typically fetch all proposals and check their execution status
      // For now, we'll return empty arrays as this requires integration with the proposal list
      const votingQueue: UIProposal[] = []
      const fundingQueue: UIProposal[] = []

      setExecutionQueue({
        voting: votingQueue,
        funding: fundingQueue
      })
    } catch (err) {
      console.error('Failed to refresh execution queue:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh queue')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshQueue()
  }, [refreshQueue])

  return {
    executionQueue,
    isLoading,
    error,
    refreshQueue,
    totalPending: executionQueue.voting.length + executionQueue.funding.length
  }
}

// Hook for tracking complete proposal lifecycle
export const useProposalLifecycle = (proposalAddress?: string) => {
  const [lifecycle, setLifecycle] = useState<{
    stage: 'created' | 'voting' | 'voting-ended' | 'passed' | 'rejected' | 'executed'
    status: string
    canExecute: boolean
    executionStage?: 'voting' | 'funding'
    timeLeft?: string
    executionDeadline?: Date
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshLifecycle = useCallback(async () => {
    if (!proposalAddress) {
      setLifecycle(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const [executionStatus, readiness] = await Promise.all([
        ProposalService.getExecutionStatus(proposalAddress),
        ProposalService.isProposalReadyForExecution(proposalAddress)
      ])

      const now = Math.floor(Date.now() / 1000)
      const votingEnded = executionStatus.votingEndTime <= BigInt(now)
      const currentStatus = executionStatus.currentStatus

      // Determine lifecycle stage
      let stage: 'created' | 'voting' | 'voting-ended' | 'passed' | 'rejected' | 'executed'
      let status: string
      let canExecute = false
      let executionStage: 'voting' | 'funding' | undefined

      if (currentStatus === 3) { // Executed
        stage = 'executed'
        status = 'Executed'
      } else if (currentStatus === 2) { // Rejected
        stage = 'rejected'
        status = 'Rejected'
      } else if (currentStatus === 1) { // Passed
        stage = 'passed'
        status = 'Passed'
        canExecute = readiness.ready && readiness.stage === 'funding'
        executionStage = readiness.stage === 'funding' ? 'funding' : undefined
      } else if (votingEnded) { // Active but voting ended
        stage = 'voting-ended'
        status = 'Voting Ended'
        canExecute = readiness.ready && readiness.stage === 'voting'
        executionStage = readiness.stage === 'voting' ? 'voting' : undefined
      } else { // Active voting
        stage = 'voting'
        status = 'Voting Active'
      }

      // Calculate time left
      let timeLeft: string | undefined
      if (stage === 'voting') {
        const timeDiff = Number(executionStatus.votingEndTime) - now
        if (timeDiff > 0) {
          const days = Math.floor(timeDiff / 86400)
          const hours = Math.floor((timeDiff % 86400) / 3600)
          const minutes = Math.floor((timeDiff % 3600) / 60)

          if (days > 0) {
            timeLeft = `${days}d ${hours}h ${minutes}m`
          } else if (hours > 0) {
            timeLeft = `${hours}h ${minutes}m`
          } else {
            timeLeft = `${minutes}m`
          }
        }
      }

      setLifecycle({
        stage,
        status,
        canExecute,
        executionStage,
        timeLeft,
        executionDeadline: executionStatus.executionDeadline
      })
    } catch (err) {
      console.error('Failed to refresh proposal lifecycle:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh lifecycle')
    } finally {
      setIsLoading(false)
    }
  }, [proposalAddress])

  useEffect(() => {
    refreshLifecycle()
  }, [refreshLifecycle])

  return {
    lifecycle,
    isLoading,
    error,
    refreshLifecycle
  }
}

// Hook for batch execution operations
export const useBatchExecution = () => {
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResults, setExecutionResults] = useState<{
    success: number
    failed: number
    errors: string[]
  }>({ success: 0, failed: 0, errors: [] })

  const executeBatch = useCallback(async (proposals: { address: string; type: 'voting' | 'funding' }[]) => {
    setIsExecuting(true)
    setExecutionResults({ success: 0, failed: 0, errors: [] })

    const results = { success: 0, failed: 0, errors: [] as string[] }

    for (const proposal of proposals) {
      try {
        if (proposal.type === 'voting') {
          await ProposalService.executeProposalVoting(proposal.address)
        } else {
          // For funding, we'd need the proposal ID
          // This is a simplified version
          console.log('Funding execution would require proposal ID')
        }
        results.success++
      } catch (error) {
        results.failed++
        results.errors.push(`${proposal.address}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    setExecutionResults(results)
    setIsExecuting(false)
  }, [])

  return {
    executeBatch,
    isExecuting,
    executionResults
  }
}

// Hook for execution statistics
export const useExecutionStats = () => {
  const [stats, setStats] = useState<{
    totalExecuted: number
    totalPending: number
    totalRejected: number
    averageExecutionTime: number
    successRate: number
  }>({
    totalExecuted: 0,
    totalPending: 0,
    totalRejected: 0,
    averageExecutionTime: 0,
    successRate: 0
  })
  const [isLoading, setIsLoading] = useState(false)

  const refreshStats = useCallback(async () => {
    setIsLoading(true)
    
    try {
      // Fetch real statistics from the blockchain
      // TODO: Implement ExecutionService.getExecutionStats()
      setStats({
        totalExecuted: 0,
        totalPending: 0,
        totalRejected: 0,
        averageExecutionTime: 0,
        successRate: 0
      })
    } catch (error) {
      console.error('Failed to refresh execution stats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshStats()
  }, [refreshStats])

  return {
    stats,
    isLoading,
    refreshStats
  }
}
