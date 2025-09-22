// Real Contract Integration Hooks
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { ClimateDAO_ABI, ClimateToken_ABI, ProposalData } from '../services/contractService'
import toast from 'react-hot-toast'

const CLIMATE_TOKEN_ADDRESS = (import.meta as any).env?.VITE_CLIMATE_TOKEN_ADDRESS || '0x216e6228b7E1CaB0136f8a231460FC1Fd9f594f5'
const CLIMATE_DAO_ADDRESS = (import.meta as any).env?.VITE_CLIMATE_DAO_ADDRESS || '0x5D3235c4eB39f5c3729e75932D62E40f77D8e70f'

export const useTokenBalance = () => {
  const { address } = useAccount()
  
  const { data: balance, refetch } = useReadContract({
    address: CLIMATE_TOKEN_ADDRESS as `0x${string}`,
    abi: ClimateToken_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  return {
    balance: balance || 0n,
    formattedBalance: balance ? formatEther(balance) : '0',
    refetch
  }
}

export const useStakingInfo = () => {
  const { address } = useAccount()
  
  const { data: stakingInfo, refetch } = useReadContract({
    address: CLIMATE_TOKEN_ADDRESS as `0x${string}`,
    abi: ClimateToken_ABI,
    functionName: 'getStakingInfo',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  return {
    stakingInfo: stakingInfo || [0n, 0n, 0n, 0n],
    stakedAmount: stakingInfo?.[0] || 0n,
    rewards: stakingInfo?.[1] || 0n,
    stakingStart: stakingInfo?.[2] || 0n,
    lastClaim: stakingInfo?.[3] || 0n,
    formattedStaked: stakingInfo?.[0] ? formatEther(stakingInfo[0]) : '0',
    formattedRewards: stakingInfo?.[1] ? formatEther(stakingInfo[1]) : '0',
    refetch
  }
}

export const useDAOStats = () => {
  const { data: totalFundsRaised, refetch: refetchFunds } = useReadContract({
    address: CLIMATE_DAO_ADDRESS as `0x${string}`,
    abi: ClimateDAO_ABI,
    functionName: 'totalFundsRaised',
  })

  const { data: nextProposalId, refetch: refetchProposals } = useReadContract({
    address: CLIMATE_DAO_ADDRESS as `0x${string}`,
    abi: ClimateDAO_ABI,
    functionName: 'nextProposalId',
  })

  return {
    totalFundsRaised: totalFundsRaised || 0n,
    totalProposals: nextProposalId ? nextProposalId - 1n : 0n,
    formattedFunds: totalFundsRaised ? formatEther(totalFundsRaised) : '0',
    refetch: () => {
      refetchFunds()
      refetchProposals()
    }
  }
}

export const useCreateProposal = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const createProposal = async (beneficiary: string, proposalData: ProposalData) => {
    try {
      toast.loading('Creating proposal...', { id: 'create-proposal' })
      
      await writeContract({
        address: CLIMATE_DAO_ADDRESS as `0x${string}`,
        abi: ClimateDAO_ABI,
        functionName: 'createProposal',
        args: [beneficiary as `0x${string}`, proposalData as any],
      })
    } catch (error) {
      console.error('Failed to create proposal:', error)
      toast.error('Failed to create proposal', { id: 'create-proposal' })
      throw error
    }
  }

  // Handle transaction status
  if (isConfirmed) {
    toast.success('Proposal created successfully!', { id: 'create-proposal' })
  } else if (error) {
    toast.error('Transaction failed', { id: 'create-proposal' })
  }

  return {
    createProposal,
    hash,
    isPending: isPending || isConfirming,
    isConfirmed,
    error
  }
}

export const useVoteOnProposal = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const voteOnProposal = async (proposalId: bigint, voteChoice: number, weight: bigint) => {
    try {
      toast.loading('Submitting vote...', { id: 'vote-proposal' })
      
      await writeContract({
        address: CLIMATE_DAO_ADDRESS as `0x${string}`,
        abi: ClimateDAO_ABI,
        functionName: 'voteOnProposal',
        args: [proposalId, voteChoice, weight],
      })
    } catch (error) {
      console.error('Failed to vote on proposal:', error)
      toast.error('Failed to submit vote', { id: 'vote-proposal' })
      throw error
    }
  }

  // Handle transaction status
  if (isConfirmed) {
    toast.success('Vote submitted successfully!', { id: 'vote-proposal' })
  } else if (error) {
    toast.error('Vote submission failed', { id: 'vote-proposal' })
  }

  return {
    voteOnProposal,
    hash,
    isPending: isPending || isConfirming,
    isConfirmed,
    error
  }
}

export const useDonateFunds = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const donateFunds = async (amount: string) => {
    try {
      const amountWei = parseEther(amount)
      toast.loading('Processing donation...', { id: 'donate-funds' })
      
      await writeContract({
        address: CLIMATE_DAO_ADDRESS as `0x${string}`,
        abi: ClimateDAO_ABI,
        functionName: 'donateFunds',
        args: [amountWei],
      })
    } catch (error) {
      console.error('Failed to donate funds:', error)
      toast.error('Failed to process donation', { id: 'donate-funds' })
      throw error
    }
  }

  // Handle transaction status
  if (isConfirmed) {
    toast.success('Donation processed successfully!', { id: 'donate-funds' })
  } else if (error) {
    toast.error('Donation failed', { id: 'donate-funds' })
  }

  return {
    donateFunds,
    hash,
    isPending: isPending || isConfirming,
    isConfirmed,
    error
  }
}

export const useStakeTokens = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const stakeTokens = async (amount: string) => {
    try {
      const amountWei = parseEther(amount)
      toast.loading('Staking tokens...', { id: 'stake-tokens' })
      
      await writeContract({
        address: CLIMATE_TOKEN_ADDRESS as `0x${string}`,
        abi: ClimateToken_ABI,
        functionName: 'stake',
        args: [amountWei],
      })
    } catch (error) {
      console.error('Failed to stake tokens:', error)
      toast.error('Failed to stake tokens', { id: 'stake-tokens' })
      throw error
    }
  }

  // Handle transaction status
  if (isConfirmed) {
    toast.success('Tokens staked successfully!', { id: 'stake-tokens' })
  } else if (error) {
    toast.error('Staking failed', { id: 'stake-tokens' })
  }

  return {
    stakeTokens,
    hash,
    isPending: isPending || isConfirming,
    isConfirmed,
    error
  }
}

export const useUnstakeTokens = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const unstakeTokens = async (amount: string) => {
    try {
      const amountWei = parseEther(amount)
      toast.loading('Unstaking tokens...', { id: 'unstake-tokens' })
      
      await writeContract({
        address: CLIMATE_TOKEN_ADDRESS as `0x${string}`,
        abi: ClimateToken_ABI,
        functionName: 'unstake',
        args: [amountWei],
      })
    } catch (error) {
      console.error('Failed to unstake tokens:', error)
      toast.error('Failed to unstake tokens', { id: 'unstake-tokens' })
      throw error
    }
  }

  // Handle transaction status
  if (isConfirmed) {
    toast.success('Tokens unstaked successfully!', { id: 'unstake-tokens' })
  } else if (error) {
    toast.error('Unstaking failed', { id: 'unstake-tokens' })
  }

  return {
    unstakeTokens,
    hash,
    isPending: isPending || isConfirming,
    isConfirmed,
    error
  }
}

export const useClaimRewards = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const claimRewards = async () => {
    try {
      toast.loading('Claiming rewards...', { id: 'claim-rewards' })
      
      await writeContract({
        address: CLIMATE_TOKEN_ADDRESS as `0x${string}`,
        abi: ClimateToken_ABI,
        functionName: 'claimRewards',
        args: [],
      })
    } catch (error) {
      console.error('Failed to claim rewards:', error)
      toast.error('Failed to claim rewards', { id: 'claim-rewards' })
      throw error
    }
  }

  // Handle transaction status
  if (isConfirmed) {
    toast.success('Rewards claimed successfully!', { id: 'claim-rewards' })
  } else if (error) {
    toast.error('Claim failed', { id: 'claim-rewards' })
  }

  return {
    claimRewards,
    hash,
    isPending: isPending || isConfirming,
    isConfirmed,
    error
  }
}

export const useAllProposals = () => {
  const { data: proposalCount } = useReadContract({
    address: CLIMATE_DAO_ADDRESS as `0x${string}`,
    abi: ClimateDAO_ABI,
    functionName: 'proposalCount',
  })

  const proposals = []
  
  // Fetch all proposals
  if (proposalCount && proposalCount > 0n) {
    for (let i = 1n; i <= proposalCount; i++) {
      const { data: proposalAddress } = useReadContract({
        address: CLIMATE_DAO_ADDRESS as `0x${string}`,
        abi: ClimateDAO_ABI,
        functionName: 'proposals',
        args: [i],
      })

      if (proposalAddress) {
        // Fetch proposal details from the Proposal contract
        const { data: proposalData } = useReadContract({
          address: proposalAddress as `0x${string}`,
          abi: ClimateDAO_ABI, // Assuming Proposal contract has similar ABI
          functionName: 'getProposalData',
        })

        if (proposalData) {
          proposals.push({
            id: Number(i),
            address: proposalAddress,
            ...proposalData,
            status: 'Active', // This should be determined by checking voting deadline
          })
        }
      }
    }
  }

  return {
    proposals,
    isLoading: false, // Could be improved with proper loading states
    totalCount: proposalCount ? Number(proposalCount) : 0
  }
}

export const useUserProposals = (userAddress?: `0x${string}`) => {
  const { proposals } = useAllProposals()
  
  const userProposals = proposals?.filter(proposal => 
    proposal.proposer?.toLowerCase() === userAddress?.toLowerCase()
  ) || []

  return {
    userProposals,
    count: userProposals.length
  }
}

export const useUserVotes = (userAddress?: `0x${string}`) => {
  const { proposals } = useAllProposals()
  
  // This would need to be implemented by checking each proposal's voting records
  // For now, returning empty array as this requires more complex contract interaction
  const userVotes: any[] = []

  return {
    userVotes,
    count: userVotes.length
  }
}

export const useProposal = (proposalId: number) => {
  const { data: proposalAddress } = useReadContract({
    address: CLIMATE_DAO_ADDRESS as `0x${string}`,
    abi: ClimateDAO_ABI,
    functionName: 'proposals',
    args: [BigInt(proposalId)],
  })

  const { data: proposalData } = useReadContract({
    address: proposalAddress as `0x${string}`,
    abi: ClimateDAO_ABI,
    functionName: 'getProposalData',
    query: {
      enabled: !!proposalAddress,
    },
  })

  return {
    proposal: proposalData ? {
      id: proposalId,
      address: proposalAddress,
      ...proposalData,
      status: 'Active', // This should be determined by checking voting deadline
    } : null,
    isLoading: !proposalData && !!proposalAddress
  }
}

export const useVote = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const vote = async (proposalId: number, choice: number) => {
    if (!hash) {
      toast.loading('Casting vote...', { id: 'vote' })
    }

    try {
      // Get proposal address first
      const proposalAddress = await writeContract({
        address: CLIMATE_DAO_ADDRESS as `0x${string}`,
        abi: ClimateDAO_ABI,
        functionName: 'proposals',
        args: [BigInt(proposalId)],
      })

      // Cast vote on the proposal
      await writeContract({
        address: proposalAddress as `0x${string}`,
        abi: ClimateDAO_ABI,
        functionName: 'castVote',
        args: [BigInt(choice), 1n], // choice and weight (1 token = 1 vote)
      })
    } catch (err) {
      console.error('Voting error:', err)
      throw err
    }
  }

  // Handle transaction status
  if (isConfirmed) {
    toast.success('Vote cast successfully!', { id: 'vote' })
  } else if (error) {
    toast.error('Vote failed', { id: 'vote' })
  }

  return {
    vote,
    hash,
    isPending: isPending || isConfirming,
    isConfirmed,
    error
  }
}
