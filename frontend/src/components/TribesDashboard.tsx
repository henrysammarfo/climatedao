import { useState } from 'react'
import { 
  Trophy, 
  Calendar, 
  Users, 
  Award, 
  Star,
  Crown,
  Zap,
  Target,
  Clock
} from 'lucide-react'
import { useTribes } from '../hooks/useTribes'
import { Badge } from '../services/tribesService'

const TribesDashboard = () => {
  const { 
    userProfile, 
    events, 
    leaderboard, 
    isLoading, 
    joinEvent
  } = useTribes()
  const [selectedTab, setSelectedTab] = useState<'profile' | 'events' | 'leaderboard'>('profile')

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

  if (isLoading) {
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
          <div className="flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-primary-600" />
            <span className="text-sm font-medium text-gray-600">Level {userProfile?.level || 1}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'profile', label: 'Profile', icon: Users },
            { id: 'events', label: 'Events', icon: Calendar },
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
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
                  <p className="text-sm text-gray-500">Joined {userProfile.joinedAt.toLocaleDateString()}</p>
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
    </div>
  )
}

export default TribesDashboard
