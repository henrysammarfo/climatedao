import { useConnect } from 'wagmi'
import { Leaf, Globe, Zap, Shield } from 'lucide-react'

const ConnectWallet = () => {
  const { connectors, connect } = useConnect()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-glow">
              <Leaf className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gradient mb-4">
            ClimateDAO
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered decentralized governance for environmental projects. 
            Fund, vote, and track climate initiatives with transparent, 
            community-driven decision making.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="card text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Global Impact</h3>
            <p className="text-gray-600">
              Support environmental projects worldwide with transparent, 
              blockchain-based funding and governance.
            </p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI-Powered</h3>
            <p className="text-gray-600">
              Advanced AI analysis provides objective impact assessment 
              and scoring for all environmental proposals.
            </p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Decentralized</h3>
            <p className="text-gray-600">
              Community-driven governance ensures fair, transparent 
              decision making for all climate initiatives.
            </p>
          </div>
        </div>

        <div className="text-center">
          <div className="card max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Connect your wallet to start participating in climate governance 
              and funding environmental projects.
            </p>
            <div className="space-y-3">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  className="w-full btn-primary"
                >
                  Connect {connector.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Built on XDC Network • Powered by AI • Governed by Community</p>
        </div>
      </div>
    </div>
  )
}

export default ConnectWallet