import { useState, memo } from 'react'
import { useAccount } from 'wagmi'
import { 
  Users, 
  Shield, 
  Settings, 
  UserPlus, 
  UserMinus,
  Crown,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useDAOStats } from '../hooks/useContracts'
import toast from 'react-hot-toast'

interface BoardMember {
  address: string
  name: string
  role: 'admin' | 'moderator' | 'member'
  joinedAt: string
  isActive: boolean
}

interface ModerationAction {
  id: string
  type: 'proposal_removal' | 'user_ban' | 'content_flag' | 'spam_detection'
  target: string
  reason: string
  moderator: string
  timestamp: string
  status: 'pending' | 'approved' | 'rejected'
}

const BoardManagement = memo(() => {
  const { address } = useAccount()
  const { totalProposals } = useDAOStats()
  
  const [activeTab, setActiveTab] = useState<'members' | 'moderation' | 'settings'>('members')
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([
    {
      address: address || '0x0000000000000000000000000000000000000000',
      name: 'You',
      role: 'admin',
      joinedAt: new Date().toISOString(),
      isActive: true
    }
  ])
  
  const [moderationActions, setModerationActions] = useState<ModerationAction[]>([])
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberAddress, setNewMemberAddress] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<'moderator' | 'member'>('member')

  // Check if current user is admin
  const isAdmin = boardMembers.some(member => 
    member.address.toLowerCase() === address?.toLowerCase() && member.role === 'admin'
  )

  const handleAddMember = () => {
    if (!newMemberAddress || !isAdmin) {
      toast.error('Invalid address or insufficient permissions')
      return
    }

    const newMember: BoardMember = {
      address: newMemberAddress,
      name: `Member ${boardMembers.length}`,
      role: newMemberRole,
      joinedAt: new Date().toISOString(),
      isActive: true
    }

    setBoardMembers(prev => [...prev, newMember])
    setNewMemberAddress('')
    setNewMemberRole('member')
    setShowAddMember(false)
    toast.success('Member added successfully')
  }

  const handleRemoveMember = (memberAddress: string) => {
    if (!isAdmin) {
      toast.error('Insufficient permissions')
      return
    }

    setBoardMembers(prev => prev.filter(member => member.address !== memberAddress))
    toast.success('Member removed successfully')
  }

  const handleModerationAction = (actionId: string, status: 'approved' | 'rejected') => {
    setModerationActions(prev => 
      prev.map(action => 
        action.id === actionId ? { ...action, status } : action
      )
    )
    toast.success(`Action ${status} successfully`)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-600" />
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-600" />
      default:
        return <Users className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Board Management</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Manage board members, moderation actions, and platform settings
        </p>
      </div>

      {/* Access Control */}
      {!isAdmin && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Limited Access
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                You need admin privileges to access board management features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'members', label: 'Board Members', icon: Users },
            { id: 'moderation', label: 'Moderation', icon: Shield },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Board Members</h2>
            {isAdmin && (
              <button
                onClick={() => setShowAddMember(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            )}
          </div>

          {/* Add Member Form */}
          {showAddMember && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Add New Member</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Wallet Address
                  </label>
                  <input
                    type="text"
                    value={newMemberAddress}
                    onChange={(e) => setNewMemberAddress(e.target.value)}
                    placeholder="0x..."
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as any)}
                    className="input"
                  >
                    <option value="member">Member</option>
                    <option value="moderator">Moderator</option>
                  </select>
                </div>
                <div className="flex items-end space-x-2">
                  <button
                    onClick={handleAddMember}
                    className="btn-primary"
                  >
                    Add Member
                  </button>
                  <button
                    onClick={() => setShowAddMember(false)}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {boardMembers.map((member) => (
                    <tr key={member.address}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {member.address.slice(0, 6)}...{member.address.slice(-4)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(member.role)}
                          <span className="text-sm text-gray-900 dark:text-white capitalize">
                            {member.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          member.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {isAdmin && member.role !== 'admin' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleRemoveMember(member.address)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'moderation' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Moderation Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {moderationActions.filter(a => a.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Pending Actions</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-green-600">
                {moderationActions.filter(a => a.status === 'approved').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Approved</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-red-600">
                {moderationActions.filter(a => a.status === 'rejected').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Rejected</div>
            </div>
          </div>

          {moderationActions.length === 0 ? (
            <div className="card text-center py-12">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Moderation Actions
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                All content is currently compliant with community guidelines.
              </p>
            </div>
          ) : (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Target
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Moderator
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {moderationActions.map((action) => (
                      <tr key={action.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {action.type.replace('_', ' ').toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {action.reason}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {action.target.slice(0, 6)}...{action.target.slice(-4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {action.moderator.slice(0, 6)}...{action.moderator.slice(-4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(action.status)}
                            <span className="text-sm text-gray-900 dark:text-white capitalize">
                              {action.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {action.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleModerationAction(action.id, 'approved')}
                                className="text-green-600 hover:text-green-900"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleModerationAction(action.id, 'rejected')}
                                className="text-red-600 hover:text-red-900"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Platform Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Proposal Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum Proposal Amount (USD)
                  </label>
                  <input
                    type="number"
                    defaultValue="1000"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maximum Proposal Amount (USD)
                  </label>
                  <input
                    type="number"
                    defaultValue="100000000"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Voting Duration (days)
                  </label>
                  <input
                    type="number"
                    defaultValue="7"
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Moderation Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Auto-flag suspicious content
                  </span>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Require approval for large proposals
                  </span>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Enable community reporting
                  </span>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Platform Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{Number(totalProposals) || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Proposals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{boardMembers.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Board Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {boardMembers.filter(m => m.role === 'moderator').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Moderators</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {moderationActions.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Moderation Actions</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

BoardManagement.displayName = 'BoardManagement'

export default BoardManagement
