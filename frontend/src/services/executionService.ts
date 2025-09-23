import { ProposalService } from './proposalService'
import { UIProposal } from '../types/proposal'

export interface ExecutionEligibility {
  eligible: boolean
  stage: 'voting' | 'funding' | 'completed' | 'not-ready'
  reason: string
  deadline?: Date
  timeRemaining?: number
}

export interface ExecutionQueue {
  voting: UIProposal[]
  funding: UIProposal[]
  completed: UIProposal[]
}

export interface ExecutionProgress {
  proposalId: number
  stage: 'voting' | 'funding' | 'completed'
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  transactionHash?: string
  error?: string
  timestamp: Date
}

export interface ExecutionStats {
  totalExecuted: number
  totalPending: number
  totalRejected: number
  averageExecutionTime: number
  successRate: number
  totalFundsDistributed: bigint
  totalProposalsProcessed: number
}

export class ExecutionService {
  private static executionProgress: Map<number, ExecutionProgress> = new Map()
  private static executionStats: ExecutionStats = {
    totalExecuted: 0,
    totalPending: 0,
    totalRejected: 0,
    averageExecutionTime: 0,
    successRate: 0,
    totalFundsDistributed: 0n,
    totalProposalsProcessed: 0
  }

  // Handler callbacks for real on-chain writes
  private static votingExecutionHandler?: (proposalAddress: string) => Promise<string>
  private static fundingExecutionHandler?: (proposalId: number) => Promise<string>

  /**
   * Set the voting execution handler callback
   */
  static setVotingExecutionHandler(handler: (proposalAddress: string) => Promise<string>): void {
    this.votingExecutionHandler = handler
  }

  /**
   * Set the funding execution handler callback
   */
  static setFundingExecutionHandler(handler: (proposalId: number) => Promise<string>): void {
    this.fundingExecutionHandler = handler
  }

  /**
   * Check if a proposal is eligible for execution
   */
  static async checkExecutionEligibility(proposalAddress: string): Promise<ExecutionEligibility> {
    try {
      const executionStatus = await ProposalService.getExecutionStatus(proposalAddress)
      const readiness = await ProposalService.isProposalReadyForExecution(proposalAddress)

      if (!readiness.ready) {
        return {
          eligible: false,
          stage: readiness.stage,
          reason: readiness.reason
        }
      }

      // Calculate deadline and time remaining
      let deadline: Date | undefined
      let timeRemaining: number | undefined

      if (executionStatus.executionDeadline) {
        deadline = executionStatus.executionDeadline
        timeRemaining = Math.max(0, deadline.getTime() - Date.now())
      }

      return {
        eligible: true,
        stage: readiness.stage,
        reason: readiness.reason,
        deadline,
        timeRemaining
      }
    } catch (error) {
      console.error('Failed to check execution eligibility:', error)
      return {
        eligible: false,
        stage: 'not-ready',
        reason: 'Error checking eligibility'
      }
    }
  }

  /**
   * Get all proposals ready for execution, categorized by stage
   */
  static async getExecutionQueue(): Promise<ExecutionQueue> {
    try {
      // This would typically fetch all proposals and check their execution status
      // For now, returning empty arrays as this requires integration with the proposal list
      const queue: ExecutionQueue = {
        voting: [],
        funding: [],
        completed: []
      }

      // In a real implementation, you would:
      // 1. Fetch all proposals from ProposalService.getAllProposals()
      // 2. Check execution eligibility for each proposal
      // 3. Categorize them based on their execution stage

      return queue
    } catch (error) {
      console.error('Failed to get execution queue:', error)
      return {
        voting: [],
        funding: [],
        completed: []
      }
    }
  }

  /**
   * Track execution progress for a proposal
   */
  static trackExecutionProgress(proposalId: number, progress: ExecutionProgress): void {
    this.executionProgress.set(proposalId, progress)
    
    // Update stats based on progress
    if (progress.status === 'completed') {
      this.executionStats.totalExecuted++
      this.executionStats.totalProposalsProcessed++
    } else if (progress.status === 'failed') {
      this.executionStats.totalRejected++
      this.executionStats.totalProposalsProcessed++
    }

    // Calculate success rate
    if (this.executionStats.totalProposalsProcessed > 0) {
      this.executionStats.successRate = 
        (this.executionStats.totalExecuted / this.executionStats.totalProposalsProcessed) * 100
    }
  }

  /**
   * Get execution progress for a specific proposal
   */
  static getExecutionProgress(proposalId: number): ExecutionProgress | null {
    return this.executionProgress.get(proposalId) || null
  }

  /**
   * Get all execution progress records
   */
  static getAllExecutionProgress(): ExecutionProgress[] {
    return Array.from(this.executionProgress.values())
  }

  /**
   * Clear execution progress for a proposal
   */
  static clearExecutionProgress(proposalId: number): void {
    this.executionProgress.delete(proposalId)
  }

  /**
   * Get execution statistics
   */
  static getExecutionStats(): ExecutionStats {
    return { ...this.executionStats }
  }

  /**
   * Update execution statistics
   */
  static updateExecutionStats(updates: Partial<ExecutionStats>): void {
    this.executionStats = { ...this.executionStats, ...updates }
  }

  /**
   * Schedule automatic execution monitoring
   */
  static scheduleExecutionMonitoring(intervalMs: number = 60000): () => void {
    const interval = setInterval(async () => {
      try {
        const queue = await this.getExecutionQueue()
        this.executionStats.totalPending = queue.voting.length + queue.funding.length
        
        // Log execution queue status
        console.log('Execution queue status:', {
          voting: queue.voting.length,
          funding: queue.funding.length,
          completed: queue.completed.length
        })
      } catch (error) {
        console.error('Failed to monitor execution queue:', error)
      }
    }, intervalMs)

    return () => clearInterval(interval)
  }

  /**
   * Execute a proposal voting resolution
   */
  static async executeProposalVoting(proposalAddress: string, proposalId: number): Promise<{
    success: boolean
    transactionHash?: string
    error?: string
  }> {
    try {
      // Track execution start
      this.trackExecutionProgress(proposalId, {
        proposalId,
        stage: 'voting',
        status: 'in-progress',
        timestamp: new Date()
      })

      let txHash: string
      
      // Use real handler - no fallbacks
      if (this.votingExecutionHandler) {
        txHash = await this.votingExecutionHandler(proposalAddress)
      } else {
        throw new Error('Voting execution handler not configured')
      }
      
      // Track execution completion
      this.trackExecutionProgress(proposalId, {
        proposalId,
        stage: 'voting',
        status: 'completed',
        transactionHash: txHash,
        timestamp: new Date()
      })

      return { success: true, transactionHash: txHash }
    } catch (error) {
      // Track execution failure
      this.trackExecutionProgress(proposalId, {
        proposalId,
        stage: 'voting',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      })

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Execute a proposal funding distribution
   */
  static async executeProposalFunding(proposalId: number): Promise<{
    success: boolean
    transactionHash?: string
    error?: string
  }> {
    try {
      // Track execution start
      this.trackExecutionProgress(proposalId, {
        proposalId,
        stage: 'funding',
        status: 'in-progress',
        timestamp: new Date()
      })

      let txHash: string
      
      // Use real handler - no fallbacks
      if (this.fundingExecutionHandler) {
        txHash = await this.fundingExecutionHandler(proposalId)
      } else {
        throw new Error('Funding execution handler not configured')
      }
      
      // Track execution completion
      this.trackExecutionProgress(proposalId, {
        proposalId,
        stage: 'funding',
        status: 'completed',
        transactionHash: txHash,
        timestamp: new Date()
      })

      return { success: true, transactionHash: txHash }
    } catch (error) {
      // Track execution failure
      this.trackExecutionProgress(proposalId, {
        proposalId,
        stage: 'funding',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      })

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Execute multiple proposals in batch
   */
  static async executeBatch(proposals: { 
    id: number
    address: string
    type: 'voting' | 'funding'
  }[]): Promise<{
    success: number
    failed: number
    results: Array<{
      proposalId: number
      success: boolean
      transactionHash?: string
      error?: string
    }>
  }> {
    const results = []
    let success = 0
    let failed = 0

    for (const proposal of proposals) {
      try {
        let result
        if (proposal.type === 'voting') {
          result = await this.executeProposalVoting(proposal.address, proposal.id)
        } else {
          result = await this.executeProposalFunding(proposal.id)
        }

        results.push({
          proposalId: proposal.id,
          success: result.success,
          transactionHash: result.transactionHash,
          error: result.error
        })

        if (result.success) {
          success++
        } else {
          failed++
        }
      } catch (error) {
        results.push({
          proposalId: proposal.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        failed++
      }
    }

    return { success, failed, results }
  }

  /**
   * Get execution history for a proposal
   */
  static getExecutionHistory(proposalId: number): ExecutionProgress[] {
    return this.getAllExecutionProgress().filter(progress => progress.proposalId === proposalId)
  }

  /**
   * Validate execution prerequisites
   */
  static async validateExecutionPrerequisites(proposalAddress: string): Promise<{
    valid: boolean
    errors: string[]
  }> {
    const errors: string[] = []

    try {
      const eligibility = await this.checkExecutionEligibility(proposalAddress)
      
      if (!eligibility.eligible) {
        errors.push(eligibility.reason)
      }

      // Check if proposal is already being executed
      const existingProgress = this.getAllExecutionProgress().find(
        p => p.status === 'in-progress'
      )
      
      if (existingProgress) {
        errors.push('Proposal is already being executed')
      }

      // Additional validation could include:
      // - Check if user has sufficient permissions
      // - Verify proposal is not expired
      // - Check network conditions
      // - Validate contract state

    } catch (error) {
      errors.push('Failed to validate execution prerequisites')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Reset execution service state
   */
  static reset(): void {
    this.executionProgress.clear()
    this.executionStats = {
      totalExecuted: 0,
      totalPending: 0,
      totalRejected: 0,
      averageExecutionTime: 0,
      successRate: 0,
      totalFundsDistributed: 0n,
      totalProposalsProcessed: 0
    }
    this.votingExecutionHandler = undefined
    this.fundingExecutionHandler = undefined
  }
}
