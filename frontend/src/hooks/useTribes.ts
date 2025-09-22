import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { TribesIntegration, UserProfile, Event } from '../services/tribesService'
import toast from 'react-hot-toast'

export const useTribes = () => {
  const { address } = useAccount()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Initialize user profile with real Tribes SDK
  const initializeUser = useCallback(async (username?: string) => {
    if (!address) return null

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
  }, [address])

  // Load user profile
  const loadUserProfile = useCallback(async () => {
    if (!address) return

    setIsLoading(true)
    try {
      const profile = await TribesIntegration.getUserProfile(address)
      setUserProfile(profile)
    } catch (error) {
      console.error('Failed to load user profile:', error)
    } finally {
      setIsLoading(false)
    }
  }, [address])

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
      await TribesIntegration.awardXP(address, amount, reason)
      await loadUserProfile() // Refresh profile
      toast.success(`+${amount} XP earned!`)
    } catch (error) {
      console.error('Failed to award XP:', error)
    }
  }, [address, loadUserProfile])

  // Track governance action
  const trackGovernanceAction = useCallback(async (
    type: 'vote' | 'proposal' | 'delegation' | 'participation',
    proposalId?: string
  ) => {
    if (!address) return

    try {
      await TribesIntegration.trackGovernanceAction(address, type, proposalId)
      await loadUserProfile() // Refresh profile
    } catch (error) {
      console.error('Failed to track governance action:', error)
    }
  }, [address, loadUserProfile])

  // Join event
  const joinEvent = useCallback(async (eventId: string) => {
    if (!address) return false

    try {
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
  }, [address, loadEvents, loadUserProfile])

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
      const result = await TribesIntegration.convertPointsToTokens(address, points)
      toast.success(`Converted ${points} points to tokens!`)
      await loadUserProfile() // Refresh profile
      return result
    } catch (error) {
      console.error('Failed to convert points to tokens:', error)
      toast.error('Failed to convert points to tokens')
      return null
    }
  }, [address, loadUserProfile])

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
    if (address) {
      loadUserProfile()
      loadEvents()
      loadLeaderboard()
    }
  }, [address, loadUserProfile, loadEvents, loadLeaderboard])

  return {
    userProfile,
    events,
    leaderboard,
    isLoading,
    initializeUser,
    loadUserProfile,
    loadEvents,
    loadLeaderboard,
    awardXP,
    trackGovernanceAction,
    joinEvent,
    hasTokenGatedAccess,
    convertPointsToTokens,
    getClimateDAOTokenAddress,
    createClimateDAOToken
  }
}
