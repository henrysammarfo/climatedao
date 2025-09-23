import { registryService } from './registryService';
import { TribesIntegration } from './tribesService';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: 'first_steps' | 'participation' | 'leadership' | 'community' | 'impact';
  requirements: {
    type: 'vote' | 'proposal' | 'donation' | 'stake' | 'unstakes' | 'execution' | 'claim_tokens';
    targetCount: number;
    metadata?: any;
  };
  xpReward: number;
  badge: {
    name: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
}

export interface UserProgress {
  actionCounts: {
    votes: number;
    proposals: number;
    donations: number;
    stakes: number;
    unstakes: number;
    executions: number;
    tokensClaimed: number;
  };
  earnedAchievements: string[];
  earnedAtById: Record<string, number>;
  lastUpdated: number;
}

export interface AchievementStatus {
  id: string;
  title: string;
  description: string;
  category: string;
  isEarned: boolean;
  progress: number;
  targetCount: number;
  xpReward: number;
  badge: {
    name: string;
    icon: string;
    rarity: string;
  };
  earnedAt?: number;
}

class AchievementService {
  private achievements: AchievementDefinition[] = [];

  constructor() {
    this.defineAchievements();
  }

  defineAchievements(): AchievementDefinition[] {
    this.achievements = [
      // First Steps
      {
        id: 'first_vote',
        title: 'First Vote',
        description: 'Cast your first vote on a proposal',
        category: 'first_steps',
        requirements: { type: 'vote', targetCount: 1 },
        xpReward: 50,
        badge: { name: 'First Vote', icon: 'Vote', rarity: 'common' }
      },
      {
        id: 'first_proposal',
        title: 'First Proposal',
        description: 'Create your first proposal',
        category: 'first_steps',
        requirements: { type: 'proposal', targetCount: 1 },
        xpReward: 100,
        badge: { name: 'First Proposal', icon: 'FileText', rarity: 'common' }
      },
      {
        id: 'first_donation',
        title: 'First Donation',
        description: 'Make your first donation to a proposal',
        category: 'first_steps',
        requirements: { type: 'donation', targetCount: 1 },
        xpReward: 75,
        badge: { name: 'First Donation', icon: 'Heart', rarity: 'common' }
      },

      // Participation
      {
        id: 'voter_5',
        title: 'Active Voter',
        description: 'Vote on 5 proposals',
        category: 'participation',
        requirements: { type: 'vote', targetCount: 5 },
        xpReward: 100,
        badge: { name: 'Active Voter', icon: 'Vote', rarity: 'common' }
      },
      {
        id: 'voter_10',
        title: 'Dedicated Voter',
        description: 'Vote on 10 proposals',
        category: 'participation',
        requirements: { type: 'vote', targetCount: 10 },
        xpReward: 200,
        badge: { name: 'Dedicated Voter', icon: 'Vote', rarity: 'rare' }
      },
      {
        id: 'voter_25',
        title: 'Voting Champion',
        description: 'Vote on 25 proposals',
        category: 'participation',
        requirements: { type: 'vote', targetCount: 25 },
        xpReward: 500,
        badge: { name: 'Voting Champion', icon: 'Vote', rarity: 'epic' }
      },
      {
        id: 'voter_50',
        title: 'Voting Legend',
        description: 'Vote on 50 proposals',
        category: 'participation',
        requirements: { type: 'vote', targetCount: 50 },
        xpReward: 1000,
        badge: { name: 'Voting Legend', icon: 'Vote', rarity: 'legendary' }
      },

      // Leadership
      {
        id: 'proposer_1',
        title: 'Community Leader',
        description: 'Create 2 proposals',
        category: 'leadership',
        requirements: { type: 'proposal', targetCount: 2 },
        xpReward: 200,
        badge: { name: 'Community Leader', icon: 'FileText', rarity: 'rare' }
      },
      {
        id: 'proposer_5',
        title: 'Proposal Master',
        description: 'Create 5 proposals',
        category: 'leadership',
        requirements: { type: 'proposal', targetCount: 5 },
        xpReward: 500,
        badge: { name: 'Proposal Master', icon: 'FileText', rarity: 'epic' }
      },
      {
        id: 'proposer_10',
        title: 'Governance Expert',
        description: 'Create 10 proposals',
        category: 'leadership',
        requirements: { type: 'proposal', targetCount: 10 },
        xpReward: 1000,
        badge: { name: 'Governance Expert', icon: 'FileText', rarity: 'legendary' }
      },

      // Community
      {
        id: 'donor_1',
        title: 'Supporter',
        description: 'Make 1 donation',
        category: 'community',
        requirements: { type: 'donation', targetCount: 1 },
        xpReward: 100,
        badge: { name: 'Supporter', icon: 'Heart', rarity: 'common' }
      },
      {
        id: 'donor_5',
        title: 'Generous Donor',
        description: 'Make 5 donations',
        category: 'community',
        requirements: { type: 'donation', targetCount: 5 },
        xpReward: 300,
        badge: { name: 'Generous Donor', icon: 'Heart', rarity: 'rare' }
      },
      {
        id: 'donor_10',
        title: 'Community Champion',
        description: 'Make 10 donations',
        category: 'community',
        requirements: { type: 'donation', targetCount: 10 },
        xpReward: 750,
        badge: { name: 'Community Champion', icon: 'Heart', rarity: 'epic' }
      },

      // Impact
      {
        id: 'staker',
        title: 'Token Staker',
        description: 'Stake your tokens',
        category: 'impact',
        requirements: { type: 'stake', targetCount: 1 },
        xpReward: 150,
        badge: { name: 'Token Staker', icon: 'Lock', rarity: 'rare' }
      },
      {
        id: 'executor',
        title: 'Proposal Executor',
        description: 'Execute a proposal',
        category: 'impact',
        requirements: { type: 'execution', targetCount: 1 },
        xpReward: 300,
        badge: { name: 'Proposal Executor', icon: 'Play', rarity: 'epic' }
      },
      {
        id: 'token_claimer',
        title: 'Token Claimer',
        description: 'Claim tokens from the faucet',
        category: 'impact',
        requirements: { type: 'claim_tokens', targetCount: 1 },
        xpReward: 50,
        badge: { name: 'Token Claimer', icon: 'Coins', rarity: 'common' }
      }
    ];

    return this.achievements;
  }

  async getUserProgress(address: string): Promise<UserProgress> {
    try {
      const progress = await registryService.getAchievementProgress(address);
      return progress || {
        actionCounts: {
          votes: 0,
          proposals: 0,
          donations: 0,
          stakes: 0,
          unstakes: 0,
          executions: 0,
          tokensClaimed: 0
        },
        earnedAchievements: [],
        earnedAtById: {},
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Error loading user progress:', error);
      return {
        actionCounts: {
          votes: 0,
          proposals: 0,
          donations: 0,
          stakes: 0,
          unstakes: 0,
          executions: 0,
          tokensClaimed: 0
        },
        earnedAchievements: [],
        earnedAtById: {},
        lastUpdated: Date.now()
      };
    }
  }

  async recordAction(address: string, actionType: string): Promise<void> {
    try {
      const progress = await this.getUserProgress(address);
      
      // Increment the appropriate counter
      switch (actionType) {
        case 'vote':
          progress.actionCounts.votes++;
          break;
        case 'proposal':
          progress.actionCounts.proposals++;
          break;
        case 'donation':
          progress.actionCounts.donations++;
          break;
        case 'stake':
          progress.actionCounts.stakes++;
          break;
        case 'unstake':
          progress.actionCounts.unstakes++;
          break;
        case 'execution':
          progress.actionCounts.executions++;
          break;
        case 'claim_tokens':
          progress.actionCounts.tokensClaimed++;
          break;
        default:
          console.warn(`Unknown action type: ${actionType}`);
          return;
      }

      progress.lastUpdated = Date.now();

      // Save updated progress
      await registryService.updateAchievementProgress(address, progress);

      // Evaluate achievements
      await this.evaluateAchievements(address);
      
      // Dispatch custom event for real-time progress updates
      window.dispatchEvent(new CustomEvent('achievementProgressUpdated'));
    } catch (error) {
      console.error('Error recording action:', error);
    }
  }

  async evaluateAchievements(address: string): Promise<string[]> {
    try {
      const progress = await this.getUserProgress(address);
      const newAchievements: string[] = [];

      for (const achievement of this.achievements) {
        if (progress.earnedAchievements.includes(achievement.id)) {
          continue; // Already earned
        }

        const { type, targetCount } = achievement.requirements;
        let currentCount = 0;

        switch (type) {
          case 'vote':
            currentCount = progress.actionCounts.votes;
            break;
          case 'proposal':
            currentCount = progress.actionCounts.proposals;
            break;
          case 'donation':
            currentCount = progress.actionCounts.donations;
            break;
          case 'stake':
            currentCount = progress.actionCounts.stakes;
            break;
          case 'unstakes':
            currentCount = progress.actionCounts.unstakes;
            break;
          case 'execution':
            currentCount = progress.actionCounts.executions;
            break;
          case 'claim_tokens':
            currentCount = progress.actionCounts.tokensClaimed;
            break;
        }

        if (currentCount >= targetCount) {
          await this.awardAchievement(address, achievement.id);
          newAchievements.push(achievement.id);
        }
      }

      return newAchievements;
    } catch (error) {
      console.error('Error evaluating achievements:', error);
      return [];
    }
  }

  async awardAchievement(address: string, achievementId: string): Promise<void> {
    try {
      const achievement = this.achievements.find(a => a.id === achievementId);
      if (!achievement) {
        console.error(`Achievement not found: ${achievementId}`);
        return;
      }

      const progress = await this.getUserProgress(address);
      
      // Add to earned achievements
      if (!progress.earnedAchievements.includes(achievementId)) {
        progress.earnedAchievements.push(achievementId);
        progress.earnedAtById[achievementId] = Date.now();
        progress.lastUpdated = Date.now();
        
        // Save updated progress
        await registryService.updateAchievementProgress(address, progress);

        // Award XP and badge through Tribes service
        await TribesIntegration.awardXP(address, achievement.xpReward, `Achievement: ${achievement.title}`);
        
        // Construct full Badge object before calling awardBadge
        const fullBadge = {
          id: achievement.id,
          name: achievement.badge.name,
          description: achievement.description,
          icon: achievement.badge.icon,
          rarity: achievement.badge.rarity,
          earnedAt: Date.now(),
          category: 'achievement' as const
        };
        await TribesIntegration.awardBadge(address, fullBadge);

        // Show notification
        this.showAchievementNotification(achievement);
      }
    } catch (error) {
      console.error('Error awarding achievement:', error);
    }
  }

  async getAchievementStatus(address: string): Promise<AchievementStatus[]> {
    try {
      const progress = await this.getUserProgress(address);
      const statuses: AchievementStatus[] = [];

      for (const achievement of this.achievements) {
        const { type, targetCount } = achievement.requirements;
        let currentCount = 0;

        switch (type) {
          case 'vote':
            currentCount = progress.actionCounts.votes;
            break;
          case 'proposal':
            currentCount = progress.actionCounts.proposals;
            break;
          case 'donation':
            currentCount = progress.actionCounts.donations;
            break;
          case 'stake':
            currentCount = progress.actionCounts.stakes;
            break;
          case 'unstakes':
            currentCount = progress.actionCounts.unstakes;
            break;
          case 'execution':
            currentCount = progress.actionCounts.executions;
            break;
          case 'claim_tokens':
            currentCount = progress.actionCounts.tokensClaimed;
            break;
        }

        const isEarned = progress.earnedAchievements.includes(achievement.id);
        const progressValue = Math.min(currentCount, targetCount);

        statuses.push({
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          category: achievement.category,
          isEarned,
          progress: progressValue,
          targetCount,
          xpReward: achievement.xpReward,
          badge: achievement.badge,
          earnedAt: isEarned ? (progress.earnedAtById[achievement.id] || progress.lastUpdated) : undefined
        });
      }

      return statuses;
    } catch (error) {
      console.error('Error getting achievement status:', error);
      return [];
    }
  }

  private showAchievementNotification(achievement: AchievementDefinition): void {
    // This will be handled by the AchievementNotification component
    // For now, we'll dispatch a custom event
    const event = new CustomEvent('achievementUnlocked', {
      detail: achievement
    });
    window.dispatchEvent(event);
  }

  getAchievementsByCategory(): Record<string, AchievementDefinition[]> {
    return this.achievements.reduce((acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = [];
      }
      acc[achievement.category].push(achievement);
      return acc;
    }, {} as Record<string, AchievementDefinition[]>);
  }

  getCategoryDisplayName(category: string): string {
    const names: Record<string, string> = {
      'first_steps': 'First Steps',
      'participation': 'Participation',
      'leadership': 'Leadership',
      'community': 'Community',
      'impact': 'Impact'
    };
    return names[category] || category;
  }
}

export const achievementService = new AchievementService();
