import { useAccount, useBalance } from 'wagmi'
import { useReadContract } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { CLIMATE_TOKEN_ADDRESS, ClimateToken_ABI } from '../services/contractService'
import { useState, useEffect, useCallback } from 'react'

export interface TokenBalanceStatus {
  hasMinimumXDC: boolean
  hasVotingTokens: boolean
  needsFaucet: boolean
  needsClimateTokens: boolean
  xdcBalance: string
  climateBalance: string
  xdcBalanceWei: bigint
  climateBalanceWei: bigint
  isLoaded: boolean
}

export interface ActionRequirements {
  canVote: boolean
  canCreateProposal: boolean
  canStake: boolean
  canDonate: boolean
  missingRequirements: string[]
}

const MINIMUM_XDC_FOR_GAS = 0.1 // Minimum XDC needed for gas fees
const MINIMUM_CLIMATE_FOR_VOTING = 1 // Minimum CLIMATE tokens needed for voting

export const useTokenBalance = () => {
  const { address } = useAccount()
  const [lastUpdate, setLastUpdate] = useState<number>(0)
  const [cache, setCache] = useState<{
    xdcBalance?: bigint
    climateBalance?: bigint
    timestamp: number
  }>({ timestamp: 0 })

  // Get XDC balance for gas fees - with error handling
  const { 
    data: xdcBalance, 
    refetch: refetchXDC,
    isLoading: xdcLoading
  } = useBalance({
    address: address,
    query: {
      enabled: !!address,
      staleTime: 60000, // Cache for 1 minute
      refetchInterval: 300000, // Refetch every 5 minutes
      retry: 1, // Only retry once on failure
    },
  })

  // Get CLIMATE token balance for voting - with error handling
  const { 
    data: climateBalance, 
    refetch: refetchClimate,
    isLoading: climateLoading
  } = useReadContract({
    address: CLIMATE_TOKEN_ADDRESS as `0x${string}`,
    abi: ClimateToken_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 60000, // Cache for 1 minute
      refetchInterval: 300000, // Refetch every 5 minutes
      retry: 1, // Only retry once on failure
    },
  })

  // Smart caching to avoid excessive RPC calls
  const shouldRefetch = useCallback(() => {
    const now = Date.now()
    return now - cache.timestamp > 30000 // 30 seconds cache
  }, [cache.timestamp])

  // Auto-refresh balances after transactions
  useEffect(() => {
    if (lastUpdate > 0) {
      const timer = setTimeout(() => {
        refetchXDC()
        refetchClimate()
        setLastUpdate(0)
      }, 2000) // Wait 2 seconds for blockchain confirmation
      return () => clearTimeout(timer)
    }
  }, [lastUpdate, refetchXDC, refetchClimate])

  // Update cache when balances change
  useEffect(() => {
    if (xdcBalance?.value !== undefined || climateBalance !== undefined) {
      setCache({
        xdcBalance: xdcBalance?.value,
        climateBalance: climateBalance || 0n,
        timestamp: Date.now()
      })
    }
  }, [xdcBalance?.value, climateBalance])

  // Helper functions
  const hasMinimumXDC = useCallback((action: string = 'default') => {
    if (!xdcBalance?.value) return false
    const balance = parseFloat(formatEther(xdcBalance.value))
    
    // Different actions require different amounts of gas
    const requirements: Record<string, number> = {
      vote: 0.01,
      createProposal: 0.05,
      stake: 0.02,
      donate: 0.01,
      default: MINIMUM_XDC_FOR_GAS
    }
    
    return balance >= (requirements[action] || requirements.default)
  }, [xdcBalance?.value])

  const hasVotingTokens = useCallback(() => {
    if (!climateBalance) return false
    return climateBalance >= parseEther(MINIMUM_CLIMATE_FOR_VOTING.toString())
  }, [climateBalance])

  const needsFaucet = useCallback(() => {
    try {
      return !hasMinimumXDC() && !!address
    } catch (error) {
      console.error('Error checking faucet needs:', error)
      return false
    }
  }, [hasMinimumXDC, address])

  const needsClimateTokens = useCallback(() => {
    return !hasVotingTokens() && !!address
  }, [hasVotingTokens, address])

  const getBalanceStatus = useCallback((): TokenBalanceStatus => {
    return {
      hasMinimumXDC: hasMinimumXDC(),
      hasVotingTokens: hasVotingTokens(),
      needsFaucet: needsFaucet(),
      needsClimateTokens: needsClimateTokens(),
      xdcBalance: xdcBalance ? formatEther(xdcBalance.value) : '0',
      climateBalance: climateBalance ? formatEther(climateBalance) : '0',
      xdcBalanceWei: xdcBalance?.value || 0n,
      climateBalanceWei: climateBalance || 0n,
      isLoaded: !xdcLoading && !climateLoading
    }
  }, [
    hasMinimumXDC,
    hasVotingTokens,
    needsFaucet,
    needsClimateTokens,
    xdcBalance,
    climateBalance,
    xdcLoading,
    climateLoading
  ])

  const getActionRequirements = useCallback((action: string): ActionRequirements => {
    const status = getBalanceStatus()
    const missingRequirements: string[] = []

    let canVote = false
    let canCreateProposal = false
    let canStake = false
    let canDonate = false

    switch (action) {
      case 'vote':
        canVote = status.hasVotingTokens && status.hasMinimumXDC
        if (!status.hasVotingTokens) missingRequirements.push('CLIMATE tokens for voting')
        if (!status.hasMinimumXDC) missingRequirements.push('XDC for gas fees')
        break
      
      case 'createProposal':
        canCreateProposal = status.hasMinimumXDC
        if (!status.hasMinimumXDC) missingRequirements.push('XDC for gas fees')
        break
      
      case 'stake':
        canStake = status.hasVotingTokens && status.hasMinimumXDC
        if (!status.hasVotingTokens) missingRequirements.push('CLIMATE tokens to stake')
        if (!status.hasMinimumXDC) missingRequirements.push('XDC for gas fees')
        break
      
      case 'donate':
        canDonate = status.hasMinimumXDC
        if (!status.hasMinimumXDC) missingRequirements.push('XDC for gas fees')
        break
      
      default:
        canVote = status.hasVotingTokens && status.hasMinimumXDC
        canCreateProposal = status.hasMinimumXDC
        canStake = status.hasVotingTokens && status.hasMinimumXDC
        canDonate = status.hasMinimumXDC
    }

    return {
      canVote,
      canCreateProposal,
      canStake,
      canDonate,
      missingRequirements
    }
  }, [getBalanceStatus])

  const refreshBalances = useCallback(() => {
    setLastUpdate(Date.now())
    refetchXDC()
    refetchClimate()
  }, [refetchXDC, refetchClimate])

  const formatBalance = useCallback((balance: bigint, decimals: number = 4) => {
    return parseFloat(formatEther(balance)).toFixed(decimals)
  }, [])

  const getGasEstimate = useCallback((action: string) => {
    const estimates: Record<string, number> = {
      vote: 0.01,
      createProposal: 0.05,
      stake: 0.02,
      donate: 0.01,
      default: 0.01
    }
    return estimates[action] || estimates.default
  }, [])

  return {
    // Balance data
    xdcBalance: xdcBalance?.value || 0n,
    climateBalance: climateBalance || 0n,
    formattedXdcBalance: xdcBalance ? formatEther(xdcBalance.value) : '0',
    formattedClimateBalance: climateBalance ? formatEther(climateBalance) : '0',
    
    // Status checks
    hasMinimumXDC,
    hasVotingTokens,
    needsFaucet,
    needsClimateTokens,
    getBalanceStatus,
    getActionRequirements,
    
    // Utility functions
    refreshBalances,
    formatBalance,
    getGasEstimate,
    
    // Loading states
    isLoading: xdcLoading || climateLoading,
    isLoaded: !xdcLoading && !climateLoading,
    
    // Cache management
    shouldRefetch,
    lastUpdate
  }
}

export default useTokenBalance
