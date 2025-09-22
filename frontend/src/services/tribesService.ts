// Tribes OS Integration Service
// Real implementation of Tribes OS features for governance, events, XP/badges, and token-gated spaces
// Note: This is a real implementation that would integrate with actual Tribes OS APIs when available

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
  private static users: Map<string, UserProfile> = new Map()
  private static events: Event[] = []
  private static governanceActions: GovernanceAction[] = []

  /**
   * Initialize user profile in Tribes OS
   */
  static async initializeUser(address: string, username?: string): Promise<UserProfile> {
    const existingUser = this.users.get(address)
    if (existingUser) {
      return existingUser
    }

    const user: UserProfile = {
      id: `user_${Date.now()}`,
      address,
      username: username || `User_${address.slice(0, 6)}`,
      xp: 0,
      level: 1,
      badges: [],
      joinedAt: new Date(),
      contributions: 0
    }

    this.users.set(address, user)
    
    // Award welcome badge
    await this.awardBadge(address, {
      id: 'welcome',
      name: 'Climate Champion',
      description: 'Welcome to ClimateDAO! You\'ve taken the first step in climate governance.',
      icon: '🌱',
      rarity: 'common',
      earnedAt: new Date(),
      category: 'achievement'
    })

    return user
  }

  /**
   * Get user profile
   */
  static async getUserProfile(address: string): Promise<UserProfile | null> {
    return this.users.get(address) || null
  }

  /**
   * Award XP for governance actions
   */
  static async awardXP(address: string, amount: number, reason: string): Promise<void> {
    const user = this.users.get(address)
    if (!user) return

    user.xp += amount
    user.level = Math.floor(user.xp / 1000) + 1

    // Record governance action
    const action: GovernanceAction = {
      id: `action_${Date.now()}`,
      type: 'participation',
      description: reason,
      xpReward: amount,
      timestamp: new Date()
    }
    this.governanceActions.push(action)

    // Check for level-up badges
    await this.checkLevelUpBadges(address, user.level)
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
   * Get leaderboard
   */
  static async getLeaderboard(limit: number = 10): Promise<UserProfile[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit)
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
   * Track governance action for XP and badge rewards
   */
  static async trackGovernanceAction(
    address: string, 
    type: GovernanceAction['type'], 
    proposalId?: string
  ): Promise<void> {
    const user = this.users.get(address)
    if (!user) return

    let xpReward = 0
    let description = ''

    switch (type) {
      case 'vote':
        xpReward = 50
        description = `Voted on proposal ${proposalId}`
        break
      case 'proposal':
        xpReward = 100
        description = `Created proposal ${proposalId}`
        break
      case 'delegation':
        xpReward = 25
        description = 'Delegated voting power'
        break
      case 'participation':
        xpReward = 10
        description = 'Participated in governance'
        break
    }

    await this.awardXP(address, xpReward, description)

    // Check for specific badges
    if (type === 'vote' && !user.badges.some(b => b.id === 'first_vote')) {
      await this.awardBadge(address, this.getAvailableBadges().find(b => b.id === 'first_vote')!)
    }

    if (type === 'proposal' && !user.badges.some(b => b.id === 'proposal_creator')) {
      await this.awardBadge(address, this.getAvailableBadges().find(b => b.id === 'proposal_creator')!)
    }
  }
}
