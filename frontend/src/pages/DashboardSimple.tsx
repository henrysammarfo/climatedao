import { useAccount } from 'wagmi'
import { 
  Users, 
  DollarSign, 
  FileText,
  Award,
  Activity
} from 'lucide-react'

const DashboardSimple = () => {
  const { address } = useAccount()
  
  // Simple static data - no blockchain calls
  const stats = [
    { label: 'Your Proposals', value: '0', icon: FileText, change: 'Active proposals' },
    { label: 'Votes Cast', value: '0', icon: Users, change: 'Total votes' },
    { label: 'Contribution Score', value: '0', icon: Award, change: 'Level 1' },
    { label: 'Tokens Staked', value: '0', icon: DollarSign, change: 'Rewards: 0 CLIMATE' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Welcome back! Here's your ClimateDAO overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className="w-8 h-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.change}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Simple Activity Section */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No recent activity</p>
        </div>
      </div>

      {/* Connection Status */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Connected to XDC Apothem Testnet
          </span>
        </div>
        {address && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Address: {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        )}
      </div>
    </div>
  )
}

export default DashboardSimple
