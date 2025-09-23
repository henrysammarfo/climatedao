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
  TrendingUp,
  Activity
} from 'lucide-react'
import { useProposalEvents } from '../hooks/useProposalEvents'
import { useTokenBalance } from '../hooks/useTokenBalance'
import { ProposalListSkeleton, ProposalHeaderSkeleton, ProposalSearchSkeleton } from '../components/ProposalSkeleton'
import VirtualizedProposalList from '../components/VirtualizedProposalList'
import ContextualFaucet from '../components/ContextualFaucet'
import { performanceService } from '../services/performanceService'
import toast from 'react-hot-toast'

const Proposals = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false)
  
  const { 
    proposals, 
    isLoading, 
    isConnected, 
    newProposalCount, 
    refetchProposals, 
    refreshProposals,
    loadingStages,
    performanceMetrics
  } = useProposalEvents()
  
  const { getActionRequirements } = useTokenBalance()
  const votingRequirements = getActionRequirements('vote')

  // Filter proposals based on search and filter
  const filteredProposals = proposals?.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || proposal.status.toLowerCase() === filter.toLowerCase()
    return matchesSearch && matchesFilter
  }) || []

  const handleRefresh = async () => {
    try {
      performanceService.startLoadingStage('manual-refresh')
      await refreshProposals()
      toast.success('Proposals refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh proposals')
    } finally {
      performanceService.endLoadingStage('manual-refresh')
    }
  }

  const handleRefetch = async () => {
    try {
      performanceService.startLoadingStage('manual-refetch')
      await refetchProposals()
      toast.success('Proposals updated')
    } catch (error) {
      toast.error('Failed to update proposals')
    } finally {
      performanceService.endLoadingStage('manual-refetch')
    }
  }

  // Show contextual faucet if user needs tokens for voting
  const showContextualFaucet = !votingRequirements.canVote && proposals.length > 0

  // Progressive loading: show skeleton while loading initial data
  if (isLoading && proposals.length === 0) {
    return (
      <div className="space-y-8">
        <ProposalHeaderSkeleton />
        <ProposalSearchSkeleton />
        <ProposalListSkeleton count={5} />
      </div>
    )
  }


  return (
    <div className="space-y-8">
      {/* Contextual Faucet Banner */}
      {showContextualFaucet && (
        <ContextualFaucet 
          mode="banner" 
          action="vote"
          className="mb-6"
        />
      )}

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
            {/* Performance indicator */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => setShowPerformanceMetrics(!showPerformanceMetrics)}
                className="flex items-center gap-1 text-blue-600 text-sm hover:text-blue-800"
                title="Toggle performance metrics"
              >
                <Activity className="w-4 h-4" />
                <span>Perf</span>
              </button>
            )}
          </div>
          <p className="text-gray-600 mt-1">
            Explore and vote on environmental projects seeking funding
          </p>
          
          {/* Performance Metrics (Development only) */}
          {showPerformanceMetrics && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Performance Metrics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-gray-600">Cache Hit Rate</div>
                  <div className="font-mono">{(performanceMetrics.cacheHitRate * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-gray-600">Total Load Time</div>
                  <div className="font-mono">{performanceMetrics.totalLoadTime.toFixed(0)}ms</div>
                </div>
                <div>
                  <div className="text-gray-600">Cache Load</div>
                  <div className="font-mono">{performanceMetrics.cacheLoadTime.toFixed(0)}ms</div>
                </div>
                <div>
                  <div className="text-gray-600">Fresh Data</div>
                  <div className="font-mono">{performanceMetrics.freshDataLoadTime.toFixed(0)}ms</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Loading: Cache: {loadingStages.cacheLoading ? '✓' : '✗'} | 
                Fresh: {loadingStages.freshDataLoading ? '✓' : '✗'} | 
                Real-time: {loadingStages.realTimeUpdates ? '✓' : '✗'}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefetch}
            disabled={isLoading}
            className="btn-outline flex items-center disabled:opacity-50"
            title="Update proposals"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Update
          </button>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="btn-outline flex items-center disabled:opacity-50"
            title="Refresh all proposals"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link to="/create" className="btn-primary flex items-center">
            <Plus className="w-4 h-4 mr-2" />
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

      {/* Virtualized Proposals List */}
      <VirtualizedProposalList
        proposals={filteredProposals}
        isLoading={isLoading}
        className="min-h-[400px]"
      />
    </div>
  )
}

export default Proposals
