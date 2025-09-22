import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Plus,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'

const Proposals = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')

  const proposals = [
    {
      id: 1,
      title: 'Solar Farm in Kenya',
      description: 'Building a 50MW solar farm to provide clean energy to 100,000 homes in rural Kenya.',
      category: 'Renewable Energy',
      requestedAmount: '$2,500,000',
      votes: 1247,
      status: 'Active',
      impactScore: 92,
      proposer: '0x1234...5678',
      endDate: '2024-10-15',
      daysLeft: 7,
    },
    {
      id: 2,
      title: 'Ocean Plastic Cleanup Initiative',
      description: 'Deploying autonomous drones to clean plastic waste from the Pacific Ocean.',
      category: 'Ocean Cleanup',
      requestedAmount: '$1,800,000',
      votes: 892,
      status: 'Active',
      impactScore: 88,
      proposer: '0x2345...6789',
      endDate: '2024-10-20',
      daysLeft: 12,
    },
    {
      id: 3,
      title: 'Amazon Reforestation Project',
      description: 'Planting 1 million trees to restore degraded areas of the Amazon rainforest.',
      category: 'Reforestation',
      requestedAmount: '$3,200,000',
      votes: 2156,
      status: 'Passed',
      impactScore: 95,
      proposer: '0x3456...7890',
      endDate: '2024-09-30',
      daysLeft: 0,
    },
    {
      id: 4,
      title: 'Carbon Capture Technology',
      description: 'Developing advanced carbon capture technology for industrial applications.',
      category: 'Carbon Capture',
      requestedAmount: '$4,500,000',
      votes: 543,
      status: 'Rejected',
      impactScore: 76,
      proposer: '0x4567...8901',
      endDate: '2024-09-25',
      daysLeft: 0,
    },
  ]

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || proposal.status.toLowerCase() === filter
    return matchesSearch && matchesFilter
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'Passed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-blue-100 text-blue-800'
      case 'Passed':
        return 'bg-green-100 text-green-800'
      case 'Rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
          <p className="text-gray-600 mt-1">
            Explore and vote on environmental projects seeking funding
          </p>
        </div>
        <Link to="/create" className="btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Create Proposal
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search proposals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="passed">Passed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Proposals Grid */}
      <div className="grid gap-6">
        {filteredProposals.map((proposal) => (
          <div key={proposal.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Main Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                      {proposal.category}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${getStatusColor(proposal.status)}`}>
                      {getStatusIcon(proposal.status)}
                      <span>{proposal.status}</span>
                    </span>
                  </div>
                  {proposal.status === 'Active' && (
                    <span className="text-sm text-gray-500">
                      {proposal.daysLeft} days left
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-semibold mb-2">{proposal.title}</h3>
                <p className="text-gray-600 mb-4">{proposal.description}</p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>Proposer: {proposal.proposer}</span>
                  <span>•</span>
                  <span>Ends: {proposal.endDate}</span>
                </div>
              </div>

              {/* Stats and Actions */}
              <div className="lg:w-80 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">
                      {proposal.requestedAmount}
                    </div>
                    <div className="text-xs text-gray-600">Requested</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">
                      {proposal.votes.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Votes</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Impact Score:</span>
                    <span className="font-medium text-primary-600">
                      {proposal.impactScore}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ width: `${proposal.impactScore}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Link 
                    to={`/proposals/${proposal.id}`}
                    className="btn-primary w-full text-center"
                  >
                    View Details
                  </Link>
                  {proposal.status === 'Active' && (
                    <button className="btn-outline w-full">
                      Vote Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProposals.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search terms or filters
          </p>
          <Link to="/create" className="btn-primary">
            Create the First Proposal
          </Link>
        </div>
      )}
    </div>
  )
}

export default Proposals
