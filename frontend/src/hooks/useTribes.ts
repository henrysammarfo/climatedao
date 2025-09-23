import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { TribesIntegration, UserProfile, Event, ConfigurationStatus } from '../services/tribesService'
import { registryService } from '../services/registryService'
import { useUserRegistry, useAutoRegister } from './useContracts'
import { achievementService } from '../services/achievementService'
import { tribesConfigValidator } from '../utils/tribesConfig'
import toast from 'react-hot-toast'

export const useTribes = () => {
  const { address } = useAccount()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([])
  const [achievementProgress, setAchievementProgress] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [registrationInProgress, setRegistrationInProgress] = useState(false)
  const [configurationStatus, setConfigurationStatus] = useState<ConfigurationStatus | null>(null)
  const [isConfigurationValid, setIsConfigurationValid] = useState<boolean | null>(null)
  
  // On-chain registration hooks
  const { isRegistered: isRegisteredOnChain, refetch: refetchOnChainRegistration } = useUserRegistry()
  const { autoRegister, shouldRegister } = useAutoRegister()

  // Check configuration status
  const checkConfigurationStatus = useCallback(() => {
    try {
      const status = tribesConfigValidator.getConfigurationStatus()
      setConfigurationStatus(status)
      setIsConfigurationValid(status.isValid)
      return status
    } catch (error) {
      console.error('Configuration check failed:', error)
      const errorStatus: ConfigurationStatus = {
        isValid: false,
        errors: ['Configuration validation failed'],
        warnings: [],
        missingFields: []
      }
      setConfigurationStatus(errorStatus)
      setIsConfigurationValid(false)
      return errorStatus
    }
  }, [])

  // Retry configuration
  const retryConfiguration = useCallback(async () => {
    try {
      setIsLoading(true)
      const status = checkConfigurationStatus()
      
      if (status.isValid) {
        // Try to initialize the SDK
        await TribesIntegration.initialize()
        return true
      }
      return false
    } catch (error) {
      console.error('Configuration retry failed:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [checkConfigurationStatus])

  // Initialize user profile with real Tribes SDK
  const initializeUser = useCallback(async (username?: string) => {
    if (!address) return null

    // Check configuration first
    const configStatus = checkConfigurationStatus()
    if (!configStatus.isValid) {
      console.error('Cannot initialize user: Tribes configuration is invalid')
      return null
    }

    setIsLoading(true)
    try {
      // Connect wallet to Tribes SDK first
      await TribesIntegration.connectWallet()
      
      const profile = await TribesIntegration.initializeUser(address, username)
      setUserProfile(profile)
      return profile
    } catch (error) {
      console.error('Failed to initialize user:', error)
      toast.error('Failed to initialize user profile')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [address, checkConfigurationStatus])

  // Check registration status
  const checkRegistration = useCallback(async () => {
    if (!address) return false

    try {
      const registered = await TribesIntegration.isWalletRegistered(address)
      setIsRegistered(registered)
      return registered
    } catch (error) {
      console.error('Failed to check registration:', error)
      return false
    }
  }, [address])

  // Ensure user is registered
  const ensureUserRegistered = useCallback(async () => {
    if (!address || registrationInProgress) return false

    try {
      // Check local registration status
      const registeredLocally = await checkRegistration()
      
      // Check on-chain registration status
      const registeredOnChain = isRegisteredOnChain
      
      if (!registeredOnChain && shouldRegister) {
        // User is not registered on-chain, attempt auto-registration
        setRegistrationInProgress(true)
        try {
          const success = await autoRegister()
          if (success) {
            // Refresh on-chain status
            await refetchOnChainRegistration()
            
            // Sync local storage with on-chain registration
            if (!registeredLocally) {
              const profile = await TribesIntegration.getUserProfile(address)
              if (profile) {
                await registryService.registerWallet(address, profile)
                setIsRegistered(true)
              }
            }
            return true
          }
        } catch (error) {
          console.error('Auto-registration failed:', error)
          toast.error('Failed to register user on-chain')
        } finally {
          setRegistrationInProgress(false)
        }
      } else if (registeredOnChain && !registeredLocally) {
        // User is registered on-chain but not locally, sync local storage
        const profile = await TribesIntegration.getUserProfile(address)
        if (profile) {
          await registryService.registerWallet(address, profile)
          setIsRegistered(true)
        }
      } else if (registeredLocally) {
        setIsRegistered(true)
      }
      
      return registeredOnChain || registeredLocally
    } catch (error) {
      console.error('Failed to ensure user registration:', error)
      return false
    }
  }, [address, registrationInProgress, checkRegistration, isRegisteredOnChain, shouldRegister, autoRegister, refetchOnChainRegistration])

  // Load achievements
  const loadAchievements = useCallback(async () => {
    if (!address) return

    try {
      const achievementStatuses = await achievementService.getAchievementStatus(address)
      
      // Create progress mapping for easy access
      const progressMap: Record<string, number> = {}
      achievementStatuses.forEach(achievement => {
        if (!achievement.isEarned) {
          progressMap[achievement.id] = achievement.progress
        }
      })
      setAchievementProgress(progressMap)
    } catch (error) {
      console.error('Failed to load achievements:', error)
    }
  }, [address])

  // Refresh achievements
  const refreshAchievements = useCallback(async () => {
    await loadAchievements()
  }, [loadAchievements])

  // Load user profile
  const loadUserProfile = useCallback(async () => {
    if (!address) return

    // Check configuration first
    const configStatus = checkConfigurationStatus()
    if (!configStatus.isValid) {
      console.error('Cannot load user profile: Tribes configuration is invalid')
      return
    }

    setIsLoading(true)
    try {
      // Ensure user is registered first
      await ensureUserRegistered()
      
      const profile = await TribesIntegration.getUserProfile(address)
      setUserProfile(profile)
      
      // Load achievements after profile is loaded
      await loadAchievements()
    } catch (error) {
      console.error('Failed to load user profile:', error)
    } finally {
      setIsLoading(false)
    }
  }, [address, ensureUserRegistered, loadAchievements, checkConfigurationStatus])

  // Load upcoming events
  const loadEvents = useCallback(async () => {
    try {
      const upcomingEvents = await TribesIntegration.getUpcomingEvents()
      setEvents(upcomingEvents)
    } catch (error) {
      console.error('Failed to load events:', error)
    }
  }, [])

  // Load leaderboard
  const loadLeaderboard = useCallback(async () => {
    try {
      const topUsers = await TribesIntegration.getPointsLeaderboard(10)
      setLeaderboard(topUsers)
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    }
  }, [])

  // Award XP
  const awardXP = useCallback(async (amount: number, reason: string) => {
    if (!address) return

    try {
      // Ensure user is registered before awarding XP
      await ensureUserRegistered()
      
      await TribesIntegration.awardXP(address, amount, reason)
      await loadUserProfile() // Refresh profile
      await refreshAchievements() // Refresh achievements for real-time updates
      toast.success(`+${amount} XP earned!`)
    } catch (error) {
      console.error('Failed to award XP:', error)
    }
  }, [address, ensureUserRegistered, loadUserProfile, refreshAchievements])

  // Track governance action
  const trackGovernanceAction = useCallback(async (
    type: 'vote' | 'proposal' | 'delegation' | 'participation',
    proposalId?: string
  ) => {
    if (!address) return

    try {
      // Ensure user is registered before tracking action
      await ensureUserRegistered()
      
      await TribesIntegration.trackGovernanceAction(address, type, proposalId)
      await loadUserProfile() // Refresh profile
      await refreshAchievements() // Refresh achievements for real-time updates
    } catch (error) {
      console.error('Failed to track governance action:', error)
    }
  }, [address, ensureUserRegistered, loadUserProfile, refreshAchievements])

  // Join event
  const joinEvent = useCallback(async (eventId: string) => {
    if (!address) return false

    try {
      // Ensure user is registered before joining event
      await ensureUserRegistered()
      
      const success = await TribesIntegration.joinEvent(eventId, address)
      if (success) {
        toast.success('Successfully joined event!')
        await loadEvents() // Refresh events
        await loadUserProfile() // Refresh profile
      } else {
        toast.error('Failed to join event')
      }
      return success
    } catch (error) {
      console.error('Failed to join event:', error)
      toast.error('Failed to join event')
      return false
    }
  }, [address, ensureUserRegistered, loadEvents, loadUserProfile])

  // Check token-gated access
  const hasTokenGatedAccess = useCallback(async (requiredTokens: number) => {
    if (!address) return false

    try {
      return await TribesIntegration.checkTokenGatedAccess(address, requiredTokens)
    } catch (error) {
      console.error('Failed to check token-gated access:', error)
      return false
    }
  }, [address])

  // Convert points to tribe tokens
  const convertPointsToTokens = useCallback(async (points: number) => {
    if (!address) return null

    try {
      // Ensure user is registered before converting points
      await ensureUserRegistered()
      
      const result = await TribesIntegration.convertPointsToTokens(address, points)
      toast.success(`Converted ${points} points to tokens!`)
      await loadUserProfile() // Refresh profile
      return result
    } catch (error) {
      console.error('Failed to convert points to tokens:', error)
      toast.error('Failed to convert points to tokens')
      return null
    }
  }, [address, ensureUserRegistered, loadUserProfile])

  // Get ClimateDAO tribe token address
  const getClimateDAOTokenAddress = useCallback(async () => {
    try {
      return await TribesIntegration.getClimateDAOTokenAddress()
    } catch (error) {
      console.error('Failed to get ClimateDAO token address:', error)
      return null
    }
  }, [])

  // Create ClimateDAO tribe token
  const createClimateDAOToken = useCallback(async () => {
    try {
      const txHash = await TribesIntegration.createClimateDAOToken()
      toast.success('ClimateDAO tribe token created successfully!')
      return txHash
    } catch (error) {
      console.error('Failed to create ClimateDAO tribe token:', error)
      toast.error('Failed to create tribe token')
      return null
    }
  }, [])

  // Load initial data
  useEffect(() => {
    // Check configuration status on mount
    checkConfigurationStatus()
    
    if (address) {
      // Check registration status first
      checkRegistration()
      loadUserProfile()
      loadEvents()
      loadLeaderboard()
    }
  }, [address, checkRegistration, loadUserProfile, loadEvents, loadLeaderboard, checkConfigurationStatus])

  return {
    userProfile,
    events,
    leaderboard,
    achievementProgress,
    isLoading,
    isRegistered,
    configurationStatus,
    isConfigurationValid,
    initializeUser,
    loadUserProfile,
    loadEvents,
    loadLeaderboard,
    loadAchievements,
    refreshAchievements,
    awardXP,
    trackGovernanceAction,
    joinEvent,
    hasTokenGatedAccess,
    convertPointsToTokens,
    getClimateDAOTokenAddress,
    createClimateDAOToken,
    checkRegistration,
    ensureUserRegistered,
    checkConfigurationStatus,
    retryConfiguration
  }
}
