import React from 'react'
import { AchievementStatus } from '../services/achievementService'
import { 
  CheckCircle, 
  Lock, 
  TrendingUp, 
  Star,
  Trophy,
  Award,
  Crown,
  Zap
} from 'lucide-react'

interface AchievementCardProps {
  achievement: AchievementStatus
  progress?: number
  isEarned?: boolean
  onClick?: () => void
  showProgress?: boolean
  className?: string
}

const getRarityIcon = (rarity: string) => {
  switch (rarity) {
    case 'legendary':
      return <Crown className="w-4 h-4 text-yellow-500" />
    case 'epic':
      return <Trophy className="w-4 h-4 text-purple-500" />
    case 'rare':
      return <Award className="w-4 h-4 text-blue-500" />
    default:
      return <Star className="w-4 h-4 text-gray-500" />
  }
}

const getRarityBorderColor = (rarity: string, isEarned: boolean) => {
  if (!isEarned) return 'border-gray-200'
  
  switch (rarity) {
    case 'legendary':
      return 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100'
    case 'epic':
      return 'border-purple-400 bg-gradient-to-br from-purple-50 to-purple-100'
    case 'rare':
      return 'border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100'
    default:
      return 'border-green-400 bg-gradient-to-br from-green-50 to-green-100'
  }
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'first_steps':
      return <Zap className="w-5 h-5" />
    case 'participation':
      return <TrendingUp className="w-5 h-5" />
    case 'leadership':
      return <Trophy className="w-5 h-5" />
    case 'community':
      return <Star className="w-5 h-5" />
    case 'impact':
      return <Award className="w-5 h-5" />
    default:
      return <Star className="w-5 h-5" />
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'first_steps':
      return 'text-blue-600 bg-blue-100'
    case 'participation':
      return 'text-green-600 bg-green-100'
    case 'leadership':
      return 'text-purple-600 bg-purple-100'
    case 'community':
      return 'text-pink-600 bg-pink-100'
    case 'impact':
      return 'text-orange-600 bg-orange-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  isEarned = false,
  onClick,
  showProgress = true,
  className = ''
}) => {
  const progressPercentage = achievement.targetCount > 0 
    ? (achievement.progress / achievement.targetCount) * 100 
    : 0

  const isInProgress = !isEarned && achievement.progress > 0
  const isLocked = !isEarned && achievement.progress === 0

  return (
    <div
      className={`
        relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer
        hover:shadow-md hover:scale-105
        ${getRarityBorderColor(achievement.badge.rarity, isEarned)}
        ${isLocked ? 'opacity-60' : ''}
        ${className}
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      aria-label={`Achievement: ${achievement.title}`}
    >
      {/* Status Icon */}
      <div className="absolute top-3 right-3">
        {isEarned ? (
          <CheckCircle className="w-6 h-6 text-green-500" />
        ) : isInProgress ? (
          <TrendingUp className="w-6 h-6 text-blue-500" />
        ) : (
          <Lock className="w-6 h-6 text-gray-400" />
        )}
      </div>

      {/* Rarity Badge */}
      <div className="absolute top-3 left-3">
        {getRarityIcon(achievement.badge.rarity)}
      </div>

      {/* Category Badge */}
      <div className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-3
        ${getCategoryColor(achievement.category)}
      `}>
        {getCategoryIcon(achievement.category)}
        {achievement.category.replace('_', ' ').toUpperCase()}
      </div>

      {/* Achievement Content */}
      <div className="mt-6">
        <h3 className="font-semibold text-lg mb-2 text-gray-900">
          {achievement.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3">
          {achievement.description}
        </p>

        {/* Progress Bar */}
        {showProgress && !isEarned && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{achievement.progress}/{achievement.targetCount}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* XP Reward */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>+{achievement.xpReward} XP</span>
          </div>

          {/* Earned Date */}
          {isEarned && achievement.earnedAt && (
            <div className="text-xs text-gray-500">
              {new Date(achievement.earnedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-10 transition-opacity duration-200 pointer-events-none" />
    </div>
  )
}

export default AchievementCard
