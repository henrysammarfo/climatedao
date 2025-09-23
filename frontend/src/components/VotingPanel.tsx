// Comprehensive Voting Panel Component
import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useVoteOnProposal, useProposalVotingData, useCanUserVote } from '../hooks/useContracts'
import { useVotingPower } from '../hooks/useVotingPower'
import { UIProposal } from '../types/proposal'
import { ProposalService } from '../services/proposalService'
import LoadingSpinner from './LoadingSpinner'
import toast from 'react-hot-toast'

interface VotingPanelProps {
  proposal: UIProposal
  onVoteCast?: () => void
}

export const VotingPanel: React.FC<VotingPanelProps> = ({ proposal, onVoteCast }) => {
  const { address } = useAccount()
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  // Voting hooks
  const { castVote, isPending: isVoting, isConfirmed } = useVoteOnProposal(proposal.contractAddress)
  const { 
    forVotes, 
    againstVotes, 
    abstainVotes, 
    totalVotes, 
    hasUserVoted, 
    userVoteChoice, 
    votingEnd, 
    hasPassed,
    refetch: refetchVotingData 
  } = useProposalVotingData(proposal.contractAddress)
  
  const { canVote, reason, hasMinimumVotingPower, isVotingActive } = useCanUserVote(proposal.contractAddress)
  const { 
    formattedVotingPower, 
    claimTokens, 
    isClaiming, 
    getVotingPowerStatus 
  } = useVotingPower()

  // Auto-refresh voting data after successful vote
  useEffect(() => {
    if (isConfirmed) {
      refetchVotingData()
      onVoteCast?.()
    }
  }, [isConfirmed, refetchVotingData, onVoteCast])

  // Real-time voting event updates
  useEffect(() => {
    if (!proposal.contractAddress) return

    const unwatch = ProposalService.watchVotingEvents(proposal.contractAddress, () => {
      refetchVotingData()
    })

    return () => {
      unwatch()
    }
  }, [proposal.contractAddress, refetchVotingData])

  const handleVote = async (choice: number) => {
    if (!canVote || !address) {
      toast.error('You cannot vote at this time')
      return
    }

    setSelectedChoice(choice)
    setShowConfirmation(true)
  }

  const confirmVote = async () => {
    if (selectedChoice === null) return

    try {
      await castVote(selectedChoice)
      setShowConfirmation(false)
      setSelectedChoice(null)
    } catch (error) {
      console.error('Failed to cast vote:', error)
      setShowConfirmation(false)
      setSelectedChoice(null)
    }
  }

  const cancelVote = () => {
    setShowConfirmation(false)
    setSelectedChoice(null)
  }

  const getVoteChoiceText = (choice: number) => {
    switch (choice) {
      case 0: return 'Against'
      case 1: return 'For'
      case 2: return 'Abstain'
      default: return 'Unknown'
    }
  }

  const getVoteChoiceColor = (choice: number) => {
    switch (choice) {
      case 0: return 'text-red-600 bg-red-50 border-red-200'
      case 1: return 'text-green-600 bg-green-50 border-green-200'
      case 2: return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const votingPowerStatus = getVotingPowerStatus()
  const now = Math.floor(Date.now() / 1000)
  const timeRemaining = Number(votingEnd) - now
  const daysRemaining = Math.max(0, Math.ceil(timeRemaining / 86400))
  const hoursRemaining = Math.max(0, Math.ceil((timeRemaining % 86400) / 3600))

  // Calculate vote percentages
  const forPercentage = totalVotes > 0n ? (Number(forVotes) / Number(totalVotes)) * 100 : 0
  const againstPercentage = totalVotes > 0n ? (Number(againstVotes) / Number(totalVotes)) * 100 : 0
  const abstainPercentage = totalVotes > 0n ? (Number(abstainVotes) / Number(totalVotes)) * 100 : 0

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Voting Power Section */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Voting Power</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              {formattedVotingPower} CLIMATE tokens
            </span>
          </div>
          {!hasMinimumVotingPower && (
            <button
              onClick={claimTokens}
              disabled={isClaiming}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isClaiming ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Claiming...</span>
                </>
              ) : (
                <span>Claim Tokens</span>
              )}
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {votingPowerStatus.message}
        </p>
      </div>

      {/* Voting Status */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Voting Status</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <span className={`text-sm font-medium ${
              isVotingActive ? 'text-green-600' : 'text-red-600'
            }`}>
              {isVotingActive ? 'Active' : 'Ended'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Time Remaining:</span>
            <span className="text-sm font-medium text-gray-900">
              {daysRemaining > 0 ? `${daysRemaining}d ${hoursRemaining}h` : 'Voting ended'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Your Vote:</span>
            {hasUserVoted ? (
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${getVoteChoiceColor(userVoteChoice)}`}>
                {getVoteChoiceText(userVoteChoice)}
              </span>
            ) : (
              <span className="text-sm text-gray-500">Not voted</span>
            )}
          </div>
        </div>
      </div>

      {/* Voting Results */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Voting Results</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-green-600 font-medium">For</span>
              <span className="text-gray-600">{Number(forVotes)} votes ({forPercentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${forPercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-red-600 font-medium">Against</span>
              <span className="text-gray-600">{Number(againstVotes)} votes ({againstPercentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${againstPercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 font-medium">Abstain</span>
              <span className="text-gray-600">{Number(abstainVotes)} votes ({abstainPercentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gray-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${abstainPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Votes:</span>
            <span className="font-medium text-gray-900">{Number(totalVotes)}</span>
          </div>
          {hasPassed && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">✓ Proposal has passed</p>
            </div>
          )}
        </div>
      </div>

      {/* Voting Actions */}
      {!hasUserVoted && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Cast Your Vote</h3>
          {canVote ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => handleVote(1)}
                  disabled={isVoting}
                  className="p-4 border-2 border-green-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-green-700">Vote For</span>
                    </div>
                    <span className="text-sm text-gray-500">Support this proposal</span>
                  </div>
                </button>
                
                <button
                  onClick={() => handleVote(0)}
                  disabled={isVoting}
                  className="p-4 border-2 border-red-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span className="font-medium text-red-700">Vote Against</span>
                    </div>
                    <span className="text-sm text-gray-500">Oppose this proposal</span>
                  </div>
                </button>
                
                <button
                  onClick={() => handleVote(2)}
                  disabled={isVoting}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                      <span className="font-medium text-gray-700">Abstain</span>
                    </div>
                    <span className="text-sm text-gray-500">Neutral position</span>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Cannot vote:</strong> {reason}
              </p>
              {!hasMinimumVotingPower && (
                <button
                  onClick={claimTokens}
                  disabled={isClaiming}
                  className="mt-2 px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                  {isClaiming ? 'Claiming...' : 'Claim Tokens'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Vote Confirmation Modal */}
      {showConfirmation && selectedChoice !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Your Vote</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                You are about to vote <strong>{getVoteChoiceText(selectedChoice)}</strong> on this proposal.
              </p>
              <p className="text-sm text-gray-600">
                Voting weight: <strong>{formattedVotingPower} CLIMATE tokens</strong>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={confirmVote}
                disabled={isVoting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isVoting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Voting...</span>
                  </>
                ) : (
                  <span>Confirm Vote</span>
                )}
              </button>
              <button
                onClick={cancelVote}
                disabled={isVoting}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
