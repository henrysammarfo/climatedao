import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { 
  Coins, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  X,
  Info,
  ExternalLink,
  Sparkles,
  AlertTriangle
} from 'lucide-react'
import { useTokenBalance } from '../hooks/useTokenBalance'
import { useClaimInitialTokens, useClaimDailyTokens, useClaimStatus } from '../hooks/useContracts'
import FaucetButton from './FaucetButton'
import toast from 'react-hot-toast'
import { xdcTestnet } from 'viem/chains'

interface ContextualFaucetProps {
  mode?: 'inline' | 'modal' | 'banner'
  action?: 'vote' | 'createProposal' | 'stake' | 'donate'
  onComplete?: () => void
  onClose?: () => void
  className?: string
}

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
  action?: () => void
  actionText?: string
}

const ContextualFaucet = ({ 
  mode = 'inline', 
  action = 'vote',
  onComplete,
  onClose,
  className = ''
}: ContextualFaucetProps) => {
  const { address } = useAccount()
  const chainId = useChainId()
  const { 
    getBalanceStatus, 
    getActionRequirements, 
    refreshBalances,
    isLoaded 
  } = useTokenBalance()
  const { claimInitialTokens, isPending: isClaimingInitial } = useClaimInitialTokens()
  const { claimDailyTokens, isPending: isClaimingDaily } = useClaimDailyTokens()
  const { canClaim } = useClaimStatus()
  
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showModal, setShowModal] = useState(mode === 'modal')

  const balanceStatus = getBalanceStatus()
  const requirements = getActionRequirements(action)
  const isOnCorrectChain = chainId === xdcTestnet.id

  // Create onboarding steps based on what's needed
  const getOnboardingSteps = (): OnboardingStep[] => {
    const steps: OnboardingStep[] = []

    if (!address) {
      steps.push({
        id: 'connect',
        title: 'Connect Your Wallet',
        description: 'Connect your wallet to start participating in ClimateDAO',
        icon: <Zap className="w-6 h-6" />,
        completed: false,
        actionText: 'Connect Wallet'
      })
    }

    if (!isOnCorrectChain && address) {
      steps.push({
        id: 'switchChain',
        title: 'Switch to XDC Apothem Testnet',
        description: 'You need to be on the XDC Apothem Testnet to use ClimateDAO',
        icon: <AlertTriangle className="w-6 h-6" />,
        completed: false,
        actionText: 'Switch Network'
      })
    }

    if (balanceStatus.needsFaucet) {
      steps.push({
        id: 'xdc',
        title: 'Get XDC Testnet Tokens',
        description: 'You need XDC tokens for gas fees to interact with the blockchain',
        icon: <Coins className="w-6 h-6" />,
        completed: false,
        action: () => {
          const faucetUrl = `https://faucet.apothem.network/`
          window.open(faucetUrl, '_blank')
          toast.success('Faucet opened in new tab. Follow the instructions to get XDC tokens.')
        },
        actionText: 'Get XDC Tokens'
      })
    }

    if (balanceStatus.needsClimateTokens) {
      steps.push({
        id: 'climate',
        title: 'Claim CLIMATE Tokens',
        description: 'Claim your CLIMATE tokens to participate in voting and governance',
        icon: <Sparkles className="w-6 h-6" />,
        completed: false,
        action: async () => {
          try {
            await claimInitialTokens()
            toast.success('Initial CLIMATE tokens claimed successfully!')
            setTimeout(() => refreshBalances(), 2000)
          } catch (error) {
            console.error('Failed to claim initial tokens:', error)
          }
        },
        actionText: isClaimingInitial ? 'Claiming...' : 'Claim CLIMATE Tokens'
      })
    }

    return steps
  }

  const allStepsCompleted = steps.length === 0 || steps.every(step => step.completed)

  // Check if user can perform the action
  const canPerformAction = () => {
    switch (action) {
      case 'vote':
        return balanceStatus.hasVotingTokens && balanceStatus.hasMinimumXDC
      case 'createProposal':
        return balanceStatus.hasMinimumXDC
      case 'stake':
        return balanceStatus.hasVotingTokens && balanceStatus.hasMinimumXDC
      case 'donate':
        return balanceStatus.hasMinimumXDC
      default:
        return false
    }
  }

  // Initialize steps when component mounts or dependencies change
  useEffect(() => {
    const newSteps = getOnboardingSteps()
    setSteps(newSteps)
  }, [address, balanceStatus, action])

  // Update step completion status and auto-advance current step
  useEffect(() => {
    if (!isLoaded || steps.length === 0) return

    const updatedSteps = steps.map(step => {
      switch (step.id) {
        case 'connect':
          return { ...step, completed: !!address }
        case 'switchChain':
          return { ...step, completed: isOnCorrectChain }
        case 'xdc':
          return { ...step, completed: balanceStatus.hasMinimumXDC }
        case 'climate':
          return { ...step, completed: balanceStatus.hasVotingTokens }
        default:
          return step
      }
    })

    setSteps(updatedSteps)

    // Auto-advance to next incomplete step
    const nextIncompleteStep = updatedSteps.findIndex(step => !step.completed)
    if (nextIncompleteStep !== -1) {
      setCurrentStep(nextIncompleteStep)
    } else {
      // All steps completed
      setCurrentStep(updatedSteps.length)
      if (!isCompleted) {
        setIsCompleted(true)
        onComplete?.()
      }
    }
  }, [isLoaded, address, balanceStatus, steps, isCompleted, onComplete])

  // Auto-refresh balances periodically
  useEffect(() => {
    if (!isLoaded || allStepsCompleted) return

    const interval = setInterval(() => {
      refreshBalances()
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [isLoaded, allStepsCompleted, refreshBalances])

  const handleClose = () => {
    if (mode === 'modal') {
      setShowModal(false)
    }
    onClose?.()
  }

  const getActionDescription = () => {
    const descriptions = {
      vote: 'To vote on proposals, you need both XDC for gas fees and CLIMATE tokens for voting power.',
      createProposal: 'To create a proposal, you need XDC tokens to pay for gas fees.',
      stake: 'To stake tokens, you need both XDC for gas fees and CLIMATE tokens to stake.',
      donate: 'To donate funds, you need XDC tokens to pay for gas fees.'
    }
    return descriptions[action] || descriptions.vote
  }

  const getActionTitle = () => {
    const titles = {
      vote: 'Ready to Vote',
      createProposal: 'Ready to Create Proposal',
      stake: 'Ready to Stake',
      donate: 'Ready to Donate'
    }
    return titles[action] || titles.vote
  }

  // Don't show if user can already perform the action
  if (canPerformAction() && mode !== 'modal') {
    return null
  }

  const renderContent = () => (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Coins className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {isCompleted ? getActionTitle() : 'Get Started with ClimateDAO'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isCompleted ? 'You\'re all set!' : getActionDescription()}
            </p>
          </div>
        </div>
        {mode === 'modal' && (
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {isCompleted ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              You're Ready to {action === 'createProposal' ? 'Create a Proposal' : action}!
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You have all the tokens needed to participate in ClimateDAO.
            </p>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress indicator */}
            {steps.length > 1 && (
              <div className="flex items-center space-x-2 mb-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.completed 
                        ? 'bg-green-500 text-white' 
                        : index === currentStep 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {step.completed ? <CheckCircle className="w-4 h-4" /> : index + 1}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-8 h-0.5 ${
                        step.completed ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Current step */}
            {steps.length > 0 && currentStep < steps.length && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    {steps[currentStep]?.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {steps[currentStep]?.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {steps[currentStep]?.description}
                    </p>
                    {steps[currentStep]?.action && (
                      <button
                        onClick={steps[currentStep]?.action}
                        disabled={isClaimingInitial || isClaimingDaily}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <span>{steps[currentStep]?.actionText}</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Chain warning */}
            {!isOnCorrectChain && address && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                      Wrong Network
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Please switch to XDC Apothem Testnet to use ClimateDAO features.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Missing requirements */}
            {requirements.missingRequirements.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                      Missing Requirements
                    </h4>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                      {requirements.missingRequirements.map((req, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <span>•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <FaucetButton 
                variant="contextual" 
                showBalance={true}
                onSuccess={() => refreshBalances()}
                className="flex-1"
              />
              {balanceStatus.needsClimateTokens && (
                <button
                  onClick={async () => {
                    try {
                      if (canClaim) {
                        await claimDailyTokens()
                        toast.success('Daily CLIMATE tokens claimed successfully!')
                      } else {
                        await claimInitialTokens()
                        toast.success('Initial CLIMATE tokens claimed successfully!')
                      }
                      setTimeout(() => refreshBalances(), 2000)
                    } catch (error) {
                      console.error('Failed to claim tokens:', error)
                    }
                  }}
                  disabled={isClaimingInitial || isClaimingDaily}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{(isClaimingInitial || isClaimingDaily) ? 'Claiming...' : 'Claim CLIMATE'}</span>
                </button>
              )}
            </div>

            {/* Help text */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Need help?</p>
                  <p>
                    XDC tokens are used for gas fees (like Ethereum's ETH). 
                    CLIMATE tokens give you voting power in the DAO. 
                    Both are free on the testnet!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  if (mode === 'modal' && showModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-md">
          {renderContent()}
        </div>
      </div>
    )
  }

  if (mode === 'banner') {
    return (
      <div className="w-full mb-4">
        {renderContent()}
      </div>
    )
  }

  return renderContent()
}

export default ContextualFaucet
