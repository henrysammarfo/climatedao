/**
 * Registry Service - Persistent storage for user registration data
 * Handles localStorage operations for user registry management
 */

export interface UserRegistry {
  [walletAddress: string]: UserRegistration;
}

export interface UserRegistration {
  walletAddress: string;
  isRegistered: boolean;
  registrationTimestamp: number;
  userProfile?: {
    id: string;
    address: string;
    username: string;
    avatar?: string;
    xp: number;
    level: number;
    badges: Badge[];
    joinedAt: number; // Unix timestamp in milliseconds
    contributions: number;
    role?: string;
  };
  achievementProgress?: {
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
  };
  lastUpdated: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: number; // Unix timestamp in milliseconds
  category: 'governance' | 'contribution' | 'community' | 'achievement';
}

export interface RegistrationStatus {
  isRegistered: boolean;
  registrationTimestamp?: number;
  userProfile?: UserRegistration['userProfile'];
}

export interface StorageManager {
  persistRegistry(registry: UserRegistry): Promise<void>;
  loadRegistry(): Promise<UserRegistry>;
  clearRegistry(): Promise<void>;
  backupRegistry(): Promise<string>;
  restoreRegistry(backup: string): Promise<void>;
}

class RegistryService implements StorageManager {
  private static readonly STORAGE_KEY = 'climatedao_user_registry';
  private static readonly BACKUP_KEY = 'climatedao_registry_backup';
  private static readonly MAX_BACKUP_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Check if a wallet is registered
   */
  async isWalletRegistered(walletAddress: string): Promise<boolean> {
    try {
      const registry = await this.loadRegistry();
      const registration = registry[walletAddress.toLowerCase()];
      return registration?.isRegistered || false;
    } catch (error) {
      console.error('Error checking wallet registration:', error);
      return false;
    }
  }

  /**
   * Register a wallet with user profile data
   */
  async registerWallet(walletAddress: string, userProfile?: UserRegistration['userProfile']): Promise<void> {
    try {
      const registry = await this.loadRegistry();
      const now = Date.now();
      
      registry[walletAddress.toLowerCase()] = {
        walletAddress: walletAddress.toLowerCase(),
        isRegistered: true,
        registrationTimestamp: now,
        userProfile,
        lastUpdated: now
      };

      await this.persistRegistry(registry);
      console.log(`Wallet ${walletAddress} registered successfully`);
    } catch (error) {
      console.error('Error registering wallet:', error);
      throw new Error(`Failed to register wallet: ${error}`);
    }
  }

  /**
   * Get user registration data
   */
  async getUserRegistration(walletAddress: string): Promise<RegistrationStatus> {
    try {
      const registry = await this.loadRegistry();
      const registration = registry[walletAddress.toLowerCase()];
      
      if (!registration) {
        return { isRegistered: false };
      }

      return {
        isRegistered: registration.isRegistered,
        registrationTimestamp: registration.registrationTimestamp,
        userProfile: registration.userProfile
      };
    } catch (error) {
      console.error('Error getting user registration:', error);
      return { isRegistered: false };
    }
  }

  /**
   * Update user profile data
   */
  async updateUserProfile(walletAddress: string, userProfile: UserRegistration['userProfile']): Promise<void> {
    try {
      const registry = await this.loadRegistry();
      const registration = registry[walletAddress.toLowerCase()];
      
      if (registration) {
        registration.userProfile = userProfile;
        registration.lastUpdated = Date.now();
        await this.persistRegistry(registry);
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error(`Failed to update user profile: ${error}`);
    }
  }

  /**
   * Unregister a wallet (for testing/admin purposes)
   */
  async unregisterWallet(walletAddress: string): Promise<void> {
    try {
      const registry = await this.loadRegistry();
      delete registry[walletAddress.toLowerCase()];
      await this.persistRegistry(registry);
      console.log(`Wallet ${walletAddress} unregistered successfully`);
    } catch (error) {
      console.error('Error unregistering wallet:', error);
      throw new Error(`Failed to unregister wallet: ${error}`);
    }
  }

  /**
   * Get all registered wallets
   */
  async getAllRegisteredWallets(): Promise<string[]> {
    try {
      const registry = await this.loadRegistry();
      return Object.keys(registry).filter(address => registry[address].isRegistered);
    } catch (error) {
      console.error('Error getting registered wallets:', error);
      return [];
    }
  }

  /**
   * Persist registry to localStorage
   */
  async persistRegistry(registry: UserRegistry): Promise<void> {
    try {
      const registryJson = JSON.stringify(registry);
      localStorage.setItem(RegistryService.STORAGE_KEY, registryJson);
      
      // Create backup
      await this.createBackup(registryJson);
    } catch (error) {
      console.error('Error persisting registry:', error);
      throw new Error(`Failed to persist registry: ${error}`);
    }
  }

  /**
   * Load registry from localStorage
   */
  async loadRegistry(): Promise<UserRegistry> {
    try {
      const registryJson = localStorage.getItem(RegistryService.STORAGE_KEY);
      
      if (!registryJson) {
        return {};
      }

      const registry = JSON.parse(registryJson) as UserRegistry;
      
      // Validate registry structure
      return this.validateRegistry(registry);
    } catch (error) {
      console.error('Error loading registry:', error);
      
      // Try to restore from backup
      try {
        const backup = await this.getLatestBackup();
        if (backup) {
          let registry: UserRegistry;
          
          // Check if backup is a wrapper object or raw registry JSON
          try {
            const backupData = JSON.parse(backup);
            if (backupData.registry) {
              // It's a wrapper object with registry key
              registry = backupData.registry as UserRegistry;
            } else {
              // It's raw registry JSON
              registry = backupData as UserRegistry;
            }
          } catch (parseError) {
            // If parsing fails, treat as raw registry JSON
            registry = JSON.parse(backup) as UserRegistry;
          }
          
          await this.persistRegistry(registry);
          return this.validateRegistry(registry);
        }
      } catch (backupError) {
        console.error('Error restoring from backup:', backupError);
      }
      
      return {};
    }
  }

  /**
   * Clear all registry data
   */
  async clearRegistry(): Promise<void> {
    try {
      localStorage.removeItem(RegistryService.STORAGE_KEY);
      localStorage.removeItem(RegistryService.BACKUP_KEY);
      console.log('Registry cleared successfully');
    } catch (error) {
      console.error('Error clearing registry:', error);
      throw new Error(`Failed to clear registry: ${error}`);
    }
  }

  /**
   * Create backup of registry data
   */
  async backupRegistry(): Promise<string> {
    try {
      const registry = await this.loadRegistry();
      const registryJson = JSON.stringify(registry);
      
      // Store only the raw registry JSON string via createBackup
      await this.createBackup(registryJson);
      
      // Return the wrapper format for export/restore via restoreRegistry()
      const backup = JSON.stringify({
        registry,
        timestamp: Date.now(),
        version: '1.0'
      });
      
      return backup;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error(`Failed to create backup: ${error}`);
    }
  }

  /**
   * Restore registry from backup
   */
  async restoreRegistry(backup: string): Promise<void> {
    try {
      const backupData = JSON.parse(backup);
      
      if (!backupData.registry || !backupData.timestamp) {
        throw new Error('Invalid backup format');
      }

      // Check backup age
      const backupAge = Date.now() - backupData.timestamp;
      if (backupAge > RegistryService.MAX_BACKUP_AGE) {
        console.warn('Backup is older than 7 days, proceeding with caution');
      }

      const registry = this.validateRegistry(backupData.registry);
      await this.persistRegistry(registry);
      
      console.log('Registry restored from backup successfully');
    } catch (error) {
      console.error('Error restoring registry:', error);
      throw new Error(`Failed to restore registry: ${error}`);
    }
  }

  /**
   * Create backup in localStorage
   */
  private async createBackup(registryJson: string): Promise<void> {
    try {
      const backup = JSON.stringify({
        data: registryJson,
        timestamp: Date.now()
      });
      localStorage.setItem(RegistryService.BACKUP_KEY, backup);
    } catch (error) {
      console.warn('Failed to create backup:', error);
    }
  }

  /**
   * Get latest backup from localStorage
   */
  private async getLatestBackup(): Promise<string | null> {
    try {
      const backupJson = localStorage.getItem(RegistryService.BACKUP_KEY);
      if (!backupJson) return null;

      const backup = JSON.parse(backupJson);
      return backup.data;
    } catch (error) {
      console.error('Error getting backup:', error);
      return null;
    }
  }

  /**
   * Validate registry structure and clean invalid entries
   */
  private validateRegistry(registry: any): UserRegistry {
    const validatedRegistry: UserRegistry = {};

    for (const [address, registration] of Object.entries(registry)) {
      if (this.isValidRegistration(registration)) {
        validatedRegistry[address.toLowerCase()] = registration as UserRegistration;
      } else {
        console.warn(`Invalid registration data for ${address}, skipping`);
      }
    }

    return validatedRegistry;
  }

  /**
   * Check if registration data is valid
   */
  private isValidRegistration(registration: any): boolean {
    const isValid = (
      registration &&
      typeof registration === 'object' &&
      typeof registration.walletAddress === 'string' &&
      typeof registration.isRegistered === 'boolean' &&
      typeof registration.registrationTimestamp === 'number' &&
      typeof registration.lastUpdated === 'number'
    );

    // Validate achievementProgress if it exists
    if (isValid && registration.achievementProgress) {
      const progress = registration.achievementProgress;
      return (
        typeof progress === 'object' &&
        typeof progress.actionCounts === 'object' &&
        typeof progress.actionCounts.votes === 'number' &&
        typeof progress.actionCounts.proposals === 'number' &&
        typeof progress.actionCounts.donations === 'number' &&
        typeof progress.actionCounts.stakes === 'number' &&
        typeof progress.actionCounts.unstakes === 'number' &&
        typeof progress.actionCounts.executions === 'number' &&
        typeof progress.actionCounts.tokensClaimed === 'number' &&
        Array.isArray(progress.earnedAchievements) &&
        typeof progress.lastUpdated === 'number'
      );
    }

    return isValid;
  }

  /**
   * Get achievement progress for a user
   */
  async getAchievementProgress(walletAddress: string): Promise<UserRegistration['achievementProgress']> {
    try {
      const registry = await this.loadRegistry();
      const registration = registry[walletAddress.toLowerCase()];
      return registration?.achievementProgress || {
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
      console.error('Error getting achievement progress:', error);
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

  /**
   * Update achievement progress for a user
   */
  async updateAchievementProgress(walletAddress: string, progress: UserRegistration['achievementProgress']): Promise<void> {
    try {
      const registry = await this.loadRegistry();
      const registration = registry[walletAddress.toLowerCase()];
      
      if (registration) {
        registration.achievementProgress = progress;
        registration.lastUpdated = Date.now();
        await this.persistRegistry(registry);
      } else {
        // Create new registration if it doesn't exist
        await this.registerWallet(walletAddress);
        const newRegistry = await this.loadRegistry();
        const newRegistration = newRegistry[walletAddress.toLowerCase()];
        if (newRegistration) {
          newRegistration.achievementProgress = progress;
          newRegistration.lastUpdated = Date.now();
          await this.persistRegistry(newRegistry);
        }
      }
    } catch (error) {
      console.error('Error updating achievement progress:', error);
      throw new Error(`Failed to update achievement progress: ${error}`);
    }
  }

  /**
   * Increment action count for a user
   */
  async incrementActionCount(walletAddress: string, actionType: string): Promise<void> {
    try {
      const progress = await this.getAchievementProgress(walletAddress);
      
      if (!progress) {
        console.warn('No progress found for user:', walletAddress);
        return;
      }
      
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
      await this.updateAchievementProgress(walletAddress, progress);
    } catch (error) {
      console.error('Error incrementing action count:', error);
      throw new Error(`Failed to increment action count: ${error}`);
    }
  }

  /**
   * Get registry statistics
   */
  async getRegistryStats(): Promise<{
    totalRegistered: number;
    totalWallets: number;
    lastUpdated: number;
  }> {
    try {
      const registry = await this.loadRegistry();
      const wallets = Object.values(registry);
      
      return {
        totalRegistered: wallets.filter(w => w.isRegistered).length,
        totalWallets: wallets.length,
        lastUpdated: Math.max(...wallets.map(w => w.lastUpdated), 0)
      };
    } catch (error) {
      console.error('Error getting registry stats:', error);
      return {
        totalRegistered: 0,
        totalWallets: 0,
        lastUpdated: 0
      };
    }
  }
}

// Export singleton instance
export const registryService = new RegistryService();
export default registryService;
