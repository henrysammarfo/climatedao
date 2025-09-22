import { ArrowLeft, Calendar, MapPin, Globe, TrendingUp, Users, DollarSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const ProposalDetail = () => {
  const navigate = useNavigate()

  // Mock data - in real app, this would come from the contract/API
  const proposal = {
    id: 1,
    title: 'Solar Farm in Kenya',
    description: 'Building a 50MW solar farm to provide clean energy to 100,000 homes in rural Kenya. This project will significantly reduce carbon emissions and provide reliable electricity to underserved communities.',
    location: 'Kenya, East Africa',
    category: 'Renewable Energy',
    requestedAmount: '$2,500,000',
    duration: 365,
    website: 'https://kenyasolarproject.com',
    proposer: '0x1234...5678',
    status: 'Active',
    votes: 1247,
    forVotes: 892,
    againstVotes: 355,
    impactScore: 92,
    co2Reduction: 15000, // tons per year
    energyGeneration: 87500, // MWh per year
    jobsCreated: 250,
    endDate: '2024-10-15',
    daysLeft: 7,
    images: [
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800',
      'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800',
    ]
  }

  const handleVote = (choice: 'for' | 'against' | 'abstain') => {
    // TODO: Implement voting logic
    console.log('Voting:', choice)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
              {proposal.category}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              proposal.status === 'Active' 
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {proposal.status}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{proposal.title}</h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Images */}
          <div className="card">
            <div className="grid grid-cols-2 gap-4">
              {proposal.images.map((image, index) => (
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
            <p className="text-gray-700 leading-relaxed">{proposal.description}</p>
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
                    <div className="font-medium">{proposal.location}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="font-medium">{proposal.duration} days</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Website</div>
                    <a 
                      href={proposal.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-primary-600 hover:text-primary-700"
                    >
                      {proposal.website}
                    </a>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Proposer</div>
                  <div className="font-medium font-mono">{proposal.proposer}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Voting Ends</div>
                  <div className="font-medium">{proposal.endDate}</div>
                </div>
                {proposal.status === 'Active' && (
                  <div>
                    <div className="text-sm text-gray-600">Time Remaining</div>
                    <div className="font-medium text-blue-600">{proposal.daysLeft} days left</div>
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
                <div className="text-2xl font-bold text-green-600">{proposal.co2Reduction.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Tons CO2 Reduced/Year</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{proposal.energyGeneration.toLocaleString()}</div>
                <div className="text-sm text-gray-600">MWh Energy Generated/Year</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{proposal.jobsCreated}</div>
                <div className="text-sm text-gray-600">Jobs Created</div>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Impact Score</span>
                <span className="text-sm font-medium text-primary-600">{proposal.impactScore}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-primary-600 h-3 rounded-full" 
                  style={{ width: `${proposal.impactScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Voting */}
          {proposal.status === 'Active' && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Cast Your Vote</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleVote('for')}
                  className="w-full btn-primary"
                >
                  Vote For
                </button>
                <button
                  onClick={() => handleVote('against')}
                  className="w-full btn-outline"
                >
                  Vote Against
                </button>
                <button
                  onClick={() => handleVote('abstain')}
                  className="w-full btn-secondary"
                >
                  Abstain
                </button>
              </div>
            </div>
          )}

          {/* Funding Info */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Funding Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Requested Amount:</span>
                <span className="font-medium">{proposal.requestedAmount}</span>
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
                  <span>{proposal.forVotes} votes</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(proposal.forVotes / proposal.votes) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Against</span>
                  <span>{proposal.againstVotes} votes</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(proposal.againstVotes / proposal.votes) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>Total Votes:</span>
                  <span className="font-medium">{proposal.votes.toLocaleString()}</span>
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
