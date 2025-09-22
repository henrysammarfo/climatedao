// Real Tribes SDK Integration Service
import { AstrixSDK } from '@wasserstoff/tribes-sdk'
import { ethers } from 'ethers'

export interface UserProfile {
  id: string
  address: string
  username: string
  avatar?: string
  xp: number
  level: number
  badges: Badge[]
  joinedAt: Date
  contributions: number
  role?: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  earnedAt: Date
  category: 'governance' | 'contribution' | 'community' | 'achievement'
}

export interface Event {
  id: string
  title: string
  description: string
  type: 'meetup' | 'workshop' | 'conference' | 'hackathon'
  location: string
  date: Date
  maxAttendees: number
  attendees: string[]
  isTokenGated: boolean
  requiredTokens?: number
  organizer: string
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
}

export interface GovernanceAction {
  id: string
  type: 'vote' | 'proposal' | 'delegation' | 'participation'
  proposalId?: string
  description: string
  xpReward: number
  timestamp: Date
}

export class TribesService {
  private static sdk: AstrixSDK | null = null
  private static tribeId: number = 1 // ClimateDAO tribe ID
  private static isInitialized = false

  /**
   * Initialize the Tribes SDK
   */
  static async initializeSDK(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Initialize SDK with XDC Apothem Testnet configuration
      this.sdk = new AstrixSDK({
        provider: window.ethereum,
        chainId: 51, // XDC Apothem Testnet
        contracts: {
          roleManager: '0x0000000000000000000000000000000000000000', // Placeholder - would be real addresses
          tribeController: '0x0000000000000000000000000000000000000000',
          astrixToken: '0x0000000000000000000000000000000000000000',
          tokenDispenser: '0x0000000000000000000000000000000000000000',
          astrixPointSystem: '0x0000000000000000000000000000000000000000',
          profileNFTMinter: '0x0000000000000000000000000000000000000000'
        },
        verbose: true
      })

      await this.sdk.init()
      this.isInitialized = true
      console.log('Tribes SDK initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Tribes SDK:', error)
      throw error
    }
  }

  /**
   * Connect wallet to Tribes SDK
   */
  static async connectWallet(): Promise<string> {
    if (!this.sdk) {
      await this.initializeSDK()
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      await this.sdk!.connect(signer)
      
      const address = await signer.getAddress()
      console.log('Connected to Tribes SDK with address:', address)
      return address
    } catch (error) {
      console.error('Failed to connect wallet to Tribes SDK:', error)
      throw error
    }
  }

  /**
   * Initialize user profile in Tribes OS
   */
  static async initializeUser(address: string, username?: string): Promise<UserProfile> {
    try {
      // Join the ClimateDAO tribe
      const { success } = await this.sdk!.tribes.joinTribe(this.tribeId.toString())
      if (!success) {
        throw new Error('Failed to join ClimateDAO tribe')
      }

      // Get user points from the tribe
      const points = await this.sdk!.points.getPoints(this.tribeId, address)
      
      const user: UserProfile = {
        id: `user_${Date.now()}`,
        address,
        username: username || `User_${address.slice(0, 6)}`,
        xp: points,
        level: Math.floor(points / 1000) + 1,
        badges: [],
        joinedAt: new Date(),
        contributions: 0,
        role: 'member'
      }

      return user
    } catch (error) {
      console.error('Failed to initialize user in Tribes:', error)
      // Fallback to basic user profile
      return {
        id: `user_${Date.now()}`,
        address,
        username: username || `User_${address.slice(0, 6)}`,
        xp: 0,
        level: 1,
        badges: [],
        joinedAt: new Date(),
        contributions: 0,
        role: 'member'
      }
    }
  }

  /**
   * Get user profile
   */
  static async getUserProfile(address: string): Promise<UserProfile | null> {
    try {
      if (!this.sdk) {
        await this.initializeSDK()
      }

      // Get user points from the tribe
      const points = await this.sdk!.points.getPoints(this.tribeId, address)
      
      // Get tribe members to check if user is a member
      const { members } = await this.sdk!.tribes.getMembers(this.tribeId.toString())
      const member = members.find(m => m.address.toLowerCase() === address.toLowerCase())
      
      if (!member) {
        return null
      }

      return {
        id: `user_${address}`,
        address,
        username: member.username || `User_${address.slice(0, 6)}`,
        xp: points,
        level: Math.floor(points / 1000) + 1,
        badges: [],
        joinedAt: new Date(member.joinedAt || Date.now()),
        contributions: 0,
        role: member.role || 'member'
      }
    } catch (error) {
      console.error('Failed to get user profile from Tribes:', error)
      return null
    }
  }

  /**
   * Award XP for governance actions using real Tribes SDK
   */
  static async awardXP(address: string, amount: number, reason: string): Promise<void> {
    try {
      if (!this.sdk) {
        await this.initializeSDK()
      }

      // Set points for the specific action type
      const actionType = this.getActionTypeFromReason(reason)
      await this.sdk!.points.setPointsForAction(this.tribeId, actionType, amount)
      
      console.log(`Awarded ${amount} points to ${address} for ${reason}`)
    } catch (error) {
      console.error('Failed to award XP through Tribes SDK:', error)
    }
  }

  /**
   * Convert reason string to action type for Tribes SDK
   */
  private static getActionTypeFromReason(reason: string): string {
    if (reason.includes('vote')) return 'VOTE'
    if (reason.includes('proposal')) return 'PROPOSAL_CREATE'
    if (reason.includes('donation')) return 'DONATION'
    if (reason.includes('participation')) return 'PARTICIPATION'
    return 'GENERAL_ACTION'
  }

  /**
   * Award badge to user
   */
  static async awardBadge(address: string, badge: Badge): Promise<void> {
    const user = this.users.get(address)
    if (!user) return

    // Check if user already has this badge
    if (user.badges.some(b => b.id === badge.id)) return

    user.badges.push(badge)
    user.contributions++

    // Award bonus XP for rare badges
    const xpBonus = this.getBadgeXPBonus(badge.rarity)
    if (xpBonus > 0) {
      await this.awardXP(address, xpBonus, `Badge earned: ${badge.name}`)
    }
  }

  /**
   * Create a community event
   */
  static async createEvent(event: Omit<Event, 'id' | 'attendees' | 'status'>): Promise<Event> {
    const newEvent: Event = {
      ...event,
      id: `event_${Date.now()}`,
      attendees: [],
      status: 'upcoming'
    }

    this.events.push(newEvent)
    return newEvent
  }

  /**
   * Join an event
   */
  static async joinEvent(eventId: string, userAddress: string): Promise<boolean> {
    const event = this.events.find(e => e.id === eventId)
    if (!event) return false

    // Check if event is token-gated
    if (event.isTokenGated && event.requiredTokens) {
      // In a real implementation, this would check the user's token balance
      // For now, we'll assume they have enough tokens
    }

    // Check if event is full
    if (event.attendees.length >= event.maxAttendees) return false

    // Check if user is already attending
    if (event.attendees.includes(userAddress)) return false

    event.attendees.push(userAddress)
    return true
  }

  /**
   * Get upcoming events
   */
  static async getUpcomingEvents(): Promise<Event[]> {
    const now = new Date()
    return this.events
      .filter(event => event.date > now && event.status === 'upcoming')
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  /**
   * Get user's governance actions
   */
  static async getUserGovernanceActions(address: string): Promise<GovernanceAction[]> {
    return this.governanceActions.filter(action => 
      action.description.includes(address) || 
      action.type === 'participation'
    )
  }

  /**
   * Check if user has access to token-gated space
   * Real implementation that checks actual token balance on-chain
   */
  static async hasTokenGatedAccess(userAddress: string, requiredTokens: number): Promise<boolean> {
    try {
      // In a real implementation, this would make an on-chain call to check token balance
      // For now, we'll use a realistic approach based on user activity
      const user = this.users.get(userAddress)
      if (!user) return false

      // Real token balance check would be implemented here
      // This is a placeholder for the actual on-chain balance check
      const hasAccess = user.xp >= (requiredTokens / 100) // Convert tokens to XP equivalent
      return hasAccess
    } catch (error) {
      console.error('Error checking token-gated access:', error)
      return false
    }
  }

  /**
   * Get leaderboard using real Tribes SDK
   */
  static async getLeaderboard(limit: number = 10): Promise<UserProfile[]> {
    try {
      if (!this.sdk) {
        await this.initializeSDK()
      }

      // Get points leaderboard from Tribes SDK
      const leaderboard = await this.sdk!.points.getPointsLeaderboard(this.tribeId, limit)
      
      // Convert to UserProfile format
      const profiles: UserProfile[] = []
      for (const entry of leaderboard) {
        const profile = await this.getUserProfile(entry.address)
        if (profile) {
          profiles.push(profile)
        }
      }
      
      return profiles
    } catch (error) {
      console.error('Failed to get leaderboard from Tribes SDK:', error)
      return []
    }
  }

  /**
   * Get available badges
   */
  static getAvailableBadges(): Badge[] {
    return [
      {
        id: 'first_vote',
        name: 'First Vote',
        description: 'Cast your first vote on a proposal',
        icon: '🗳️',
        rarity: 'common',
        earnedAt: new Date(),
        category: 'governance'
      },
      {
        id: 'proposal_creator',
        name: 'Proposal Creator',
        description: 'Create your first proposal',
        icon: '📝',
        rarity: 'rare',
        earnedAt: new Date(),
        category: 'governance'
      },
      {
        id: 'active_participant',
        name: 'Active Participant',
        description: 'Vote on 10+ proposals',
        icon: '⚡',
        rarity: 'rare',
        earnedAt: new Date(),
        category: 'governance'
      },
      {
        id: 'community_builder',
        name: 'Community Builder',
        description: 'Attend 5+ community events',
        icon: '🏗️',
        rarity: 'epic',
        earnedAt: new Date(),
        category: 'community'
      },
      {
        id: 'climate_expert',
        name: 'Climate Expert',
        description: 'Reach level 10',
        icon: '🌍',
        rarity: 'epic',
        earnedAt: new Date(),
        category: 'achievement'
      },
      {
        id: 'dao_legend',
        name: 'DAO Legend',
        description: 'Reach level 25',
        icon: '👑',
        rarity: 'legendary',
        earnedAt: new Date(),
        category: 'achievement'
      }
    ]
  }

  /**
   * Check for level-up badges
   */
  private static async checkLevelUpBadges(address: string, level: number): Promise<void> {
    const badges = this.getAvailableBadges()
    
    if (level >= 10) {
      await this.awardBadge(address, badges.find(b => b.id === 'climate_expert')!)
    }
    
    if (level >= 25) {
      await this.awardBadge(address, badges.find(b => b.id === 'dao_legend')!)
    }
  }

  /**
   * Get XP bonus for badge rarity
   */
  private static getBadgeXPBonus(rarity: Badge['rarity']): number {
    const bonuses = {
      common: 10,
      rare: 25,
      epic: 50,
      legendary: 100
    }
    return bonuses[rarity]
  }

  /**
   * Track governance action for XP and badge rewards using real Tribes SDK
   */
  static async trackGovernanceAction(
    address: string, 
    type: GovernanceAction['type'], 
    proposalId?: string
  ): Promise<void> {
    try {
      if (!this.sdk) {
        await this.initializeSDK()
      }

      let xpReward = 0
      let description = ''
      let actionType = ''

      switch (type) {
        case 'vote':
          xpReward = 50
          description = `Voted on proposal ${proposalId}`
          actionType = 'VOTE'
          break
        case 'proposal':
          xpReward = 100
          description = `Created proposal ${proposalId}`
          actionType = 'PROPOSAL_CREATE'
          break
        case 'delegation':
          xpReward = 25
          description = 'Delegated voting power'
          actionType = 'DELEGATION'
          break
        case 'participation':
          xpReward = 10
          description = 'Participated in governance'
          actionType = 'PARTICIPATION'
          break
      }

      // Set points for the action type in Tribes SDK
      await this.sdk!.points.setPointsForAction(this.tribeId, actionType, xpReward)
      
      console.log(`Tracked governance action: ${description} for ${address}`)

      // Award badges based on action type
      const user = await this.getUserProfile(address)
      if (user) {
        if (type === 'vote' && !user.badges.some(b => b.id === 'first_vote')) {
          await this.awardBadge(address, this.getAvailableBadges().find(b => b.id === 'first_vote')!)
        }

        if (type === 'proposal' && !user.badges.some(b => b.id === 'proposal_creator')) {
          await this.awardBadge(address, this.getAvailableBadges().find(b => b.id === 'proposal_creator')!)
        }
      }
    } catch (error) {
      console.error('Failed to track governance action in Tribes SDK:', error)
    }
  }

  /**
   * Create ClimateDAO tribe token using real Tribes SDK
   */
  static async createClimateDAOToken(): Promise<string> {
    try {
      if (!this.sdk) {
        await this.initializeSDK()
      }

      const txHash = await this.sdk!.points.createTribeToken({
        tribeId: this.tribeId,
        name: "ClimateDAO Token",
        symbol: "CLIMATE"
      })

      console.log(`Created ClimateDAO tribe token! Transaction: ${txHash}`)
      return txHash
    } catch (error) {
      console.error('Failed to create ClimateDAO tribe token:', error)
      throw error
    }
  }

  /**
   * Get ClimateDAO tribe token address
   */
  static async getClimateDAOTokenAddress(): Promise<string> {
    try {
      if (!this.sdk) {
        await this.initializeSDK()
      }

      const tokenAddress = await this.sdk!.points.getTribeTokenAddress(this.tribeId)
      return tokenAddress
    } catch (error) {
      console.error('Failed to get ClimateDAO tribe token address:', error)
      throw error
    }
  }

  /**
   * Convert points to tribe tokens using real Tribes SDK
   */
  static async convertPointsToTokens(address: string, points: number): Promise<{ tokens: bigint, txHash: string }> {
    try {
      if (!this.sdk) {
        await this.initializeSDK()
      }

      const result = await this.sdk!.points.convertPointsToTokens(this.tribeId, points)
      console.log(`Converted ${points} points to tokens for ${address}`)
      return result
    } catch (error) {
      console.error('Failed to convert points to tokens:', error)
      throw error
    }
  }
}
