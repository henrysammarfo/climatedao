import { Link } from 'react-router-dom'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Leaf,
  ArrowRight,
  Globe,
  Zap
} from 'lucide-react'

const Home = () => {
  const stats = [
    { label: 'Active Proposals', value: '12', icon: TrendingUp },
    { label: 'Community Members', value: '2,847', icon: Users },
    { label: 'Funds Raised', value: '$1.2M', icon: DollarSign },
    { label: 'Projects Funded', value: '8', icon: Leaf },
  ]

  const features = [
    {
      title: 'AI-Powered Impact Assessment',
      description: 'Advanced AI analyzes environmental proposals to provide objective impact scores and recommendations.',
      icon: Zap,
    },
    {
      title: 'Transparent Governance',
      description: 'Community-driven voting ensures fair and transparent decision making for all climate initiatives.',
      icon: Users,
    },
    {
      title: 'Global Reach',
      description: 'Support environmental projects worldwide with blockchain-based funding and tracking.',
      icon: Globe,
    },
  ]

  const recentProposals = [
    {
      id: 1,
      title: 'Solar Farm in Kenya',
      description: 'Building a 50MW solar farm to provide clean energy to 100,000 homes.',
      category: 'Renewable Energy',
      requestedAmount: '$2.5M',
      votes: 1247,
      status: 'Active',
      impactScore: 92,
    },
    {
      id: 2,
      title: 'Ocean Plastic Cleanup',
      description: 'Deploying autonomous drones to clean plastic waste from the Pacific Ocean.',
      category: 'Ocean Cleanup',
      requestedAmount: '$1.8M',
      votes: 892,
      status: 'Active',
      impactScore: 88,
    },
    {
      id: 3,
      title: 'Reforestation in Amazon',
      description: 'Planting 1 million trees to restore degraded areas of the Amazon rainforest.',
      category: 'Reforestation',
      requestedAmount: '$3.2M',
      votes: 2156,
      status: 'Passed',
      impactScore: 95,
    },
  ]

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gradient mb-6">
          Climate Action Through
          <br />
          Decentralized Governance
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Join the global community funding and governing environmental projects 
          with AI-powered impact assessment and transparent blockchain technology.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/proposals" className="btn-primary text-lg px-8 py-3">
            View Proposals
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <Link to="/create" className="btn-outline text-lg px-8 py-3">
            Create Proposal
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Icon className="w-6 h-6 text-primary-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          )
        })}
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <div key={feature.title} className="card">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          )
        })}
      </div>

      {/* Recent Proposals */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Recent Proposals</h2>
          <Link to="/proposals" className="btn-outline">
            View All
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {recentProposals.map((proposal) => (
            <div key={proposal.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                  {proposal.category}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  proposal.status === 'Active' 
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {proposal.status}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold mb-2">{proposal.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{proposal.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Requested:</span>
                  <span className="font-medium">{proposal.requestedAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Votes:</span>
                  <span className="font-medium">{proposal.votes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Impact Score:</span>
                  <span className="font-medium text-primary-600">{proposal.impactScore}/100</span>
                </div>
              </div>
              
              <Link 
                to={`/proposals/${proposal.id}`}
                className="btn-primary w-full text-center"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 md:p-12 text-center text-white">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Make a Difference?
        </h2>
        <p className="text-xl mb-8 opacity-90">
          Join thousands of community members funding and governing environmental projects worldwide.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/create" className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors">
            Submit Your Project
          </Link>
          <Link to="/dashboard" className="border border-white text-white hover:bg-white hover:text-primary-600 font-medium py-3 px-8 rounded-lg transition-colors">
            View Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home
