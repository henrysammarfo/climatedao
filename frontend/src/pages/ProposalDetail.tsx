import { ArrowLeft, Calendar, MapPin, Globe, TrendingUp, Users, DollarSign } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useProposal } from '../hooks/useContracts'
import { useTribes } from '../hooks/useTribes'
import { useProposalStatusMonitor } from '../hooks/useProposalExecution'
import { useTokenBalance } from '../hooks/useTokenBalance'
import { VotingPanel } from '../components/VotingPanel'
import { ProposalExecutionPanel } from '../components/ProposalExecutionPanel'
import { lazy, Suspense } from 'react'

const ContextualFaucet = lazy(() => import('../components/ContextualFaucet'))
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'

const ProposalDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { address } = useAccount()
  const { proposal, isLoading } = useProposal(id ? parseInt(id) : 0)
  const { trackGovernanceAction } = useTribes()
  const { statusEvents, isConnected: statusConnected } = useProposalStatusMonitor()
  const { getActionRequirements } = useTokenBalance()
  const [currentProposal, setCurrentProposal] = useState(proposal)
  
  // Check voting requirements
  const votingRequirements = getActionRequirements('vote')

  // Update proposal when status changes
  useEffect(() => {
    if (proposal) {
      setCurrentProposal(proposal)
    }
  }, [proposal])

  // Monitor status changes for this specific proposal
  useEffect(() => {
    if (statusEvents.length > 0 && proposal) {
      const relevantEvent = statusEvents.find(event => 
        event.proposalId === proposal.id
      )
      
      if (relevantEvent) {
        console.log('Proposal status changed:', relevantEvent)
        
        // Update proposal status based on event
        const statusMap: { [key: number]: string } = {
          0: 'Active',
          1: 'Passed', 
          2: 'Rejected',
          3: 'Executed',
          4: 'Cancelled'
        }
        
        const newStatus = statusMap[relevantEvent.newStatus] || proposal.status
        
        setCurrentProposal((prev: any) => prev ? {
          ...prev,
          status: newStatus
        } : null)

        // Show notification
        toast.success(`Proposal status updated to ${newStatus}`)
      }
    }
  }, [statusEvents, proposal])

  const handleVoteCast = async () => {
    if (currentProposal) {
      // Track governance action in Tribes
      try {
        await trackGovernanceAction('vote', `Voted on proposal #${currentProposal.id}`)
      } catch (error) {
        console.error('Failed to track governance action:', error)
      }
    }
  }

  const handleProposalStatusUpdate = (updatedProposal: any) => {
    setCurrentProposal(updatedProposal)
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <LoadingSpinner />
      </div>
    )
  }

  if (!currentProposal) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Proposal Not Found</h2>
          <p className="text-gray-600 mb-6">The proposal you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/proposals')}
            className="btn-primary"
          >
            View All Proposals
          </button>
        </div>
      </div>
    )
  }

  const displayProposal = currentProposal

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
                <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                  {displayProposal.category}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  displayProposal.status === 'Active' 
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {displayProposal.status}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{displayProposal.title}</h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Images */}
          <div className="card">
            <div className="grid grid-cols-2 gap-4">
              {displayProposal.images?.map((image: string, index: number) => (
                <img
                  key={index}
                  src={image}
                  alt={`Project image ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Project Description</h2>
            <p className="text-gray-700 leading-relaxed">{displayProposal.description}</p>
          </div>

          {/* Project Details */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Project Details</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Location</div>
                    <div className="font-medium">{displayProposal.location}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="font-medium">{displayProposal.duration} days</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Website</div>
                    <a 
                      href={displayProposal.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-primary-600 hover:text-primary-700"
                    >
                      {displayProposal.website}
                    </a>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Proposer</div>
                  <div className="font-medium font-mono">{displayProposal.proposer}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Voting Ends</div>
                  <div className="font-medium">{displayProposal.endDate}</div>
                </div>
                {displayProposal.status === 'Active' && (
                  <div>
                    <div className="text-sm text-gray-600">Time Remaining</div>
                    <div className="font-medium text-blue-600">{displayProposal.daysLeft} days left</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Impact Metrics */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">AI Impact Assessment</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{displayProposal.co2Reduction.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Tons CO2 Reduced/Year</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{displayProposal.energyGeneration.toLocaleString()}</div>
                <div className="text-sm text-gray-600">MWh Energy Generated/Year</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{displayProposal.jobsCreated}</div>
                <div className="text-sm text-gray-600">Jobs Created</div>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Impact Score</span>
                <span className="text-sm font-medium text-primary-600">{displayProposal.impactScore}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-primary-600 h-3 rounded-full" 
                  style={{ width: `${displayProposal.impactScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Token Requirements for Voting */}
          {address && displayProposal.status === 'Active' && !votingRequirements.canVote && (
            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>}>
              <ContextualFaucet 
                mode="inline" 
                action="vote"
                className="mb-4"
              />
            </Suspense>
          )}
          
          {/* Voting Panel */}
          <VotingPanel 
            proposal={displayProposal} 
            onVoteCast={handleVoteCast}
          />

          {/* Execution Panel */}
          <ProposalExecutionPanel 
            proposal={displayProposal}
            onStatusUpdate={handleProposalStatusUpdate}
          />

          {/* Funding Info */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Funding Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Requested Amount:</span>
                <span className="font-medium">{displayProposal.requestedAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee (2.5%):</span>
                <span className="font-medium">$62,500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Net to Project:</span>
                <span className="font-medium">$2,437,500</span>
              </div>
            </div>
          </div>

          {/* Real-time Status Indicator */}
          {statusConnected && (
            <div className="card">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Real-time status monitoring active</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProposalDetail
