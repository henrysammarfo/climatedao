// Simplified Tribes OS Integration Service
// This can be enhanced with real SDK integration when the package is properly available

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

/**
 * Simplified Tribes OS Integration Service
 * Provides mock functionality that can be replaced with real SDK integration
 */
export class TribesIntegration {
  // private static tribeId = 1 // ClimateDAO tribe ID - will be used when real SDK is integrated
  private static users = new Map<string, UserProfile>()
  private static events: Event[] = []
  private static governanceActions: GovernanceAction[] = []

  /**
   * Initialize the Tribes integration
   */
  static async initialize(): Promise<void> {
    console.log('Tribes integration initialized (mock mode)')
  }

  /**
   * Initialize user profile in Tribes OS
   */
  static async initializeUser(address: string, username?: string): Promise<UserProfile> {
    const user: UserProfile = {
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

    this.users.set(address, user)
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
    user.contributions++

    // Track governance action
    const action: GovernanceAction = {
      id: `action_${Date.now()}`,
      type: this.getActionTypeFromReason(reason),
      description: reason,
      xpReward: amount,
      timestamp: new Date()
    }
    this.governanceActions.push(action)

    console.log(`Awarded ${amount} XP to ${address} for ${reason}`)
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
   */
  static async checkTokenGatedAccess(_address: string, _requiredTokens: number): Promise<boolean> {
    // In a real implementation, this would check the user's actual token balance
    // For now, return true for demonstration
    return true
  }

  /**
   * Get points leaderboard
   */
  static async getPointsLeaderboard(limit: number = 10): Promise<UserProfile[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit)
  }

  /**
   * Track governance action for XP rewards
   */
  static async trackGovernanceAction(
    address: string,
    actionType: 'vote' | 'proposal' | 'delegation' | 'participation',
    proposalId?: string,
    description?: string
  ): Promise<void> {
    const xpReward = this.getXPRewardForAction(actionType)
    const actionDescription = description || `${actionType} action${proposalId ? ` for proposal ${proposalId}` : ''}`
    
    await this.awardXP(address, xpReward, actionDescription)
  }

  /**
   * Convert reason string to action type
   */
  private static getActionTypeFromReason(reason: string): 'vote' | 'proposal' | 'delegation' | 'participation' {
    if (reason.includes('vote')) return 'vote'
    if (reason.includes('proposal')) return 'proposal'
    if (reason.includes('delegation')) return 'delegation'
    return 'participation'
  }

  /**
   * Get XP reward for different action types
   */
  private static getXPRewardForAction(actionType: string): number {
    const rewards = {
      'vote': 10,
      'proposal': 50,
      'delegation': 25,
      'participation': 5
    }
    return rewards[actionType as keyof typeof rewards] || 5
  }

  /**
   * Get XP bonus for badge rarity
   */
  private static getBadgeXPBonus(rarity: string): number {
    const bonuses = {
      'common': 0,
      'rare': 25,
      'epic': 50,
      'legendary': 100
    }
    return bonuses[rarity as keyof typeof bonuses] || 0
  }

  /**
   * Get predefined badges
   */
  static getAvailableBadges(): Badge[] {
    return [
      {
        id: 'first_vote',
        name: 'First Vote',
        description: 'Cast your first vote in ClimateDAO governance',
        icon: '🗳️',
        rarity: 'common',
        earnedAt: new Date(),
        category: 'governance'
      },
      {
        id: 'proposal_creator',
        name: 'Proposal Creator',
        description: 'Create your first successful proposal',
        icon: '📝',
        rarity: 'rare',
        earnedAt: new Date(),
        category: 'governance'
      },
      {
        id: 'climate_champion',
        name: 'Climate Champion',
        description: 'Contribute significantly to climate action',
        icon: '🌱',
        rarity: 'epic',
        earnedAt: new Date(),
        category: 'achievement'
      },
      {
        id: 'dao_legend',
        name: 'DAO Legend',
        description: 'Reach the highest level of community participation',
        icon: '👑',
        rarity: 'legendary',
        earnedAt: new Date(),
        category: 'community'
      }
    ]
  }
}