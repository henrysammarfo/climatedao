// Unified Proposal Types
export interface UIProposal {
  id: number
  title: string
  description: string
  category: string
  status: string
  location: string
  duration: number
  website: string
  images?: string[] // Optional images array
  proposer: string
  beneficiary: string
  requestedAmount: string
  endDate: string
  daysLeft: number
  forVotes: number
  againstVotes: number
  votes: number
  co2Reduction: number
  energyGeneration: number
  jobsCreated: number
  impactScore: number
  analysisComplete: boolean
  contractAddress: string // Individual Proposal contract address for voting
  hasUserVoted?: boolean // Whether the current user has voted
  userVoteChoice?: number // User's vote choice (0=against, 1=for, 2=abstain)
  timestamp?: number // Optional timestamp for cached data
  // Execution-related fields
  executionStatus?: 'pending' | 'voting-ended' | 'passed' | 'rejected' | 'executed'
  canExecuteVoting?: boolean // Whether voting resolution can be triggered
  canExecuteFunding?: boolean // Whether fund distribution can be triggered
  votingEndTime?: number // Unix timestamp for voting end
  executionDeadline?: Date // Execution deadline for display
  fundDistributionTx?: string // Transaction hash for fund distribution
  votingResolutionTx?: string // Transaction hash for voting resolution
}

// Optimistic proposal extends UIProposal with additional fields
export interface OptimisticProposal extends UIProposal {
  isOptimistic: true
  txHash?: string
}
