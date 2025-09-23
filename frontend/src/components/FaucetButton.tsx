import { useState, useEffect } from 'react'
import { useAccount, useBalance, useChainId } from 'wagmi'
import { ExternalLink, Coins, Zap, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatEther } from 'viem'
import { xdcTestnet } from 'viem/chains'

interface FaucetButtonProps {
  variant?: 'default' | 'prominent' | 'contextual' | 'hidden'
  showBalance?: boolean
  className?: string
  onSuccess?: () => void
}

const FaucetButton = ({ 
  variant = 'default', 
  showBalance = false, 
  className = '',
  onSuccess 
}: FaucetButtonProps) => {
  const { address } = useAccount()
  const chainId = useChainId()
  const [isLoading, setIsLoading] = useState(false)
  const [hasUsedFaucet, setHasUsedFaucet] = useState(false)
  
  // Get XDC balance for gas estimation
  const { data: xdcBalance, refetch: refetchBalance, isLoading: balanceLoading } = useBalance({
    address: address,
    query: {
      enabled: !!address,
    },
  })

  // Check if user has sufficient XDC for gas (minimum 0.1 XDC)
  const hasMinimumXDC = xdcBalance && parseFloat(formatEther(xdcBalance.value)) >= 0.1
  const isOnCorrectChain = chainId === xdcTestnet.id
  const needsFaucet = !balanceLoading && !hasMinimumXDC && !!address

  // Auto-refresh balance after faucet usage
  useEffect(() => {
    if (hasUsedFaucet) {
      const timer = setTimeout(() => {
        refetchBalance()
        setHasUsedFaucet(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [hasUsedFaucet, refetchBalance])

  const handleFaucetRequest = async () => {
    if (!address) {
      toast.error('Please connect your wallet first')
      return
    }

    setIsLoading(true)
    try {
      // Open XDC faucet in new tab
      const faucetUrl = `https://faucet.apothem.network/`
      window.open(faucetUrl, '_blank')
      
      setHasUsedFaucet(true)
      toast.success('Faucet opened in new tab. Follow the instructions to get testnet XDC tokens.', {
        duration: 5000,
        icon: '🚰',
      })
      
      onSuccess?.()
    } catch (error) {
      console.error('Error opening faucet:', error)
      toast.error('Failed to open faucet')
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show if hidden variant or no address
  if (variant === 'hidden' || !address) return null

  // Don't show if user has sufficient XDC and not in contextual mode
  if (hasMinimumXDC && variant !== 'contextual') return null

  // Show contextual variant only when user needs tokens
  if (variant === 'contextual') {
    if (balanceLoading) return null
    if (!needsFaucet) return null
  }

  const getButtonStyles = () => {
    switch (variant) {
      case 'prominent':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
      case 'contextual':
        return 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-2 border-blue-300'
      default:
        return 'bg-yellow-500 hover:bg-yellow-600 text-white'
    }
  }

  const getIcon = () => {
    if (hasUsedFaucet) return <CheckCircle className="w-4 h-4 animate-pulse" />
    if (needsFaucet) return <AlertCircle className="w-4 h-4" />
    return <Coins className="w-4 h-4" />
  }

  const getText = () => {
    if (isLoading) return 'Opening...'
    if (hasUsedFaucet) return 'Check Your Wallet'
    if (needsFaucet) return 'Get XDC for Gas'
    return 'Get XDC Testnet Tokens'
  }

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {/* Chain warning */}
      {!isOnCorrectChain && address && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-2">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                Wrong Network
              </p>
              <p className="text-amber-700 dark:text-amber-300">
                Please switch to XDC Apothem Testnet to use the faucet.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <button
        onClick={handleFaucetRequest}
        disabled={isLoading || !isOnCorrectChain}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${getButtonStyles()}`}
        title={!isOnCorrectChain ? "Please switch to XDC Apothem Testnet" : needsFaucet ? "You need XDC tokens for gas fees" : "Get testnet XDC tokens"}
      >
        {getIcon()}
        <span className="font-medium">{getText()}</span>
        <ExternalLink className="w-4 h-4" />
      </button>
      
      {showBalance && xdcBalance && (
        <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center space-x-1">
          <Zap className="w-3 h-3" />
          <span>
            Balance: {parseFloat(formatEther(xdcBalance.value)).toFixed(4)} XDC
            {needsFaucet && <span className="text-red-500 ml-1">(Low)</span>}
          </span>
        </div>
      )}
      
      {needsFaucet && (
        <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
          💡 You need at least 0.1 XDC for gas fees
        </div>
      )}
    </div>
  )
}

export default FaucetButton
