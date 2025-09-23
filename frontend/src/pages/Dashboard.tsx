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
import TribesDashboard from '../components/TribesDashboard'
import { TribesErrorBoundary, TribesStatusIndicator } from '../components/TribesErrorHandler'
import { useTribes } from '../hooks/useTribes'
import { useAchievements } from '../hooks/useAchievements'
import { useStakingInfo, useDAOStats, useUserProposals, useUserVotes } from '../hooks/useContracts'
import AchievementCard from '../components/AchievementCard'
import AchievementNotification from '../components/AchievementNotification'
import { useState } from 'react'

const Dashboard = () => {
  const { address } = useAccount()
  const { userProfile, isConfigurationValid } = useTribes()
  const { formattedStaked, formattedRewards } = useStakingInfo()
  const { } = useDAOStats()
  const { userProposals } = useUserProposals(address)
  const { userVotes } = useUserVotes()
  
  // Achievement system
  const { 
    isLoading: achievementsLoading, 
    getAchievementStats,
    getAchievementsByCategory,
    filterAchievements,
    sortAchievements,
    markAchievementAsViewed,
    unlockedAchievements,
    dismissAchievementNotification
  } = useAchievements()
  
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'earned' | 'locked' | 'in_progress'>('all')
  const [achievementSort, setAchievementSort] = useState<'name' | 'category' | 'progress' | 'earned_date' | 'xp_reward'>('progress')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  
  const achievementStats = getAchievementStats()
  const achievementsByCategory = getAchievementsByCategory()
  const filteredAchievements = sortAchievements(
    filterAchievements(achievementFilter, selectedCategory || undefined),
    achievementSort
  )
  
  const stats = [
    { label: 'Your Proposals', value: userProposals?.length.toString() || '0', icon: FileText, change: 'Active proposals' },
    { label: 'Votes Cast', value: userVotes?.length.toString() || '0', icon: Users, change: 'Total votes' },
    { label: 'Contribution Score', value: userProfile?.xp?.toLocaleString() || '0', icon: Award, change: `Level ${userProfile?.level || 1}` },
    { label: 'Tokens Staked', value: formattedStaked, icon: DollarSign, change: `Rewards: ${formattedRewards} CLIMATE` },
  ]

  // Real activity data from user actions
  const recentActivity = [
    ...(userVotes?.slice(0, 2).map(vote => ({
      type: 'vote',
      action: `Voted ${vote.choice === 1 ? 'for' : vote.choice === 0 ? 'against' : 'abstained'} on proposal #${vote.proposalId}`,
      time: new Date(vote.timestamp * 1000).toLocaleDateString(),
      icon: Users,
    })) || []),
    ...(userProposals?.slice(0, 2).map(proposal => ({
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
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{achievementStats.earnedAchievements}/{achievementStats.totalAchievements}</span>
                <span>•</span>
                <span>{Math.round(achievementStats.completionPercentage)}%</span>
              </div>
            </div>
            
            {/* Achievement Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <select
                value={achievementFilter}
                onChange={(e) => setAchievementFilter(e.target.value as any)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1"
              >
                <option value="all">All</option>
                <option value="earned">Earned</option>
                <option value="in_progress">In Progress</option>
                <option value="locked">Locked</option>
              </select>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
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
                onChange={(e) => setAchievementSort(e.target.value as any)}
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
              {achievementsLoading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading achievements...
                </div>
              ) : filteredAchievements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No achievements found
                </div>
              ) : (
                filteredAchievements.slice(0, 6).map((achievement) => (
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
                ))
              )}
            </div>
            
            {filteredAchievements.length > 6 && (
              <div className="mt-4 text-center">
                <button className="text-sm text-primary-600 hover:text-primary-700">
                  View All Achievements
                </button>
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
            <div className="text-2xl font-bold text-blue-600">{userVotes?.length || 0}</div>
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
          <TribesStatusIndicator 
            status={isConfigurationValid ? 'connected' : 'configuration-error'} 
          />
        </div>
        <TribesErrorBoundary>
          <TribesDashboard />
        </TribesErrorBoundary>
      </div>

      {/* Achievement Notifications */}
      {unlockedAchievements.map((achievement, index) => (
        <AchievementNotification
          key={`${achievement.id}-${index}`}
          achievement={achievement}
          onDismiss={() => {
            dismissAchievementNotification(achievement.id)
            markAchievementAsViewed(achievement.id)
          }}
          autoDismiss={true}
          autoDismissDelay={5000}
          showSound={true}
          className={`top-${4 + index * 20} right-4`}
        />
      ))}
      
      {showAchievementNotification && currentAchievement && (
        <AchievementNotification
          achievement={currentAchievement}
          onDismiss={() => {
            setShowAchievementNotification(false)
            setCurrentAchievement(null)
            markAchievementAsViewed(currentAchievement.id)
          }}
          autoDismiss={true}
          autoDismissDelay={5000}
          showSound={true}
        />
      )}
    </div>
  )
}

export default Dashboard
