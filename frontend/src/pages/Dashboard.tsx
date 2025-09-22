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
import TribesDashboard from '../components/TribesDashboard'
import { useTribes } from '../hooks/useTribes'

const Dashboard = () => {
  const { userProfile } = useTribes()
  
  const stats = [
    { label: 'Your Proposals', value: '3', icon: FileText, change: '+1 this month' },
    { label: 'Votes Cast', value: '47', icon: Users, change: '+12 this week' },
    { label: 'Contribution Score', value: userProfile?.xp.toLocaleString() || '0', icon: Award, change: `Level ${userProfile?.level || 1}` },
    { label: 'Tokens Staked', value: '500', icon: DollarSign, change: 'Staking rewards: 2.5%' },
  ]

  const recentActivity = [
    {
      type: 'vote',
      action: 'Voted for "Solar Farm in Kenya"',
      time: '2 hours ago',
      icon: Users,
    },
    {
      type: 'proposal',
      action: 'Created "Ocean Cleanup Initiative"',
      time: '1 day ago',
      icon: FileText,
    },
    {
      type: 'reward',
      action: 'Earned 50 XP for active participation',
      time: '3 days ago',
      icon: Award,
    },
    {
      type: 'stake',
      action: 'Staked 100 CLIMATE tokens',
      time: '1 week ago',
      icon: DollarSign,
    },
  ]

  const achievements = [
    {
      title: 'Climate Champion',
      description: 'Voted on 50+ environmental proposals',
      icon: Award,
      earned: true,
    },
    {
      title: 'Proposal Creator',
      description: 'Created your first proposal',
      icon: FileText,
      earned: true,
    },
    {
      title: 'Community Builder',
      description: 'Invited 10+ community members',
      icon: Users,
      earned: false,
    },
    {
      title: 'Impact Tracker',
      description: 'Tracked 100+ project outcomes',
      icon: Target,
      earned: false,
    },
  ]

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
            <h2 className="text-xl font-semibold mb-6">Achievements</h2>
            <div className="space-y-4">
              {achievements.map((achievement, index) => {
                const Icon = achievement.icon
                return (
                  <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg ${
                    achievement.earned ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                  }`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      achievement.earned ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        achievement.earned ? 'text-green-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        achievement.earned ? 'text-green-900' : 'text-gray-500'
                      }`}>
                        {achievement.title}
                      </p>
                      <p className={`text-xs ${
                        achievement.earned ? 'text-green-700' : 'text-gray-400'
                      }`}>
                        {achievement.description}
                      </p>
                    </div>
                    {achievement.earned && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6">Your Climate Impact</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <Globe className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-green-600">2.5K</div>
            <div className="text-sm text-gray-600">Tons CO2 Impact</div>
            <div className="text-xs text-gray-500 mt-1">From supported projects</div>
          </div>
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <Activity className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-blue-600">15</div>
            <div className="text-sm text-gray-600">Projects Supported</div>
            <div className="text-xs text-gray-500 mt-1">Through voting & funding</div>
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <Target className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-purple-600">$50K</div>
            <div className="text-sm text-gray-600">Total Donated</div>
            <div className="text-xs text-gray-500 mt-1">To environmental projects</div>
          </div>
        </div>
      </div>

      {/* Tribes OS Integration */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-6">
          <Crown className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold">Tribes OS Community</h2>
        </div>
        <TribesDashboard />
      </div>
    </div>
  )
}

export default Dashboard
