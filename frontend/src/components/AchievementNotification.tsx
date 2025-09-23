import React, { useState, useEffect } from 'react'
import { AchievementDefinition } from '../services/achievementService'
import { 
  Trophy, 
  X, 
  Share2, 
  Star,
  Crown,
  Award,
} from 'lucide-react'

interface AchievementNotificationProps {
  achievement: AchievementDefinition
  onDismiss: () => void
  autoDismiss?: boolean
  autoDismissDelay?: number
  showSound?: boolean
  className?: string
}

const getRarityIcon = (rarity: string) => {
  switch (rarity) {
    case 'legendary':
      return <Crown className="w-8 h-8 text-yellow-500" />
    case 'epic':
      return <Trophy className="w-8 h-8 text-purple-500" />
    case 'rare':
      return <Award className="w-8 h-8 text-blue-500" />
    default:
      return <Star className="w-8 h-8 text-green-500" />
  }
}

const getRarityStyles = (rarity: string) => {
  switch (rarity) {
    case 'legendary':
      return {
        background: 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600',
        border: 'border-yellow-300',
        glow: 'shadow-yellow-500/50'
      }
    case 'epic':
      return {
        background: 'bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600',
        border: 'border-purple-300',
        glow: 'shadow-purple-500/50'
      }
    case 'rare':
      return {
        background: 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600',
        border: 'border-blue-300',
        glow: 'shadow-blue-500/50'
      }
    default:
      return {
        background: 'bg-gradient-to-r from-green-400 via-green-500 to-green-600',
        border: 'border-green-300',
        glow: 'shadow-green-500/50'
      }
  }
}

const playAchievementSound = () => {
  // Create a simple achievement sound using Web Audio API
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Create a pleasant achievement sound
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1)
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.3)
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.4)
  } catch (error) {
    console.log('Audio not supported or disabled')
  }
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onDismiss,
  autoDismiss = true,
  autoDismissDelay = 5000,
  showSound = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const rarityStyles = getRarityStyles(achievement.badge.rarity)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => {
      setIsVisible(true)
      setIsAnimating(true)
    }, 100)

    // Play sound if enabled
    if (showSound) {
      playAchievementSound()
    }

    // Auto dismiss if enabled
    if (autoDismiss) {
      const dismissTimer = setTimeout(() => {
        handleDismiss()
      }, autoDismissDelay)

      return () => clearTimeout(dismissTimer)
    }

    return () => clearTimeout(timer)
  }, [autoDismiss, autoDismissDelay, showSound])

  const handleDismiss = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
      setTimeout(onDismiss, 300) // Wait for exit animation
    }, 200)
  }

  const handleShare = () => {
    const shareText = `🏆 I just unlocked the "${achievement.title}" achievement in ClimateDAO! ${achievement.description} #ClimateDAO #Achievement`
    
    if (navigator.share) {
      navigator.share({
        title: `ClimateDAO Achievement: ${achievement.title}`,
        text: shareText,
        url: window.location.href
      }).catch(error => {
        console.error('Error sharing:', error)
        // Fallback to clipboard
        navigator.clipboard.writeText(shareText)
      })
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareText)
    }
  }

  if (!isVisible) return null

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm w-full
      transform transition-all duration-300 ease-out
      ${isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      ${className}
    `}>
      <div className={`
        relative p-6 rounded-lg border-2 shadow-2xl
        ${rarityStyles.background}
        ${rarityStyles.border}
        ${rarityStyles.glow}
        shadow-lg
      `}>
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Achievement Icon */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            {getRarityIcon(achievement.badge.rarity)}
            <div className="absolute -inset-2 bg-white/20 rounded-full animate-ping" />
          </div>
        </div>

        {/* Achievement Title */}
        <h3 className="text-xl font-bold text-white text-center mb-2">
          🎉 Achievement Unlocked!
        </h3>

        <h4 className="text-lg font-semibold text-white text-center mb-3">
          {achievement.title}
        </h4>

        {/* Achievement Description */}
        <p className="text-white/90 text-sm text-center mb-4">
          {achievement.description}
        </p>

        {/* XP Reward */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Star className="w-5 h-5 text-yellow-300" />
          <span className="text-white font-semibold">
            +{achievement.xpReward} XP
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 py-2 px-3 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors"
          >
            View
          </button>
        </div>

        {/* Progress indicator for auto-dismiss */}
        {autoDismiss && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-lg overflow-hidden">
            <div 
              className="h-full bg-white/40 animate-pulse"
              style={{
                animation: `shrink ${autoDismissDelay}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>

      {/* Confetti Effect for Legendary Achievements */}
      {achievement.badge.rarity === 'legendary' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

export default AchievementNotification
