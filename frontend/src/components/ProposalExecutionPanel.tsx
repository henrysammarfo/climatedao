import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { 
  useExecuteProposalVoting, 
  useExecuteProposalFunding, 
  useProposalExecutionStatus 
} from '../hooks/useContracts'
import { ProposalService } from '../services/proposalService'
import { UIProposal } from '../types/proposal'
import { formatEther } from 'viem'
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline'

interface ProposalExecutionPanelProps {
  proposal: UIProposal
  onStatusUpdate?: (proposal: UIProposal) => void
}

export const ProposalExecutionPanel: React.FC<ProposalExecutionPanelProps> = ({
  proposal,
  onStatusUpdate
}) => {
  const { address } = useAccount()
  const [executionReadiness, setExecutionReadiness] = useState<{
    ready: boolean
    stage: 'voting' | 'funding' | 'completed' | 'not-ready'
    reason: string
  } | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { 
    executionStatus, 
    error: statusError, 
    refetch: refetchStatus 
  } = useProposalExecutionStatus(proposal.contractAddress)

  const { 
    executeProposalVoting, 
    isPending: votingPending, 
    isConfirmed: votingConfirmed 
  } = useExecuteProposalVoting(proposal.contractAddress)

  const { 
    executeProposalFunding, 
    isPending: fundingPending, 
    isConfirmed: fundingConfirmed 
  } = useExecuteProposalFunding(proposal.id)

  // Check execution readiness
  useEffect(() => {
    const checkReadiness = async () => {
      if (!proposal.contractAddress) return

      try {
        const readiness = await ProposalService.isProposalReadyForExecution(proposal.contractAddress)
        setExecutionReadiness(readiness)
      } catch (error) {
        console.error('Failed to check execution readiness:', error)
      }
    }

    checkReadiness()
  }, [proposal.contractAddress, proposal.status])

  // Update time left countdown
  useEffect(() => {
    if (!executionStatus?.votingEndTime) return

    const updateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000)
      const endTime = Number(executionStatus.votingEndTime)
      const timeDiff = endTime - now

      if (timeDiff <= 0) {
        setTimeLeft('Voting ended')
        return
      }

      const days = Math.floor(timeDiff / 86400)
      const hours = Math.floor((timeDiff % 86400) / 3600)
      const minutes = Math.floor((timeDiff % 3600) / 60)

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`)
      } else {
        setTimeLeft(`${minutes}m`)
      }
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [executionStatus?.votingEndTime])

  // Handle execution status updates
  useEffect(() => {
    if (votingConfirmed || fundingConfirmed) {
      setIsRefreshing(true)
      refetchStatus()
      
      // Refresh execution readiness and fetch latest proposal data
      setTimeout(async () => {
        try {
          const readiness = await ProposalService.isProposalReadyForExecution(proposal.contractAddress)
          setExecutionReadiness(readiness)
          
          // Fetch the latest proposal data to get updated state
          const updatedProposal = await ProposalService.getProposal(proposal.id)
          
          // Notify parent component of status update with fresh data
          if (onStatusUpdate && updatedProposal) {
            onStatusUpdate(updatedProposal)
          }
        } catch (error) {
          console.error('Failed to refresh execution readiness:', error)
        } finally {
          setIsRefreshing(false)
        }
      }, 2000)
    }
  }, [votingConfirmed, fundingConfirmed, proposal.contractAddress, proposal.id, refetchStatus, onStatusUpdate])

  const handleExecuteVoting = async () => {
    try {
      await executeProposalVoting()
    } catch (error) {
      console.error('Failed to execute voting:', error)
    }
  }

  const handleExecuteFunding = async () => {
    try {
      await executeProposalFunding()
    } catch (error) {
      console.error('Failed to execute funding:', error)
    }
  }

  const getStatusIcon = () => {
    if (proposal.status === 'Executed') {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />
    }
    if (proposal.status === 'Rejected') {
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
    }
    if (executionReadiness?.stage === 'voting') {
      return <DocumentCheckIcon className="h-5 w-5 text-yellow-500" />
    }
    if (executionReadiness?.stage === 'funding') {
      return <CurrencyDollarIcon className="h-5 w-5 text-blue-500" />
    }
    return <ClockIcon className="h-5 w-5 text-gray-500" />
  }

  const getStatusText = () => {
    if (proposal.status === 'Executed') {
      return 'Proposal Executed'
    }
    if (proposal.status === 'Rejected') {
      return 'Proposal Rejected'
    }
    if (executionReadiness?.stage === 'voting') {
      return 'Ready to Resolve Voting'
    }
    if (executionReadiness?.stage === 'funding') {
      return 'Ready to Distribute Funds'
    }
    if (proposal.status === 'Active') {
      return `Voting Active - ${timeLeft} left`
    }
    return proposal.status
  }

  const getStatusColor = () => {
    if (proposal.status === 'Executed') {
      return 'text-green-600 bg-green-50 border-green-200'
    }
    if (proposal.status === 'Rejected') {
      return 'text-red-600 bg-red-50 border-red-200'
    }
    if (executionReadiness?.stage === 'voting') {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
    if (executionReadiness?.stage === 'funding') {
      return 'text-blue-600 bg-blue-50 border-blue-200'
    }
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  // Don't show panel for completed proposals
  if (proposal.status === 'Executed' || proposal.status === 'Rejected') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-medium text-gray-900">Execution Status</h3>
            <p className={`text-sm ${getStatusColor().split(' ')[0]}`}>
              {getStatusText()}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Don't show panel if not ready for execution
  if (!executionReadiness?.ready && proposal.status === 'Active') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-medium text-gray-900">Execution Status</h3>
            <p className="text-sm text-gray-600">
              {getStatusText()}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-medium text-gray-900">Execution Status</h3>
            <p className={`text-sm ${getStatusColor().split(' ')[0]}`}>
              {getStatusText()}
            </p>
          </div>
        </div>
        
        {isRefreshing && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        )}
      </div>

      {/* Execution Progress */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          {/* Step 1: Voting */}
          <div className={`flex items-center space-x-2 ${
            proposal.status === 'Active' ? 'text-gray-400' : 'text-green-600'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              proposal.status === 'Active' 
                ? 'bg-gray-100 text-gray-400' 
                : 'bg-green-100 text-green-600'
            }`}>
              1
            </div>
            <span className="text-sm font-medium">Voting</span>
          </div>

          <div className={`flex-1 h-0.5 ${
            proposal.status === 'Active' ? 'bg-gray-200' : 'bg-green-200'
          }`} />

          {/* Step 2: Resolution */}
          <div className={`flex items-center space-x-2 ${
            executionReadiness?.stage === 'voting' 
              ? 'text-yellow-600' 
              : executionReadiness?.stage === 'funding' || proposal.status === 'Executed'
              ? 'text-green-600'
              : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              executionReadiness?.stage === 'voting'
                ? 'bg-yellow-100 text-yellow-600'
                : executionReadiness?.stage === 'funding' || proposal.status === 'Executed'
                ? 'bg-green-100 text-green-600'
                : 'bg-gray-100 text-gray-400'
            }`}>
              2
            </div>
            <span className="text-sm font-medium">Resolution</span>
          </div>

          <div className={`flex-1 h-0.5 ${
            executionReadiness?.stage === 'funding' || proposal.status === 'Executed'
              ? 'bg-green-200'
              : 'bg-gray-200'
          }`} />

          {/* Step 3: Funding */}
          <div className={`flex items-center space-x-2 ${
            proposal.status === 'Executed' 
              ? 'text-green-600' 
              : executionReadiness?.stage === 'funding'
              ? 'text-blue-600'
              : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              proposal.status === 'Executed'
                ? 'bg-green-100 text-green-600'
                : executionReadiness?.stage === 'funding'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-400'
            }`}>
              3
            </div>
            <span className="text-sm font-medium">Funding</span>
          </div>
        </div>
      </div>

      {/* Execution Actions */}
      {executionReadiness?.ready && (
        <div className="space-y-4">
          {executionReadiness.stage === 'voting' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">
                    Voting Period Ended
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    The voting period has ended. Click below to resolve the voting status and determine if the proposal passed.
                  </p>
                </div>
                <button
                  onClick={handleExecuteVoting}
                  disabled={votingPending || !address}
                  className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {votingPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Resolving...
                    </>
                  ) : (
                    <>
                      <DocumentCheckIcon className="h-4 w-4 mr-2" />
                      Resolve Voting
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {executionReadiness.stage === 'funding' && (
            <div className={`border rounded-lg p-4 ${
              false 
                ? 'bg-red-50 border-red-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-sm font-medium ${
                    false 
                      ? 'text-red-800' 
                      : 'text-blue-800'
                  }`}>
                    Proposal Passed
                  </h4>
                  <p className={`text-sm mt-1 ${
                    false 
                      ? 'text-red-700' 
                      : 'text-blue-700'
                  }`}>
                    {false ? (
                      <>
                        The proposal has passed voting, but the DAO has insufficient funds.
                      </>
                    ) : (
                      <>
                        The proposal has passed voting. Click below to distribute {formatEther(BigInt(parseFloat(proposal.requestedAmount) * 1e18))} XDC to the beneficiary.
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={handleExecuteFunding}
                  disabled={fundingPending || !address || false}
                  className={`ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    false
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  }`}
                  title={false ? 'Insufficient DAO funds' : ''}
                >
                  {fundingPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Distributing...
                    </>
                  ) : (
                    <>
                      <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                      Distribute Funds
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {statusError && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error Loading Execution Status
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {statusError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Connection Warning */}
      {!address && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Wallet Not Connected
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Please connect your wallet to execute proposals.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
