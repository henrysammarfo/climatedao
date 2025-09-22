import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Sparkles, Brain, TrendingUp, Users, DollarSign } from 'lucide-react'
import { useAI } from '../hooks/useAI'
import { ProposalData } from '../services/aiService'
import LoadingSpinner from '../components/LoadingSpinner'
import { validateProposalData, sanitizeInput } from '../utils/security'

const CreateProposal = () => {
  const navigate = useNavigate()
  const { isAnalyzing, analysis, analyzeProposal } = useAI()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: '',
    requestedAmount: '',
    duration: '',
    website: '',
  })

  const categories = [
    'Renewable Energy',
    'Carbon Capture',
    'Reforestation',
    'Ocean Cleanup',
    'Sustainable Agriculture',
    'Climate Education',
    'Other'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
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
      alert('Please fix the following errors:\n' + validation.errors.join('\n'))
      return
    }

    // TODO: Implement proposal creation logic
    console.log('Creating proposal:', sanitizedData)
    navigate('/proposals')
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
                <button type="button" className="btn-outline mt-4">
                  Choose Files
                </button>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="btn-outline flex items-center"
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
                <button type="submit" className="btn-primary">
                  Submit Proposal
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
