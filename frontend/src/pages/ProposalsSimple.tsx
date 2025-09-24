import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Plus,
  RefreshCw,
  Wifi,
  WifiOff,
  Bell,
  FileText
} from 'lucide-react'

const ProposalsSimple = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  
  // Simple static data - no blockchain calls
  const proposals: any[] = []
  const isLoading = false
  const isConnected = true
  const newProposalCount = 0

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value)
  }

  const handleRefresh = () => {
    console.log('Refresh clicked')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
            {newProposalCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <Bell className="w-4 h-4" />
                {newProposalCount} new
              </div>
            )}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <Wifi className="w-4 h-4" />
                  <span>Live</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600 text-sm">
                  <WifiOff className="w-4 h-4" />
                  <span>Offline</span>
                </div>
              )}
            </div>
          </div>
          <p className="mt-2 text-gray-600">
            Browse and vote on climate action proposals
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="btn-outline flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          
          <Link
            to="/create"
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Proposal
          </Link>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search proposals..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="input pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={handleFilterChange}
            className="input w-auto"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="passed">Passed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Proposals List */}
      <div className="card">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading proposals...</p>
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals found</h3>
            <p className="text-gray-600 mb-6">
              Be the first to create a climate action proposal!
            </p>
            <Link
              to="/create"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create First Proposal
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg">{proposal.title}</h3>
                <p className="text-gray-600 mt-1">{proposal.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProposalsSimple
