import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { achievementService, AchievementStatus, AchievementDefinition } from '../services/achievementService'
import { useTribes } from './useTribes'
import toast from 'react-hot-toast'

export const useAchievements = () => {
  const { address } = useAccount()
  const { refreshAchievements } = useTribes()
  const [achievements, setAchievements] = useState<AchievementStatus[]>([])
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [newAchievements, setNewAchievements] = useState<string[]>([])
  const [previousAchievements, setPreviousAchievements] = useState<string[]>([])
  const [unlockedAchievements, setUnlockedAchievements] = useState<AchievementDefinition[]>([])

  // Load achievements from the achievement service
  const loadAchievements = useCallback(async () => {
    if (!address) return

    setIsLoading(true)
    try {
      const achievementStatuses = await achievementService.getAchievementStatus(address)
      setAchievements(achievementStatuses)
      
      // Create progress mapping
      const progressMap: Record<string, number> = {}
      achievementStatuses.forEach(achievement => {
        if (!achievement.isEarned) {
          progressMap[achievement.id] = achievement.progress
        }
      })
      setProgress(progressMap)
    } catch (error) {
      console.error('Failed to load achievements:', error)
    } finally {
      setIsLoading(false)
    }
  }, [address])

  // Check for new achievements
  const checkForNewAchievements = useCallback(() => {
    const currentEarned = achievements
      .filter(a => a.isEarned)
      .map(a => a.id)
    
    const newEarned = currentEarned.filter(id => !previousAchievements.includes(id))
    
    if (newEarned.length > 0) {
      setNewAchievements(prev => [...prev, ...newEarned])
      
      // Show notifications for new achievements
      newEarned.forEach(achievementId => {
        const achievement = achievements.find(a => a.id === achievementId)
        if (achievement) {
          toast.success(`🎉 Achievement Unlocked: ${achievement.title}!`, {
            duration: 5000,
            icon: '🏆',
            style: {
              background: '#10B981',
              color: 'white',
              fontWeight: 'bold'
            }
          })
        }
      })
    }
    
    setPreviousAchievements(currentEarned)
  }, [achievements, previousAchievements])

  // Mark achievement as viewed
  const markAchievementAsViewed = useCallback((achievementId: string) => {
    setNewAchievements(prev => prev.filter(id => id !== achievementId))
  }, [])

  // Get achievements by category
  const getAchievementsByCategory = useCallback(() => {
    const categories: Record<string, AchievementStatus[]> = {}
    
    achievements.forEach(achievement => {
      if (!categories[achievement.category]) {
        categories[achievement.category] = []
      }
      categories[achievement.category].push(achievement)
    })
    
    return categories
  }, [achievements])

  // Get progress to next level (based on XP)
  const getProgressToNextLevel = useCallback((currentXP: number) => {
    // Simple level calculation: every 1000 XP = 1 level
    const currentLevel = Math.floor(currentXP / 1000)
    const nextLevelXP = (currentLevel + 1) * 1000
    const progressToNext = ((currentXP % 1000) / 1000) * 100
    
    return {
      currentLevel,
      nextLevelXP,
      progressToNext,
      xpNeeded: nextLevelXP - currentXP
    }
  }, [])

  // Get achievement statistics
  const getAchievementStats = useCallback(() => {
    const totalAchievements = achievements.length
    const earnedAchievements = achievements.filter(a => a.isEarned).length
    const completionPercentage = totalAchievements > 0 ? (earnedAchievements / totalAchievements) * 100 : 0
    
    const categories = getAchievementsByCategory()
    const categoryStats = Object.entries(categories).map(([category, categoryAchievements]) => ({
      category,
      total: categoryAchievements.length,
      earned: categoryAchievements.filter(a => a.isEarned).length,
      percentage: categoryAchievements.length > 0 ? 
        (categoryAchievements.filter(a => a.isEarned).length / categoryAchievements.length) * 100 : 0
    }))
    
    return {
      totalAchievements,
      earnedAchievements,
      completionPercentage,
      categoryStats,
      newAchievementsCount: newAchievements.length
    }
  }, [achievements, getAchievementsByCategory, newAchievements])

  // Filter achievements
  const filterAchievements = useCallback((
    filter: 'all' | 'earned' | 'locked' | 'in_progress',
    category?: string
  ) => {
    let filtered = achievements
    
    // Apply status filter
    switch (filter) {
      case 'earned':
        filtered = filtered.filter(a => a.isEarned)
        break
      case 'locked':
        filtered = filtered.filter(a => !a.isEarned && a.progress === 0)
        break
      case 'in_progress':
        filtered = filtered.filter(a => !a.isEarned && a.progress > 0)
        break
      default:
        // 'all' - no filter
        break
    }
    
    // Apply category filter
    if (category) {
      filtered = filtered.filter(a => a.category === category)
    }
    
    return filtered
  }, [achievements])

  // Sort achievements
  const sortAchievements = useCallback((
    achievements: AchievementStatus[],
    sortBy: 'name' | 'category' | 'progress' | 'earned_date' | 'xp_reward'
  ) => {
    return [...achievements].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title)
        case 'category':
          return a.category.localeCompare(b.category)
        case 'progress':
          return b.progress - a.progress
        case 'earned_date':
          if (a.isEarned && b.isEarned) {
            return (b.earnedAt || 0) - (a.earnedAt || 0)
          }
          return a.isEarned ? -1 : 1
        case 'xp_reward':
          return b.xpReward - a.xpReward
        default:
          return 0
      }
    })
  }, [])

  // Share achievement
  const shareAchievement = useCallback((achievementId: string) => {
    const achievement = achievements.find(a => a.id === achievementId)
    if (!achievement) return

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
        toast.success('Achievement text copied to clipboard!')
      })
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareText)
      toast.success('Achievement text copied to clipboard!')
    }
  }, [achievements])

  // Refresh achievements
  const refreshAchievementsData = useCallback(async () => {
    await loadAchievements()
    await refreshAchievements()
  }, [loadAchievements, refreshAchievements])

  // Load achievements on mount and when address changes
  useEffect(() => {
    if (address) {
      loadAchievements()
    }
  }, [address, loadAchievements])

  // Check for new achievements when achievements change
  useEffect(() => {
    if (achievements.length > 0) {
      checkForNewAchievements()
    }
  }, [achievements, checkForNewAchievements])

  // Listen for achievement unlock events
  useEffect(() => {
    const handleAchievementUnlocked = (event: CustomEvent) => {
      const achievement = event.detail as AchievementDefinition
      
      // Add to unlocked achievements queue for AchievementNotification
      setUnlockedAchievements(prev => [...prev, achievement])
      
      toast.success(`🎉 Achievement Unlocked: ${achievement.title}!`, {
        duration: 5000,
        icon: '🏆',
        style: {
          background: '#10B981',
          color: 'white',
          fontWeight: 'bold'
        }
      })
      
      // Refresh achievements after a short delay
      setTimeout(() => {
        refreshAchievementsData()
      }, 1000)
    }

    const handleProgressUpdate = () => {
      refreshAchievementsData()
    }

    window.addEventListener('achievementUnlocked', handleAchievementUnlocked as EventListener)
    window.addEventListener('achievementProgressUpdated', handleProgressUpdate)
    
    return () => {
      window.removeEventListener('achievementUnlocked', handleAchievementUnlocked as EventListener)
      window.removeEventListener('achievementProgressUpdated', handleProgressUpdate)
    }
  }, [refreshAchievementsData])

  // Dismiss achievement notification
  const dismissAchievementNotification = useCallback((achievementId: string) => {
    setUnlockedAchievements(prev => prev.filter(a => a.id !== achievementId))
  }, [])

  return {
    achievements,
    progress,
    isLoading,
    newAchievements,
    unlockedAchievements,
    loadAchievements,
    refreshAchievements: refreshAchievementsData,
    markAchievementAsViewed,
    dismissAchievementNotification,
    getAchievementsByCategory,
    getProgressToNextLevel,
    getAchievementStats,
    filterAchievements,
    sortAchievements,
    shareAchievement,
    checkForNewAchievements
  }
}
