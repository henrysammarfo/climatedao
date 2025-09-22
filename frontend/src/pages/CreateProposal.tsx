import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useSwitchChain } from 'wagmi'
import { ArrowLeft, Upload, Sparkles, Brain, TrendingUp, Users, DollarSign, AlertTriangle } from 'lucide-react'
import { useAI } from '../hooks/useAI'
import { useCreateProposal } from '../hooks/useContracts'
import { useTribes } from '../hooks/useTribes'
import { ProposalData } from '../services/aiService'
import LoadingSpinner from '../components/LoadingSpinner'
import { validateProposalData, sanitizeInput } from '../utils/security'
import toast from 'react-hot-toast'

const CreateProposal = () => {
  const navigate = useNavigate()
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const { isAnalyzing, analysis, analyzeProposal } = useAI()
  const { createProposal, isPending: isCreating } = useCreateProposal()
  const { trackGovernanceAction } = useTribes()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: '',
    requestedAmount: '',
    duration: '',
    website: '',
  })
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const categories = [
    'Renewable Energy',
    'Carbon Capture',
    'Reforestation',
    'Ocean Cleanup',
    'Sustainable Agriculture',
    'Climate Education',
    'Other'
  ]

  // Check if user is on correct network
  const isCorrectNetwork = chainId === 51 // XDC Apothem Testnet

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: 51 })
      toast.success('Switched to XDC Apothem Testnet')
    } catch (error) {
      console.error('Failed to switch network:', error)
      toast.error('Failed to switch network. Please switch manually to XDC Apothem Testnet.')
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/')
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      return isValidType && isValidSize
    })

    if (validFiles.length !== files.length) {
      toast.error('Some files were rejected. Only images under 10MB are allowed.')
    }

    setUploadedFiles(prev => [...prev, ...validFiles])
    toast.success(`${validFiles.length} file(s) uploaded successfully`)
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!address) {
      toast.error('Please connect your wallet first')
      return
    }
    
    // Validate and sanitize input
    const sanitizedData = {
      title: sanitizeInput(formData.title),
      description: sanitizeInput(formData.description),
      location: sanitizeInput(formData.location),
      category: formData.category,
      requestedAmount: parseFloat(formData.requestedAmount) || 0,
      duration: parseInt(formData.duration) || 0,
      website: formData.website
    }

    const validation = validateProposalData(sanitizedData)
    if (!validation.isValid) {
      toast.error('Please fix the following errors:\n' + validation.errors.join('\n'))
      return
    }

    try {
      // Create proposal data for contract
      const proposalData = {
        title: sanitizedData.title,
        description: sanitizedData.description,
        location: sanitizedData.location,
        category: categories.indexOf(sanitizedData.category),
        requestedAmount: BigInt(Math.floor(sanitizedData.requestedAmount * 1e18)), // Convert to wei
        duration: BigInt(sanitizedData.duration * 24 * 60 * 60), // Convert days to seconds
        website: sanitizedData.website,
        images: [] // TODO: Handle image uploads
      }

      // Create proposal on blockchain
      await createProposal(address, proposalData)
      
      // Track governance action in Tribes
      if (address) {
        await trackGovernanceAction('proposal', undefined)
      }
      
      navigate('/proposals')
    } catch (error) {
      console.error('Failed to create proposal:', error)
      toast.error('Failed to create proposal')
    }
  }

  const handleAnalyze = async () => {
    if (!formData.title || !formData.description || !formData.category) {
      alert('Please fill in title, description, and category before analyzing')
      return
    }

    const proposalData: ProposalData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      location: formData.location,
      requestedAmount: parseFloat(formData.requestedAmount) || 0,
      duration: parseInt(formData.duration) || 0
    }

    await analyzeProposal(proposalData)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Wallet Connection Warning */}
      {!address && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Wallet Not Connected
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Please connect your wallet to create proposals and participate in governance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Network Warning */}
      {address && !isCorrectNetwork && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Wrong Network Detected
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                You're connected to {chainId === 1 ? 'Ethereum Mainnet' : `Network ${chainId}`}. 
                Please switch to XDC Apothem Testnet to create proposals.
              </p>
            </div>
            <button
              onClick={handleSwitchNetwork}
              className="btn-primary text-sm"
            >
              Switch Network
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Proposal</h1>
          <p className="text-gray-600 mt-1">
            Submit your environmental project for community funding and governance
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Project Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="label">Project Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter a clear, descriptive title for your project"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Provide a detailed description of your project, including goals, methodology, and expected outcomes"
                    className="input h-32 resize-none"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Location *</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Kenya, East Africa"
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="input"
                      required
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

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Requested Amount (USD) *</label>
                    <input
                      type="number"
                      name="requestedAmount"
                      value={formData.requestedAmount}
                      onChange={handleInputChange}
                      placeholder="e.g., 2500000"
                      className="input"
                      min="1000"
                      max="100000000"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Project Duration (days) *</label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      placeholder="e.g., 365"
                      className="input"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Website (optional)</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://your-project-website.com"
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Project Images</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Upload project images</p>
                <p className="text-sm text-gray-500">PNG, JPG up to 10MB each</p>
                <button 
                  type="button" 
                  className="btn-outline mt-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              
              {/* Display uploaded files */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !address || !isCorrectNetwork}
                className="btn-outline flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Brain className="w-4 h-4 mr-2" />
                )}
                {isAnalyzing ? 'Analyzing...' : 'Analyze Impact'}
              </button>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isCreating || !address || !isCorrectNetwork}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Creating Proposal...
                    </>
                  ) : (
                    'Submit Proposal'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Analysis Results */}
          {analysis && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-primary-600" />
                AI Analysis Results
              </h3>
              
              <div className="space-y-4">
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <div className="text-3xl font-bold text-primary-600 mb-1">
                    {analysis.impactScore}/100
                  </div>
                  <div className="text-sm text-gray-600">Impact Score</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Confidence: {analysis.confidence}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <div className="text-lg font-semibold text-green-600">
                      {analysis.co2Reduction.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Tons CO2/Year</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                    <div className="text-lg font-semibold text-blue-600">
                      {analysis.energyGeneration.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">MWh/Year</div>
                  </div>
                </div>

                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                  <div className="text-lg font-semibold text-purple-600">
                    {analysis.jobsCreated}
                  </div>
                  <div className="text-xs text-gray-600">Jobs Created</div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Analysis Reasoning:</h4>
                  <p className="text-sm text-gray-600">{analysis.reasoning}</p>
                </div>

                {analysis.risks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Identified Risks:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {analysis.risks.map((risk, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-red-500 mr-2">•</span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Recommendations:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">AI Impact Assessment</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Sparkles className="w-4 h-4 text-primary-600" />
                <span>Automatic impact scoring</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Sparkles className="w-4 h-4 text-primary-600" />
                <span>CO2 reduction analysis</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Sparkles className="w-4 h-4 text-primary-600" />
                <span>Energy generation estimates</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Sparkles className="w-4 h-4 text-primary-600" />
                <span>Job creation projections</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Proposal Guidelines</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <strong>Minimum Amount:</strong> $1,000
              </div>
              <div>
                <strong>Maximum Amount:</strong> $100,000,000
              </div>
              <div>
                <strong>Voting Duration:</strong> 7 days
              </div>
              <div>
                <strong>Quorum Required:</strong> 1,000 tokens
              </div>
              <div>
                <strong>Majority Threshold:</strong> 51%
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Tips for Success</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Be specific about project goals and outcomes</li>
              <li>• Include detailed budget breakdown</li>
              <li>• Provide clear timeline and milestones</li>
              <li>• Show community support and partnerships</li>
              <li>• Include relevant images and documentation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateProposal
