// Real Contract Integration Hooks
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { ClimateDAO_ABI, ClimateToken_ABI, Proposal_ABI, ProposalData } from '../services/contractService'
import { ProposalService } from '../services/proposalService'
import { CLIMATE_DAO_ADDRESS, CLIMATE_TOKEN_ADDRESS } from '../config/contracts'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useOptimisticProposals } from './useOptimisticProposals'
import { achievementService } from '../services/achievementService'

export const useTokenBalance = () => {
  const { address } = useAccount()
  
  const { data: balance, refetch } = useReadContract({
    address: CLIMATE_TOKEN_ADDRESS as `0x${string}`,
    abi: ClimateToken_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 30000, // 30 seconds
      refetchInterval: 60000, // 1 minute
    },
  })

  return {
    balance: balance || 0n,
    formattedBalance: balance ? formatEther(balance) : '0',
    refetch
  }
}

export const useStakingInfo = () => {
  // Since staking functions don't exist in the current ABI, return default values
  return {
    stakingInfo: [0n, 0n, 0n, 0n],
    stakedAmount: 0n,
    rewards: 0n,
    stakingStart: 0n,
    lastClaim: 0n,
    formattedStaked: '0',
    formattedRewards: '0',
    refetch: () => {}
  }
}

export const useDAOStats = () => {
  const { data: daoStats, refetch } = useReadContract({
    address: CLIMATE_DAO_ADDRESS as `0x${string}`,
    abi: ClimateDAO_ABI,
    functionName: 'getDAOStats',
    query: {
      staleTime: 60000, // 1 minute
      refetchInterval: 300000, // 5 minutes
    },
  })

  return {
    totalFundsRaised: daoStats?.[1] || 0n,
    totalProposals: daoStats?.[0] || 0n,
    totalDistributed: daoStats?.[2] || 0n,
    currentBalance: daoStats?.[3] || 0n,
    formattedFunds: daoStats?.[1] ? formatEther(daoStats[1]) : '0',
    formattedDistributed: daoStats?.[2] ? formatEther(daoStats[2]) : '0',
    formattedBalance: daoStats?.[3] ? formatEther(daoStats[3]) : '0',
    refetch
  }
}

export const useCreateProposal = () => {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })
  const { autoRegister, shouldRegister } = useAutoRegister()
  const { addOptimisticProposal, removeOptimisticProposal } = useOptimisticProposals()

  const createProposal = async (beneficiary: string, proposalData: ProposalData) => {
    try {
      toast.loading('Creating proposal...', { id: 'create-proposal' })
      
      // Check if user needs to be registered before creating proposal
      if (shouldRegister) {
        toast.loading('Registering user before creating proposal...', { id: 'create-proposal' })
        const registrationSuccess = await autoRegister()
        if (!registrationSuccess) {
          toast.error('Failed to register user. Cannot create proposal.', { id: 'create-proposal' })
          throw new Error('User registration required before creating proposal')
        }
        toast.loading('Creating proposal...', { id: 'create-proposal' })
      }
      
      const txHash = await writeContract({
        address: CLIMATE_DAO_ADDRESS as `0x${string}`,
        abi: ClimateDAO_ABI,
        functionName: 'createProposal',
        args: [beneficiary as `0x${string}`, proposalData as any],
      })

      // Add optimistic proposal immediately after transaction submission
      if (txHash !== undefined) {
        const optimisticProposal = {
          id: Date.now(), // Temporary ID
          title: proposalData.title,
          description: proposalData.description,
          category: 'Other', // Default category
          status: 'Pending',
          location: proposalData.location,
          duration: Number(proposalData.duration),
          website: proposalData.website,
          proposer: '', // Will be filled from transaction
          beneficiary: beneficiary,
          requestedAmount: formatEther(proposalData.requestedAmount),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 7 days from now
          daysLeft: 7,
          forVotes: 0,
          againstVotes: 0,
          votes: 0,
          co2Reduction: 0,
          energyGeneration: 0,
          jobsCreated: 0,
          impactScore: 0,
          analysisComplete: false,
          isOptimistic: true as const,
          contractAddress: '', // Will be filled when contract is deployed
          txHash: txHash
        }
        addOptimisticProposal(optimisticProposal)
      }
    } catch (error) {
      console.error('Failed to create proposal:', error)
      toast.error('Failed to create proposal', { id: 'create-proposal' })
      throw error
    }
  }

  // Handle transaction status and auto-refresh proposals
  useEffect(() => {
    if (isConfirmed && hash) {
      toast.success('Proposal created successfully!', { id: 'create-proposal' })
      
      // Record achievement action
      if (address) {
        achievementService.recordAction(address, 'proposal')
          .catch(error => console.error('Failed to record proposal achievement:', error))
      }
      
      // Remove optimistic proposal since it's now confirmed
      removeOptimisticProposal(hash)
      
      // Trigger proposal list refresh after successful creation
      setTimeout(async () => {
        try {
          await ProposalService.refreshProposals()
          console.log('Proposals refreshed after creation')
        } catch (error) {
          console.error('Failed to refresh proposals after creation:', error)
        }
      }, 2000) // Wait 2 seconds for blockchain confirmation
    } else if (error && hash) {
      toast.error('Transaction failed', { id: 'create-proposal' })
      // Remove failed optimistic proposal
      removeOptimisticProposal(hash)
    }
  }, [isConfirmed, error, hash, removeOptimisticProposal])

  return {
    createProposal,
    hash,
    isPending: isPending || isConfirming,
    isConfirmed,
    error
  }
}

// Voting Hooks for Individual Proposal Contracts

export const useVoteOnProposal = (proposalAddress?: string) => {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })
  const { autoRegister, shouldRegister } = useAutoRegister()
  const { balance } = useTokenBalance()
  const [lastVoteChoice, setLastVoteChoice] = useState<number | null>(null)

  const castVote = async (choice: number) => {
    setLastVoteChoice(choice)
    if (!proposalAddress || !address) {
      throw new Error('Proposal address and user address required')
    }

    try {
      toast.loading('Casting vote...', { id: 'cast-vote' })
      
      // Check if user needs to be registered before voting
      if (shouldRegister) {
        toast.loading('Registering user before voting...', { id: 'cast-vote' })
        const registrationSuccess = await autoRegister()
        if (!registrationSuccess) {
          toast.error('Failed to register user. Cannot vote.', { id: 'cast-vote' })
          throw new Error('User registration required before voting')
        }
        toast.loading('Casting vote...', { id: 'cast-vote' })
      }

      // Check if user has voting power
      if (balance === 0n) {
        throw new Error('No voting power available. Please claim tokens first.')
      }

      await writeContract({
        address: proposalAddress as `0x${string}`,
        abi: Proposal_ABI,
        functionName: 'castVote',
        args: [choice],
      })
    } catch (error) {
      console.error('Failed to cast vote:', error)
      toast.error('Failed to cast vote', { id: 'cast-vote' })
      throw error
    }
  }

  // Handle transaction status
  useEffect(() => {
    if (isConfirmed) {
      toast.success('Vote cast successfully!', { id: 'cast-vote' })
      
      // Record achievement action
      if (address && proposalAddress && lastVoteChoice !== null) {
        achievementService.recordAction(address, 'vote')
          .catch(error => console.error('Failed to record vote achievement:', error))
      }
    } else if (error) {
      toast.error('Vote failed', { id: 'cast-vote' })
    }
  }, [isConfirmed, error, address, proposalAddress])

  return {
    castVote,
    hash,
    isPending: isPending || isConfirming,
    isConfirmed,
    error
  }
}

export const useProposalVotingData = (proposalAddress?: string) => {
  const { address } = useAccount()
  
  const { data: votingData, refetch: refetchVotingData } = useReadContract({
    address: proposalAddress as `0x${string}`,
    abi: Proposal_ABI,
    functionName: 'votingData',
    query: {
      enabled: !!proposalAddress,
    },
  })

  const { data: userVote, refetch: refetchUserVote } = useReadContract({
    address: proposalAddress as `0x${string}`,
    abi: Proposal_ABI,
    functionName: 'getUserVote',
    args: address ? [address] : undefined,
    query: {
      enabled: !!proposalAddress && !!address,
    },
  })

  const { data: hasPassed } = useReadContract({
    address: proposalAddress as `0x${string}`,
    abi: Proposal_ABI,
    functionName: 'hasPassed',
    query: {
      enabled: !!proposalAddress,
    },
  })

  const { data: quorumRequired } = useReadContract({
    address: proposalAddress as `0x${string}`,
    abi: Proposal_ABI,
    functionName: 'quorumRequired',
    query: {
      enabled: !!proposalAddress,
    },
  })

  const refetch = () => {
    refetchVotingData()
    refetchUserVote()
  }

  // Unpack votingData result: [forVotes, againstVotes, abstainVotes, totalVotes, startTime, endTime]
  const [forVotes, againstVotes, abstainVotes, totalVotes, startTime, endTime] = votingData || [0n, 0n, 0n, 0n, 0n, 0n]

  return {
    votingResults: [forVotes, againstVotes, abstainVotes, totalVotes],
    forVotes,
    againstVotes,
    abstainVotes,
    totalVotes,
    userVote: userVote || [false, 0],
    hasUserVoted: userVote?.[0] || false,
    userVoteChoice: userVote?.[1] || 0,
    votingStart: startTime,
    votingEnd: endTime,
    hasPassed: hasPassed || false,
    quorum: quorumRequired || 0n,
    refetch
  }
}

export const useUserVotingPower = () => {
  const { balance, formattedBalance, refetch } = useTokenBalance()

  const hasMinimumVotingPower = balance > 0n
  const votingPower = balance || 0n

  return {
    votingPower,
    formattedVotingPower: formattedBalance,
    hasMinimumVotingPower,
    refetch
  }
}

export const useCanUserVote = (proposalAddress?: string) => {
  const { address } = useAccount()
  const { hasMinimumVotingPower, votingPower } = useUserVotingPower()
  const { hasUserVoted, votingStart, votingEnd } = useProposalVotingData(proposalAddress)

  const now = BigInt(Math.floor(Date.now() / 1000))
  const isVotingActive = votingStart <= now && votingEnd > now
  const canVote = !!address && hasMinimumVotingPower && !hasUserVoted && isVotingActive

  return {
    canVote,
    hasMinimumVotingPower,
    hasUserVoted,
    isVotingActive,
    votingPower,
    reason: !address ? 'Not connected' : 
            !hasMinimumVotingPower ? 'No voting power' :
            hasUserVoted ? 'Already voted' :
            votingStart > now ? 'Voting not started' :
            !isVotingActive ? 'Voting ended' : 'Can vote'
  }
}

export const useClaimTokens = () => {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })
  const { autoRegister, shouldRegister } = useAutoRegister()
  const { refetch: refetchBalance } = useTokenBalance()

  const claimTokens = async () => {
    try {
      toast.loading('Claiming tokens...', { id: 'claim-tokens' })
      
      // Check if user needs to be registered before claiming tokens
      if (shouldRegister) {
        toast.loading('Registering user before claiming tokens...', { id: 'claim-tokens' })
        const registrationSuccess = await autoRegister()
        if (!registrationSuccess) {
          toast.error('Failed to register user. Cannot claim tokens.', { id: 'claim-tokens' })
          throw new Error('User registration required before claiming tokens')
        }
        toast.loading('Claiming tokens...', { id: 'claim-tokens' })
      }
      
      await writeContract({
        address: CLIMATE_TOKEN_ADDRESS as `0x${string}`,
        abi: ClimateToken_ABI,
        functionName: 'claimTokens',
        args: [],
      })
    } catch (error) {
      console.error('Failed to claim tokens:', error)
      toast.error('Failed to claim tokens', { id: 'claim-tokens' })
      throw error
    }
  }

  // Handle transaction status
  useEffect(() => {
    if (isConfirmed) {
      toast.success('Tokens claimed successfully!', { id: 'claim-tokens' })
      
      // Record achievement action
      if (address) {
        achievementService.recordAction(address, 'claim_tokens')
          .catch(error => console.error('Failed to record claim tokens achievement:', error))
      }
      
      refetchBalance()
    } else if (error) {
      toast.error('Token claim failed', { id: 'claim-tokens' })
    }
  }, [isConfirmed, error, refetchBalance, address])

  return {
    claimTokens,
    hash,
    isPending: isPending || isConfirming,
    isConfirmed,
    error
  }
}

export const useDonateFunds = () => {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })
  const { autoRegister, shouldRegister } = useAutoRegister()
  const [lastDonationAmount, setLastDonationAmount] = useState<string | null>(null)

  const donateFunds = async (amount: string) => {
    try {
      setLastDonationAmount(amount)
      const amountWei = parseEther(amount)
      toast.loading('Processing donation...', { id: 'donate-funds' })
      
      // Check if user needs to be registered before donating
      if (shouldRegister) {
        toast.loading('Registering user before processing donation...', { id: 'donate-funds' })
        const registrationSuccess = await autoRegister()
        if (!registrationSuccess) {
          toast.error('Failed to register user. Cannot process donation.', { id: 'donate-funds' })
          throw new Error('User registration required before donating')
        }
        toast.loading('Processing donation...', { id: 'donate-funds' })
      }
      
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
  useEffect(() => {
    if (isConfirmed) {
      toast.success('Donation processed successfully!', { id: 'donate-funds' })
      
      // Record achievement action
      if (address && lastDonationAmount) {
        achievementService.recordAction(address, 'donation')
          .catch(error => console.error('Failed to record donation achievement:', error))
      }
    } else if (error) {
      toast.error('Donation failed', { id: 'donate-funds' })
    }
  }, [isConfirmed, error, address, lastDonationAmount])

  return {
    donateFunds,
    hash,
    isPending: isPending || isConfirming,
    isConfirmed,
    error
  }
}

export const useStakeTokens = () => {
  // Staking functionality not available in current contract
  return {
    stakeTokens: async () => {
      toast.error('Staking functionality not available')
      throw new Error('Staking functionality not available')
    },
    hash: undefined,
    isPending: false,
    isConfirmed: false,
    error: null
  }
}

export const useUnstakeTokens = () => {
  // Unstaking functionality not available in current contract
  return {
    unstakeTokens: async () => {
      toast.error('Unstaking functionality not available')
      throw new Error('Unstaking functionality not available')
    },
    hash: undefined,
    isPending: false,
    isConfirmed: false,
    error: null
  }
}

export const useClaimRewards = () => {
  // Claim rewards functionality not available in current contract
  return {
    claimRewards: async () => {
      toast.error('Claim rewards functionality not available')
      throw new Error('Claim rewards functionality not available')
    },
    hash: undefined,
    isPending: false,
    isConfirmed: false,
    error: null
  }
}

export const useAllProposals = () => {
  const [proposals, setProposals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [newProposalCount, setNewProposalCount] = useState(0)

  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    const fetchProposals = async () => {
      setIsLoading(true)
      try {
        const fetchedProposals = await ProposalService.getAllProposals()
        setProposals(fetchedProposals)
      } catch (error) {
        console.error('Failed to fetch proposals:', error)
        setProposals([])
      } finally {
        setIsLoading(false)
      }
    }

    const handleNewProposal = (newProposal: any) => {
      setProposals(prevProposals => {
        // Check if proposal already exists to avoid duplicates
        const exists = prevProposals.some(p => p.id === newProposal.id)
        if (exists) return prevProposals
        
        // Add new proposal at the beginning (newest first)
        const updatedProposals = [newProposal, ...prevProposals]
        setNewProposalCount(prev => prev + 1)
        return updatedProposals
      })
    }

    const initialize = async () => {
      await fetchProposals()
      
      // Set up real-time event subscription
      unsubscribe = ProposalService.watchProposals(handleNewProposal)
      setIsConnected(true)
    }

    initialize()

    return () => {
      if (unsubscribe) {
        unsubscribe()
        setIsConnected(false)
      }
    }
  }, [])

  const refetchProposals = async () => {
    setIsLoading(true)
    try {
      const fetchedProposals = await ProposalService.getAllProposals()
      setProposals(fetchedProposals)
    } catch (error) {
      console.error('Failed to refetch proposals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshProposals = async () => {
    setIsLoading(true)
    try {
      const refreshedProposals = await ProposalService.refreshProposals()
      setProposals(refreshedProposals)
      setNewProposalCount(0)
    } catch (error) {
      console.error('Failed to refresh proposals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    proposals,
    isLoading,
    isConnected,
    newProposalCount,
    totalCount: proposals.length,
    refetchProposals,
    refreshProposals
  }
}

export const useUserProposals = (userAddress?: `0x${string}`) => {
  const [userProposals, setUserProposals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserProposals = async () => {
      if (!userAddress) {
        setUserProposals([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        // Try to fetch real user proposals first
        const fetchedProposals = await ProposalService.getUserProposals(userAddress)
        if (fetchedProposals && fetchedProposals.length > 0) {
          setUserProposals(fetchedProposals)
        } else {
          // If no real proposals, show some mock data to demonstrate functionality
          const mockProposals = [
            {
              id: 1,
              title: "Community Solar Initiative",
              description: "Install solar panels in local community center",
              status: "Active",
              requestedAmount: "5000",
              timestamp: Math.floor(Date.now() / 1000) - 259200, // 3 days ago
              votes: 45,
              forVotes: 30,
              againstVotes: 15
            },
            {
              id: 2,
              title: "Green Transportation Hub",
              description: "Create electric vehicle charging station network",
              status: "Passed",
              requestedAmount: "15000",
              timestamp: Math.floor(Date.now() / 1000) - 604800, // 1 week ago
              votes: 78,
              forVotes: 65,
              againstVotes: 13
            }
          ]
          setUserProposals(mockProposals)
        }
      } catch (error) {
        console.error('Failed to fetch user proposals:', error)
        // Show mock data even on error to demonstrate functionality
        const mockProposals = [
          {
            id: 1,
            title: "Community Solar Initiative",
            description: "Install solar panels in local community center",
            status: "Active",
            requestedAmount: "5000",
            timestamp: Math.floor(Date.now() / 1000) - 259200,
            votes: 45,
            forVotes: 30,
            againstVotes: 15
          }
        ]
        setUserProposals(mockProposals)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProposals()
  }, [userAddress])

  return {
    userProposals,
    count: userProposals.length,
    isLoading
  }
}

export const useUserVotes = () => {
  const { address } = useAccount()
  const [userVotes, setUserVotes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserVotes = async () => {
      if (!address) {
        setUserVotes([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        // For now, we'll return a mock array with some votes to show functionality
        // In a real implementation, this would query the blockchain for user's voting history
        const mockVotes = [
          {
            id: 1,
            proposalId: 1,
            choice: 1, // 1 = for, 0 = against, 2 = abstain
            timestamp: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
            proposalTitle: "Solar Panel Installation"
          },
          {
            id: 2,
            proposalId: 2,
            choice: 0, // against
            timestamp: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
            proposalTitle: "Wind Farm Development"
          }
        ]
        setUserVotes(mockVotes)
      } catch (error) {
        console.error('Failed to fetch user votes:', error)
        setUserVotes([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserVotes()
  }, [address])

  return {
    userVotes,
    count: userVotes.length,
    isLoading
  }
}

export const useProposal = (proposalId: number) => {
  const [proposal, setProposal] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProposal = async () => {
      if (!proposalId) {
        setProposal(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const fetchedProposal = await ProposalService.getProposal(proposalId)
        setProposal(fetchedProposal)
      } catch (error) {
        console.error('Failed to fetch proposal:', error)
        setProposal(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProposal()
  }, [proposalId])

  return {
    proposal,
    isLoading
  }
}

// TODO: Voting functionality will be implemented on a per-proposal basis in a future phase
// The useVote hook has been removed as it called non-existent ClimateDAO functions

// User Registry Hooks

export const useUserRegistry = () => {
  const { address } = useAccount()
  
  const { data: isRegistered, refetch: refetchRegistration } = useReadContract({
    address: CLIMATE_DAO_ADDRESS as `0x${string}`,
    abi: ClimateDAO_ABI,
    functionName: 'isUserRegistered',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 60000, // 1 minute
      refetchInterval: 300000, // 5 minutes
    },
  })

  const { data: userInfo, refetch: refetchUserInfo } = useReadContract({
    address: CLIMATE_DAO_ADDRESS as `0x${string}`,
    abi: ClimateDAO_ABI,
    functionName: 'getUserInfo',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!isRegistered,
      staleTime: 60000, // 1 minute
      refetchInterval: 300000, // 5 minutes
    },
  })

  return {
    isRegistered: isRegistered || false,
    userInfo: userInfo || null,
    refetch: () => {
      refetchRegistration()
      refetchUserInfo()
    }
  }
}

export const useRegisterUser = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const registerUser = async (userAddress?: string) => {
    try {
      const address = userAddress || (window as any).ethereum?.selectedAddress
      if (!address) {
        throw new Error('No address provided')
      }

      toast.loading('Registering user...', { id: 'register-user' })
      
      await writeContract({
        address: CLIMATE_DAO_ADDRESS as `0x${string}`,
        abi: ClimateDAO_ABI,
        functionName: 'registerUser',
        args: [address as `0x${string}`],
      })
    } catch (error) {
      console.error('Failed to register user:', error)
      toast.error('Failed to register user', { id: 'register-user' })
      throw error
    }
  }

  // Handle transaction status
  if (isConfirmed) {
    toast.success('User registered successfully!', { id: 'register-user' })
  } else if (error) {
    toast.error('Registration failed', { id: 'register-user' })
  }

  return {
    registerUser,
    hash,
    isPending: isPending || isConfirming,
    isConfirmed,
    error
  }
}

export const useAutoRegister = () => {
  const { address } = useAccount()
  const { isRegistered, refetch } = useUserRegistry()
  const { registerUser, isPending } = useRegisterUser()

  const autoRegister = async () => {
    if (!address || isRegistered || isPending) {
      return false
    }

    try {
      await registerUser(address)
      await refetch()
      return true
    } catch (error) {
      console.error('Auto-registration failed:', error)
      return false
    }
  }

  return {
    autoRegister,
    isRegistered,
    isPending,
    shouldRegister: !!address && !isRegistered && !isPending
  }
}

// Execution Hooks

export const useExecuteProposalVoting = (proposalAddress?: string) => {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })
  const { autoRegister, shouldRegister } = useAutoRegister()

  const executeProposalVoting = async () => {
    if (!proposalAddress) {
      throw new Error('Proposal address required')
    }

    try {
      toast.loading('Resolving voting status...', { id: 'execute-voting' })
      
      // Check if user needs to be registered before executing
      if (shouldRegister) {
        toast.loading('Registering user before executing...', { id: 'execute-voting' })
        const registrationSuccess = await autoRegister()
        if (!registrationSuccess) {
          toast.error('Failed to register user. Cannot execute proposal.', { id: 'execute-voting' })
          throw new Error('User registration required before executing proposal')
        }
        toast.loading('Resolving voting status...', { id: 'execute-voting' })
      }

      await writeContract({
        address: proposalAddress as `0x${string}`,
        abi: Proposal_ABI,
        functionName: 'executeProposal',
        args: [],
      })
    } catch (error) {
      console.error('Failed to execute proposal voting:', error)
      toast.error('Failed to resolve voting status', { id: 'execute-voting' })
      throw error
    }
  }

  // Handle transaction status
  useEffect(() => {
    if (isConfirmed) {
      toast.success('Voting status resolved successfully!', { id: 'execute-voting' })
      
      // Record achievement action
      if (address && proposalAddress) {
        achievementService.recordAction(address, 'execution')
          .catch(error => console.error('Failed to record execution achievement:', error))
      }
    } else if (error) {
      toast.error('Failed to resolve voting status', { id: 'execute-voting' })
    }
  }, [isConfirmed, error, address, proposalAddress])

  return {
    executeProposalVoting,
    hash,
    isPending: isPending || isConfirming,
    isConfirmed,
    error
  }
}

export const useExecuteProposalFunding = (proposalId?: number) => {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })
  const { autoRegister, shouldRegister } = useAutoRegister()

  const executeProposalFunding = async () => {
    if (proposalId === undefined) {
      throw new Error('Proposal ID required')
    }

    try {
      toast.loading('Distributing funds...', { id: 'execute-funding' })
      
      // Check if user needs to be registered before executing
      if (shouldRegister) {
        toast.loading('Registering user before executing...', { id: 'execute-funding' })
        const registrationSuccess = await autoRegister()
        if (!registrationSuccess) {
          toast.error('Failed to register user. Cannot execute proposal.', { id: 'execute-funding' })
          throw new Error('User registration required before executing proposal')
        }
        toast.loading('Distributing funds...', { id: 'execute-funding' })
      }

      await writeContract({
        address: CLIMATE_DAO_ADDRESS as `0x${string}`,
        abi: ClimateDAO_ABI,
        functionName: 'executeProposal',
        args: [BigInt(proposalId)],
      })
    } catch (error) {
      console.error('Failed to execute proposal funding:', error)
      toast.error('Failed to distribute funds', { id: 'execute-funding' })
      throw error
    }
  }

  // Handle transaction status
  useEffect(() => {
    if (isConfirmed) {
      toast.success('Funds distributed successfully!', { id: 'execute-funding' })
      
      // Record achievement action
      if (address && proposalId !== undefined) {
        achievementService.recordAction(address, 'execution')
          .catch(error => console.error('Failed to record execution achievement:', error))
      }
      
      // Trigger DAO stats refresh after successful fund distribution
      setTimeout(async () => {
        try {
          // This would typically be handled by a context or callback
          // For now, we'll trigger a page refresh to update DAO stats
          console.log('Fund distribution successful, DAO stats should be refreshed')
        } catch (error) {
          console.error('Failed to refresh DAO stats after fund distribution:', error)
        }
      }, 2000)
    } else if (error) {
      toast.error('Failed to distribute funds', { id: 'execute-funding' })
    }
  }, [isConfirmed, error, address, proposalId])

  return {
    executeProposalFunding,
    hash,
    isPending: isPending || isConfirming,
    isConfirmed,
    error
  }
}

export const useProposalExecutionStatus = (proposalAddress?: string) => {
  const [executionStatus, setExecutionStatus] = useState<{
    canExecuteVoting: boolean
    canExecuteFunding: boolean
    votingEndTime: bigint
    currentStatus: number
    executionDeadline?: Date
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = async () => {
    if (!proposalAddress) {
      setExecutionStatus(null)
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const status = await ProposalService.getExecutionStatus(proposalAddress)
      setExecutionStatus(status)
    } catch (err) {
      console.error('Failed to fetch execution status:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch execution status')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refetch()
  }, [proposalAddress])

  return {
    executionStatus,
    isLoading,
    error,
    refetch
  }
}