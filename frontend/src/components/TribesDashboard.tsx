import { useState, useEffect } from 'react'
import { 
  Trophy, 
  Calendar, 
  Users, 
  Award, 
  Star,
  Crown,
  Zap,
  Target,
  Clock,
  AlertTriangle,
  Settings,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { useTribes } from '../hooks/useTribes'
import { TribesIntegration } from '../services/tribesService'
import { Badge } from '../services/registryService'
import { getConfigurationErrorMessages, tribesConfigValidator } from '../utils/tribesConfig'
import TribesConfigTester from './TribesConfigTester'
import toast from 'react-hot-toast'

const TribesDashboard = () => {
  const { 
    userProfile, 
    events, 
    leaderboard, 
    isLoading, 
    joinEvent,
    convertPointsToTokens,
    getClimateDAOTokenAddress,
    createClimateDAOToken,
    retryConfiguration
  } = useTribes()
  const [selectedTab, setSelectedTab] = useState<'profile' | 'events' | 'leaderboard' | 'tokens'>('profile')
  const [tokenAddress, setTokenAddress] = useState<string | null>(null)
  const [configStatus, setConfigStatus] = useState<'checking' | 'valid' | 'invalid'>('checking')
  const [showConfigTester, setShowConfigTester] = useState(false)

  // Check configuration status on mount
  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        const status = tribesConfigValidator.getConfigurationStatus()
        setConfigStatus(status.isValid ? 'valid' : 'invalid')
      } catch (error) {
        console.error('Configuration check failed:', error)
        setConfigStatus('invalid')
      }
    }

    checkConfiguration()
  }, [])

  const getRarityColor = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100'
      case 'rare': return 'text-blue-600 bg-blue-100'
      case 'epic': return 'text-purple-600 bg-purple-100'
      case 'legendary': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRarityIcon = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'common': return <Star className="w-4 h-4" />
      case 'rare': return <Zap className="w-4 h-4" />
      case 'epic': return <Target className="w-4 h-4" />
      case 'legendary': return <Crown className="w-4 h-4" />
      default: return <Star className="w-4 h-4" />
    }
  }

  const handleConvertPoints = async (points: number) => {
    if (userProfile && userProfile.xp >= points) {
      await convertPointsToTokens(points)
    }
  }

  const handleGetTokenAddress = async () => {
    const address = await getClimateDAOTokenAddress()
    if (address) {
      setTokenAddress(address)
    }
  }

  const handleCreateToken = async () => {
    try {
      const txHash = await createClimateDAOToken()
      if (txHash) {
        toast.success(`Token created successfully! Transaction: ${txHash}`)
      }
    } catch (error: any) {
      console.error('Token creation failed:', error)
      toast.error(error.message || 'Failed to create token. Please try again.')
    }
  }

  const handleRetryConfiguration = async () => {
    try {
      setConfigStatus('checking')
      await retryConfiguration()
      const status = tribesConfigValidator.getConfigurationStatus()
      setConfigStatus(status.isValid ? 'valid' : 'invalid')
      if (status.isValid) {
        toast.success('Configuration is now valid!')
      }
    } catch (error) {
      console.error('Configuration retry failed:', error)
      setConfigStatus('invalid')
      toast.error('Configuration retry failed. Please check your settings.')
    }
  }

  const handleTestConfiguration = async () => {
    try {
      const result = await TribesIntegration.testTribesConnection()
      if (result.success) {
        toast.success('Configuration test passed!')
      } else {
        toast.error(`Configuration test failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Configuration test failed:', error)
      toast.error('Configuration test failed. Please check your settings.')
    }
  }

  // Show configuration error if invalid
  if (configStatus === 'invalid') {
    const configStatus = tribesConfigValidator.getConfigurationStatus()
    const errorInfo = getConfigurationErrorMessages(configStatus)
    
    return (
      <div className="space-y-6">
        <div className="card border-red-200 bg-red-50">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">{errorInfo.title}</h3>
              <p className="text-red-700 mb-4">{errorInfo.message}</p>
              
              {errorInfo.instructions.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-red-900 mb-2">Setup Instructions:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                    {errorInfo.instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ul>
                </div>
              )}

              {errorInfo.links.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-red-900 mb-2">Helpful Links:</h4>
                  <div className="flex flex-wrap gap-2">
                    {errorInfo.links.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-sm text-red-600 hover:text-red-800 underline"
                      >
                        <span>{link.text}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleRetryConfiguration}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Configuration</span>
                </button>
                
                {import.meta.env.DEV && (
                  <>
                    <button
                      onClick={handleTestConfiguration}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Test Configuration</span>
                    </button>
                    
                    <button
                      onClick={() => setShowConfigTester(!showConfigTester)}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>{showConfigTester ? 'Hide' : 'Show'} Config Tester</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading || configStatus === 'checking') {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tribes OS Dashboard</h2>
            <p className="text-gray-600">Community governance and engagement platform</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-primary-600" />
              <span className="text-sm font-medium text-gray-600">Level {userProfile?.level || 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'profile', label: 'Profile', icon: Users },
            { id: 'events', label: 'Events', icon: Calendar },
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
            { id: 'tokens', label: 'Tokens', icon: Zap }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Profile Tab */}
      {selectedTab === 'profile' && userProfile && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* User Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Your Profile</h3>
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-600">
                    {userProfile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold">{userProfile.username}</h4>
                  <p className="text-gray-600">{userProfile.address.slice(0, 6)}...{userProfile.address.slice(-4)}</p>
                  <p className="text-sm text-gray-500">Joined {new Date(userProfile.joinedAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">{userProfile.xp.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total XP</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{userProfile.level}</div>
                  <div className="text-sm text-gray-600">Level</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{userProfile.contributions}</div>
                  <div className="text-sm text-gray-600">Contributions</div>
                </div>
              </div>

              {/* XP Progress */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress to Level {userProfile.level + 1}</span>
                  <span>{userProfile.xp % 1000}/1000 XP</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${(userProfile.xp % 1000) / 10}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Your Badges</h3>
              {userProfile.badges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {userProfile.badges.map((badge) => (
                    <div key={badge.id} className="text-center p-4 border rounded-lg">
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <div className="font-medium text-sm mb-1">{badge.name}</div>
                      <div className="text-xs text-gray-600 mb-2">{badge.description}</div>
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(badge.rarity)}`}>
                        {getRarityIcon(badge.rarity)}
                        <span className="capitalize">{badge.rarity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No badges earned yet</p>
                  <p className="text-sm">Start participating in governance to earn badges!</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full btn-primary">
                  Create Proposal
                </button>
                <button className="w-full btn-outline">
                  Join Event
                </button>
                <button className="w-full btn-secondary">
                  View Leaderboard
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Achievements</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">First Vote</span>
                  <span className="text-xs text-gray-500">+50 XP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Create Proposal</span>
                  <span className="text-xs text-gray-500">+100 XP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Attend Event</span>
                  <span className="text-xs text-gray-500">+25 XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Events Tab */}
      {selectedTab === 'events' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold">{event.title}</h4>
                          {event.isTokenGated && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              Token Gated
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{event.date.toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{event.attendees.length}/{event.maxAttendees}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{event.type}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => joinEvent(event.id)}
                        className="btn-primary"
                        disabled={event.attendees.length >= event.maxAttendees}
                      >
                        {event.attendees.length >= event.maxAttendees ? 'Full' : 'Join'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No upcoming events</p>
                <p className="text-sm">Check back later for community events!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {selectedTab === 'leaderboard' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Community Leaderboard</h3>
          {leaderboard.length > 0 ? (
            <div className="space-y-3">
              {leaderboard.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.address.slice(0, 6)}...{user.address.slice(-4)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{user.xp.toLocaleString()} XP</div>
                    <div className="text-sm text-gray-500">Level {user.level}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No leaderboard data available</p>
            </div>
          )}
        </div>
      )}

      {/* Tokens Tab */}
      {selectedTab === 'tokens' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">ClimateDAO Tribe Token</h3>
            <div className="space-y-4">
              <div className="p-4 bg-primary-50 rounded-lg">
                <h4 className="font-medium text-primary-900 mb-2">Token Information</h4>
                <p className="text-sm text-primary-700 mb-4">
                  The ClimateDAO tribe token (CLIMATE) is an ERC20 token that powers the community economy and governance.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateToken}
                    className="btn-primary text-sm"
                  >
                    Create Token
                  </button>
                  <button
                    onClick={handleGetTokenAddress}
                    className="btn-outline text-sm"
                  >
                    Get Token Address
                  </button>
                </div>
                {tokenAddress && (
                  <div className="mt-4 p-3 bg-white rounded border">
                    <p className="text-sm font-medium text-gray-700">Token Address:</p>
                    <p className="text-sm text-gray-600 font-mono break-all">{tokenAddress}</p>
                  </div>
                )}
              </div>

              {userProfile && userProfile.xp > 0 && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Convert Points to Tokens</h4>
                  <p className="text-sm text-green-700 mb-4">
                    You have {userProfile.xp.toLocaleString()} XP. Convert your points to tribe tokens.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleConvertPoints(100)}
                      disabled={userProfile.xp < 100}
                      className="btn-secondary text-sm disabled:opacity-50"
                    >
                      Convert 100 XP
                    </button>
                    <button
                      onClick={() => handleConvertPoints(500)}
                      disabled={userProfile.xp < 500}
                      className="btn-secondary text-sm disabled:opacity-50"
                    >
                      Convert 500 XP
                    </button>
                    <button
                      onClick={() => handleConvertPoints(userProfile.xp)}
                      className="btn-primary text-sm"
                    >
                      Convert All XP
                    </button>
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What is the CLIMATE Token?</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  The CLIMATE token is the governance and utility token for ClimateDAO, enabling community-driven environmental action.
                </p>
                <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Token Features:</h5>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• 🗳️ <strong>Governance Voting:</strong> Vote on environmental proposals</li>
                  <li>• 💰 <strong>Staking Rewards:</strong> Earn rewards for long-term commitment</li>
                  <li>• 🎫 <strong>Token-Gated Access:</strong> Access exclusive events and content</li>
                  <li>• 🔄 <strong>Point Conversion:</strong> Convert Tribes XP to CLIMATE tokens</li>
                  <li>• 💱 <strong>Trading:</strong> Tradeable on decentralized exchanges</li>
                  <li>• 🌱 <strong>Environmental Impact:</strong> Each token represents climate action</li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Troubleshooting Token Creation</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                  If token creation fails, try these steps:
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• Ensure you're connected to XDC Apothem Testnet</li>
                  <li>• Make sure you have XDC tokens for gas fees</li>
                  <li>• Check that you're a member of the ClimateDAO tribe</li>
                  <li>• Verify your wallet has the necessary permissions</li>
                  <li>• Try refreshing the page and reconnecting your wallet</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dev-only Config Tester */}
      {import.meta.env.DEV && showConfigTester && <TribesConfigTester />}
    </div>
  )
}

export default TribesDashboard
