import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { ArrowLeft, Sparkles, AlertTriangle, XCircle } from 'lucide-react'

const CreateProposalSimple = () => {
  const navigate = useNavigate()
  const { address, chainId } = useAccount()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: '',
    requestedAmount: '',
    duration: '',
    website: ''
  })

  const categories = [
    'Renewable Energy',
    'Carbon Capture',
    'Reforestation',
    'Clean Transportation',
    'Energy Efficiency',
    'Waste Management',
    'Water Conservation',
    'Other'
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!address) {
      alert('Please connect your wallet')
      return
    }
    
    if (!formData.title || !formData.description) {
      alert('Please fill in all required fields')
      return
    }
    
    try {
      // Simulate proposal creation
      console.log('Creating proposal:', formData)
      alert('Proposal created successfully!')
      navigate('/proposals')
    } catch (error) {
      console.error('Failed to create proposal:', error)
      alert('Failed to create proposal')
    }
  }

  const isCorrectNetwork = chainId === 51 // XDC Apothem Testnet

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/proposals')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Proposal</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Submit a new climate action proposal for community voting
          </p>
        </div>
      </div>

      {/* Network Warning */}
      {address && !isCorrectNetwork && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">Wrong Network</span>
          </div>
          <p className="text-yellow-700 mt-1">
            Please switch to XDC Apothem Testnet to create proposals.
          </p>
        </div>
      )}

      {/* Connection Status */}
      {!address && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">Wallet Not Connected</span>
          </div>
          <p className="text-red-700 mt-1">
            Please connect your wallet to create proposals.
          </p>
        </div>
      )}

      {/* Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Proposal Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="input"
                placeholder="Enter a clear, descriptive title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="input min-h-[120px]"
                placeholder="Describe your climate action proposal in detail..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="input"
                  placeholder="City, Country"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="input"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Project Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Requested Amount (XDC)
                </label>
                <input
                  type="number"
                  value={formData.requestedAmount}
                  onChange={(e) => handleInputChange('requestedAmount', e.target.value)}
                  className="input"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (days)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  className="input"
                  placeholder="30"
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Website (optional)
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="input"
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/proposals')}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={!address || !isCorrectNetwork}
            >
              <Sparkles className="w-4 h-4" />
              Create Proposal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateProposalSimple
