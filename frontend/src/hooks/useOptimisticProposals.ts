// Optimistic Proposals Hook - Manages optimistic UI updates for proposal creation
import { useState, useCallback } from 'react'
import { OptimisticProposal, UIProposal } from '../types/proposal'

export const useOptimisticProposals = () => {
  const [optimisticProposals, setOptimisticProposals] = useState<OptimisticProposal[]>([])

  const addOptimisticProposal = useCallback((proposal: OptimisticProposal) => {
    setOptimisticProposals(prev => [proposal, ...prev])
  }, [])

  const removeOptimisticProposal = useCallback((txHash: string) => {
    setOptimisticProposals(prev => prev.filter(p => p.txHash !== txHash))
  }, [])

  const confirmOptimisticProposal = useCallback((txHash: string, realProposal: UIProposal) => {
    setOptimisticProposals(prev => prev.filter(p => p.txHash !== txHash))
    return realProposal
  }, [])

  const getOptimisticProposals = useCallback(() => {
    return optimisticProposals
  }, [optimisticProposals])

  return {
    addOptimisticProposal,
    removeOptimisticProposal,
    confirmOptimisticProposal,
    getOptimisticProposals,
    optimisticProposals
  }
}
