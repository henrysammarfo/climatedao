import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { VariableSizeList as List } from 'react-window'
import { Link } from 'react-router-dom'
import { 
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search
} from 'lucide-react'
import { ProposalCardSkeleton, ProposalListSkeleton } from './ProposalSkeleton'

interface Proposal {
  id: number
  title: string
  description: string
  category: string
  status: string
  proposer: string
  endDate: string
  daysLeft: number
  requestedAmount: string
  votes: number
  forVotes: number
  againstVotes: number
  impactScore: number
  analysisComplete: boolean
  isOptimistic?: boolean
}

interface VirtualizedProposalListProps {
  proposals: Proposal[]
  isLoading: boolean
  className?: string
}

interface ProposalItemProps {
  index: number
  style: React.CSSProperties
  data: {
    proposals: Proposal[]
    getStatusIcon: (status: string) => React.ReactNode
    getStatusColor: (status: string) => string
  }
}

const ProposalItem: React.FC<ProposalItemProps> = ({ index, style, data }) => {
  const { proposals, getStatusIcon, getStatusColor } = data
  const proposal = proposals[index]

  if (!proposal) {
    return (
      <div style={style} className="px-4">
        <ProposalCardSkeleton />
      </div>
    )
  }

  return (
    <div style={style} className="px-4 pb-6">
      <div className="card hover:shadow-lg transition-shadow">
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
            <p className="text-gray-600 mb-4 line-clamp-3">{proposal.description}</p>

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
    </div>
  )
}

const VirtualizedProposalList: React.FC<VirtualizedProposalListProps> = ({
  proposals,
  isLoading,
  className = ''
}) => {
  const [listHeight, setListHeight] = useState(600)
  const [itemHeights, setItemHeights] = useState<number[]>([])


  // Update list height based on window size
  useEffect(() => {
    const updateDimensions = () => {
      const windowHeight = window.innerHeight
      const headerHeight = 200 // Approximate header height
      const footerHeight = 100 // Approximate footer height
      const availableHeight = windowHeight - headerHeight - footerHeight
      setListHeight(Math.max(400, availableHeight))
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Calculate item heights based on content
  useEffect(() => {
    const calculateItemHeights = () => {
      const heights = proposals.map(proposal => {
        // Base height for proposal cards
        const baseHeight = 280
        // Add extra height for longer descriptions (clamp to reasonable range)
        const descriptionLength = proposal.description.length
        const extraHeight = Math.min(80, Math.max(0, (descriptionLength - 100) / 15))
        return baseHeight + extraHeight
      })
      setItemHeights(heights)
    }

    if (proposals.length > 0) {
      calculateItemHeights()
    }
  }, [proposals])

  const getStatusIcon = useCallback((status: string) => {
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
  }, [])

  const getStatusColor = useCallback((status: string) => {
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
  }, [])

  // Function to get item height for VariableSizeList
  const getItemHeight = useCallback((index: number) => {
    return itemHeights[index] || 300 // fallback height
  }, [itemHeights])

  // Prepare data for virtualized list
  const itemData = useMemo(() => ({
    proposals: proposals,
    getStatusIcon,
    getStatusColor
  }), [proposals, getStatusIcon, getStatusColor])

  // Show loading skeleton if no proposals and loading
  if (isLoading && proposals.length === 0) {
    return (
      <div className={className}>
        <ProposalListSkeleton count={5} />
      </div>
    )
  }

  // Show empty state if no proposals
  if (proposals.length === 0 && !isLoading) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Proposals Found</h3>
        <p className="text-gray-600 mb-6">
          Be the first to create an environmental proposal!
        </p>
        <Link to="/create" className="btn-primary">
          Create First Proposal
        </Link>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Loading indicator for background updates */}
      {isLoading && proposals.length > 0 && (
        <div className="flex items-center justify-center py-4 mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Updating proposals...</span>
          </div>
        </div>
      )}

      {/* Virtualized List */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <List
          height={listHeight}
          width="100%"
          itemCount={proposals.length}
          itemSize={getItemHeight}
          itemData={itemData}
          overscanCount={3} // Render 3 extra items for smooth scrolling
        >
          {ProposalItem}
        </List>
      </div>

      {/* Performance info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Rendering {proposals.length} proposals (Virtualized)
        </div>
      )}
    </div>
  )
}

export default VirtualizedProposalList
