import { ArrowLeft, Calendar, MapPin, Globe, TrendingUp, Users, DollarSign } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useProposal, useVote } from '../hooks/useContracts'
import { useTribes } from '../hooks/useTribes'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const ProposalDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { address } = useAccount()
  const { proposal, isLoading } = useProposal(id ? parseInt(id) : 0)
  const { vote, isPending: isVoting } = useVote()
  const { trackGovernanceAction } = useTribes()

  const handleVote = async (choice: 'for' | 'against' | 'abstain') => {
    if (!address) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!proposal) {
      toast.error('Proposal not found')
      return
    }

    try {
      const voteChoice = choice === 'for' ? 1 : choice === 'against' ? 0 : 2
      await vote(1, voteChoice) // Using proposal ID 1 as placeholder
      
      // Track governance action in Tribes
      await trackGovernanceAction('vote', `Voted ${choice} on proposal #1`)
      
      toast.success(`Vote cast: ${choice}`)
    } catch (error) {
      console.error('Voting error:', error)
      toast.error('Failed to cast vote')
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <LoadingSpinner />
      </div>
    )
  }

  // Since we can't fetch individual proposals from the contract yet,
  // we'll show a placeholder proposal for demonstration
  const placeholderProposal = {
    id: 1,
    title: 'Sample Environmental Project',
    description: 'This is a placeholder displayProposal. In a real implementation, this would be fetched from the blockchain.',
    category: 'Renewable Energy',
    status: 'Active',
    location: 'Global',
    duration: 365,
    website: 'https://example.com',
    proposer: '0x1234...5678',
    endDate: '2024-12-31',
    daysLeft: 30,
    images: [],
    co2Reduction: 1000,
    energyGeneration: 5000,
    jobsCreated: 50,
    impactScore: 85,
    requestedAmount: '$100,000',
    forVotes: 150,
    againstVotes: 25,
    votes: 175
  }

  const displayProposal = proposal || placeholderProposal

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
          {/* Voting */}
          {displayProposal.status === 'Active' && address && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Cast Your Vote</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleVote('for')}
                  disabled={isVoting}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVoting ? 'Voting...' : 'Vote For'}
                </button>
                <button
                  onClick={() => handleVote('against')}
                  disabled={isVoting}
                  className="w-full btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVoting ? 'Voting...' : 'Vote Against'}
                </button>
                <button
                  onClick={() => handleVote('abstain')}
                  disabled={isVoting}
                  className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVoting ? 'Voting...' : 'Abstain'}
                </button>
              </div>
            </div>
          )}
          
          {displayProposal.status === 'Active' && !address && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Connect Wallet to Vote</h3>
              <p className="text-gray-600 mb-4">Please connect your wallet to participate in voting.</p>
              <button
                onClick={() => navigate('/')}
                className="w-full btn-primary"
              >
                Connect Wallet
              </button>
            </div>
          )}

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

          {/* Voting Results */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Voting Results</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>For</span>
                  <span>{displayProposal.forVotes} votes</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(displayProposal.forVotes / displayProposal.votes) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Against</span>
                  <span>{displayProposal.againstVotes} votes</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(displayProposal.againstVotes / displayProposal.votes) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>Total Votes:</span>
                  <span className="font-medium">{displayProposal.votes.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProposalDetail
