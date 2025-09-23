// Voting Power Management Hook
import { useAccount } from 'wagmi'
import { useUserVotingPower, useClaimTokens } from './useContracts'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export const useVotingPower = () => {
  const { address } = useAccount()
  const { votingPower, formattedVotingPower, hasMinimumVotingPower, refetch } = useUserVotingPower()
  const { claimTokens, isPending: isClaiming, isConfirmed: isClaimConfirmed } = useClaimTokens()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleClaimTokens = async () => {
    try {
      await claimTokens()
    } catch (error) {
      console.error('Failed to claim tokens:', error)
      // Error handling is done in the useClaimTokens hook
    }
  }

  const refreshVotingPower = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } catch (error) {
      console.error('Failed to refresh voting power:', error)
      toast.error('Failed to refresh voting power')
    } finally {
      setIsRefreshing(false)
    }
  }

  const getVotingPowerRequirements = () => {
    return {
      minimumTokens: 1, // Minimum 1 token to vote
      claimableTokens: 100, // Users can claim 100 tokens initially
      description: 'You need at least 1 CLIMATE token to participate in voting. New users can claim 100 tokens to get started.'
    }
  }

  const getVotingPowerStatus = () => {
    if (!address) {
      return {
        status: 'disconnected',
        message: 'Connect your wallet to view voting power',
        canVote: false
      }
    }

    if (!hasMinimumVotingPower) {
      return {
        status: 'no_tokens',
        message: 'You need CLIMATE tokens to vote. Claim your initial 100 tokens to get started.',
        canVote: false
      }
    }

    return {
      status: 'ready',
      message: `You have ${formattedVotingPower} CLIMATE tokens available for voting`,
      canVote: true
    }
  }

  // Auto-refresh voting power after token claim
  useEffect(() => {
    if (isClaimConfirmed) {
      refreshVotingPower()
    }
  }, [isClaimConfirmed])

  return {
    // Voting power data
    votingPower,
    formattedVotingPower,
    hasMinimumVotingPower,
    
    // Token claiming
    claimTokens: handleClaimTokens,
    isClaiming,
    isClaimConfirmed,
    
    // Utility functions
    refreshVotingPower,
    isRefreshing,
    getVotingPowerRequirements,
    getVotingPowerStatus,
    
    // Status checks
    isConnected: !!address,
    canVote: hasMinimumVotingPower
  }
}
