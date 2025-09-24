import { 
  Users, 
  DollarSign, 
  FileText,
  Award,
  Activity,
  Target,
  Globe,
  Crown
} from 'lucide-react'
import { useAccount } from 'wagmi'
import { useState, lazy, Suspense, useEffect, useCallback, useMemo, memo } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'

// Lazy load heavy components
const TribesDashboard = lazy(() => import('../components/TribesDashboard'))
const TribesErrorBoundary = lazy(() => import('../components/TribesErrorHandler').then(m => ({ default: m.TribesErrorBoundary })))
const TribesStatusIndicator = lazy(() => import('../components/TribesErrorHandler').then(m => ({ default: m.TribesStatusIndicator })))
const AchievementCard = lazy(() => import('../components/AchievementCard'))
const AchievementNotification = lazy(() => import('../components/AchievementNotification'))

// Import hooks normally but use them conditionally
import { useTribes } from '../hooks/useTribes'
import { useAchievements } from '../hooks/useAchievements'
import { useStakingInfo, useUserProposals, useUserVotes } from '../hooks/useContracts'

const Dashboard = memo(() => {
  const { address } = useAccount()
  const [loadAdvancedFeatures, setLoadAdvancedFeatures] = useState(false)
  const [loadTribes, setLoadTribes] = useState(false)
  const [loadAchievements, setLoadAchievements] = useState(false)
  
  // Load basic data immediately (non-blocking)
  const { formattedStaked, formattedRewards } = useStakingInfo()
  const { userProposals } = useUserProposals(address)
  const { userVotes } = useUserVotes()
  
  // Load advanced features progressively
  const { userProfile, isConfigurationValid } = loadTribes ? useTribes() : { userProfile: null, isConfigurationValid: false }
  const achievementsHook = loadAchievements ? useAchievements() : {
    isLoading: false,
    getAchievementStats: () => ({ earnedAchievements: 0, totalAchievements: 0, completionPercentage: 0 }),
    getAchievementsByCategory: () => ({}),
    filterAchievements: (_filter: any, _category?: string) => [],
    sortAchievements: (achievements: any[], _sort: any) => achievements,
    markAchievementAsViewed: () => {},
    unlockedAchievements: [],
    dismissAchievementNotification: () => {}
  }
  
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'earned' | 'locked' | 'in_progress'>('all')
  const [achievementSort, setAchievementSort] = useState<'name' | 'category' | 'progress' | 'earned_date' | 'xp_reward'>('progress')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  
  // Load advanced features progressively to prevent blocking
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setLoadAdvancedFeatures(true)
    }, 100) // Small delay to allow initial render
    
    const timer2 = setTimeout(() => {
      setLoadTribes(true)
    }, 500) // Load Tribes after 500ms
    
    const timer3 = setTimeout(() => {
      setLoadAchievements(true)
    }, 1000) // Load Achievements after 1 second
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])
  
  // Memoize expensive calculations
  const achievementStats = useMemo(() => 
    loadAchievements ? achievementsHook.getAchievementStats() : { earnedAchievements: 0, totalAchievements: 0, completionPercentage: 0 },
    [loadAchievements, achievementsHook]
  )
  
  const achievementsByCategory = useMemo(() => 
    loadAchievements ? achievementsHook.getAchievementsByCategory() : {},
    [loadAchievements, achievementsHook]
  )
  
  const filteredAchievements = useMemo(() => 
    loadAchievements ? achievementsHook.sortAchievements(
      achievementsHook.filterAchievements(achievementFilter, selectedCategory || undefined),
    achievementSort
    ) : [],
    [loadAchievements, achievementsHook, achievementFilter, selectedCategory, achievementSort]
  )
  
  // Memoize stats to prevent recalculation
  const stats = useMemo(() => [
    { label: 'Your Proposals', value: (userProposals?.length || 0).toString(), icon: FileText, change: 'Active proposals' },
    { label: 'Votes Cast', value: (userVotes?.length || 0).toString(), icon: Users, change: 'Total votes' },
    { label: 'Contribution Score', value: userProfile?.xp?.toLocaleString() || '0', icon: Award, change: `Level ${userProfile?.level || 1}` },
    { label: 'Tokens Staked', value: formattedStaked, icon: DollarSign, change: `Rewards: ${formattedRewards} CLIMATE` },
  ], [userProposals?.length, userVotes?.length, userProfile?.xp, userProfile?.level, formattedStaked, formattedRewards])

  // Memoize event handlers
  const handleAchievementFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setAchievementFilter(e.target.value as any)
  }, [])

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value)
  }, [])

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setAchievementSort(e.target.value as any)
  }, [])

  // Real activity data from user actions
  const recentActivity = [
    ...((userVotes || []).slice(0, 2).map(vote => ({
      type: 'vote',
      action: `Voted ${vote.choice === 1 ? 'for' : vote.choice === 0 ? 'against' : 'abstained'} on proposal #${vote.proposalId}`,
      time: new Date(vote.timestamp * 1000).toLocaleDateString(),
      icon: Users,
    })) || []),
    ...((userProposals || []).slice(0, 2).map(proposal => ({
      type: 'proposal',
      action: `Created "${proposal.title}"`,
      time: new Date(proposal.timestamp * 1000).toLocaleDateString(),
      icon: FileText,
    })) || []),
  ]

  // Show message if no activity
  if (recentActivity.length === 0) {
    recentActivity.push({
      type: 'info',
      action: 'No recent activity. Start by creating a proposal or voting!',
      time: 'Get started',
      icon: Activity,
    })
  }

  // Achievement notification state
  const [showAchievementNotification, setShowAchievementNotification] = useState(false)
  const [currentAchievement, setCurrentAchievement] = useState<any>(null)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Track your participation in climate governance and funding
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon
                return (
                  <div key={index} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div>
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Achievements</h2>
              {loadAdvancedFeatures ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{achievementStats.earnedAchievements}/{achievementStats.totalAchievements}</span>
                <span>•</span>
                <span>{Math.round(achievementStats.completionPercentage)}%</span>
              </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <LoadingSpinner size="sm" />
                  <span>Loading...</span>
                </div>
              )}
            </div>
            
            {loadAdvancedFeatures ? (
              <>
            {/* Achievement Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <select
                value={achievementFilter}
                    onChange={handleAchievementFilterChange}
                className="text-sm border border-gray-300 rounded-md px-2 py-1"
              >
                <option value="all">All</option>
                <option value="earned">Earned</option>
                <option value="in_progress">In Progress</option>
                <option value="locked">Locked</option>
              </select>
              
              <select
                value={selectedCategory}
                    onChange={handleCategoryChange}
                className="text-sm border border-gray-300 rounded-md px-2 py-1"
              >
                <option value="">All Categories</option>
                {Object.keys(achievementsByCategory).map(category => (
                  <option key={category} value={category}>
                    {category.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
              
              <select
                value={achievementSort}
                    onChange={handleSortChange}
                className="text-sm border border-gray-300 rounded-md px-2 py-1"
              >
                <option value="progress">Progress</option>
                <option value="name">Name</option>
                <option value="category">Category</option>
                <option value="xp_reward">XP Reward</option>
                <option value="earned_date">Date Earned</option>
              </select>
            </div>

            {/* Achievements List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
                  {!loadAchievements ? (
                    <div className="text-center py-8 text-gray-500">
                      <LoadingSpinner size="sm" />
                      <p className="mt-2">Loading achievements...</p>
                    </div>
                  ) : achievementsHook.isLoading ? (
                <div className="text-center py-8 text-gray-500">
                      <LoadingSpinner size="sm" />
                      <p className="mt-2">Loading achievements...</p>
                </div>
              ) : filteredAchievements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No achievements found
                </div>
              ) : (
                    <Suspense fallback={<div className="text-center py-4"><LoadingSpinner size="sm" /></div>}>
                      {filteredAchievements.slice(0, 6).map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    isEarned={achievement.isEarned}
                    showProgress={true}
                    onClick={() => {
                      setCurrentAchievement(achievement)
                      setShowAchievementNotification(true)
                    }}
                    className="hover:shadow-md transition-shadow"
                  />
                      ))}
                    </Suspense>
              )}
            </div>
            
            {filteredAchievements.length > 6 && (
              <div className="mt-4 text-center">
                <button className="text-sm text-primary-600 hover:text-primary-700">
                  View All Achievements
                </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <LoadingSpinner size="sm" />
                <p className="mt-2">Loading achievements...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6">Your Climate Impact</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Globe className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Tons CO2 Impact</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">From supported projects</div>
          </div>
          <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Activity className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-blue-600">{(userVotes || []).length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Projects Supported</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Through voting & funding</div>
          </div>
          <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Target className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-purple-600">$0</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Donated</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">To environmental projects</div>
          </div>
        </div>
      </div>

      {/* Tribes OS Integration */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Crown className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold">Tribes OS Community</h2>
          </div>
          {loadAdvancedFeatures ? (
            <Suspense fallback={<LoadingSpinner size="sm" />}>
          <TribesStatusIndicator 
            status={isConfigurationValid ? 'connected' : 'configuration-error'} 
          />
            </Suspense>
          ) : (
            <LoadingSpinner size="sm" />
          )}
        </div>
        {loadAdvancedFeatures ? (
          <Suspense fallback={
            <div className="text-center py-8">
              <LoadingSpinner size="sm" />
              <p className="mt-2 text-gray-500">Loading Tribes dashboard...</p>
            </div>
          }>
        <TribesErrorBoundary>
          <TribesDashboard />
        </TribesErrorBoundary>
          </Suspense>
        ) : (
          <div className="text-center py-8">
            <LoadingSpinner size="sm" />
            <p className="mt-2 text-gray-500">Loading Tribes dashboard...</p>
          </div>
        )}
      </div>

      {/* Achievement Notifications */}
      {loadAchievements && achievementsHook.unlockedAchievements.map((achievement, index) => (
        <Suspense key={`${achievement.id}-${index}`} fallback={null}>
        <AchievementNotification
          achievement={achievement}
          onDismiss={() => {
              achievementsHook.dismissAchievementNotification(achievement.id)
              achievementsHook.markAchievementAsViewed(achievement.id)
          }}
          autoDismiss={true}
          autoDismissDelay={5000}
          showSound={true}
          className={`top-${4 + index * 20} right-4`}
        />
        </Suspense>
      ))}
      
      {showAchievementNotification && currentAchievement && (
        <Suspense fallback={null}>
        <AchievementNotification
          achievement={currentAchievement}
          onDismiss={() => {
            setShowAchievementNotification(false)
            setCurrentAchievement(null)
              if (loadAchievements) {
                achievementsHook.markAchievementAsViewed(currentAchievement.id)
              }
          }}
          autoDismiss={true}
          autoDismissDelay={5000}
          showSound={true}
        />
        </Suspense>
      )}
    </div>
  )
})

Dashboard.displayName = 'Dashboard'

export default Dashboard
