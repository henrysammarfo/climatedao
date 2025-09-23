import React from 'react'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width, 
  height 
}) => {
  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div 
      className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}
      style={style}
    />
  )
}

export const ProposalCardSkeleton: React.FC = () => {
  return (
    <div className="card">
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Main Content */}
        <div className="flex-1">
          {/* Category and Status badges */}
          <div className="flex items-center space-x-2 mb-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
            <div className="ml-auto">
              <Skeleton className="h-4 w-16" />
            </div>
          </div>

          {/* Title */}
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/2 mb-4" />

          {/* Description */}
          <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          {/* Proposer and End Date */}
          <div className="flex flex-wrap gap-4 text-sm">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Stats and Actions */}
        <div className="lg:w-80 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Skeleton className="h-6 w-16 mx-auto mb-1" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Skeleton className="h-6 w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-8 mx-auto" />
            </div>
          </div>

          {/* Impact Score */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export const ProposalListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid gap-6">
      {Array.from({ length: count }, (_, index) => (
        <ProposalCardSkeleton key={index} />
      ))}
    </div>
  )
}

export const ProposalHeaderSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

export const ProposalSearchSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="relative flex-1">
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

export const ProposalStatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="card text-center">
          <Skeleton className="h-8 w-16 mx-auto mb-2" />
          <Skeleton className="h-4 w-20 mx-auto" />
        </div>
      ))}
    </div>
  )
}

export const ProposalDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
        
        <Skeleton className="h-8 w-3/4 mb-3" />
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          
          <div className="card">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <Skeleton className="h-6 w-20 mb-4" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
          
          <div className="card">
            <Skeleton className="h-6 w-16 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const VotingPanelSkeleton: React.FC = () => {
  return (
    <div className="card">
      <Skeleton className="h-6 w-24 mb-4" />
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-2 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}

export const ProposalFormSkeleton: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="card">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-4">
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-12 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-18 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-14 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Shimmer effect for enhanced visual appeal
export const ShimmerSkeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width, 
  height 
}) => {
  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div 
      className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      style={style}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  )
}

export default ProposalCardSkeleton
