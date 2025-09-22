import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ExternalLink, Coins } from 'lucide-react'
import toast from 'react-hot-toast'

const FaucetButton = () => {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)

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
      
      toast.success('Faucet opened in new tab. Follow the instructions to get testnet XDC tokens.')
    } catch (error) {
      console.error('Error opening faucet:', error)
      toast.error('Failed to open faucet')
    } finally {
      setIsLoading(false)
    }
  }

  if (!address) return null

  return (
    <button
      onClick={handleFaucetRequest}
      disabled={isLoading}
      className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Coins className="w-4 h-4" />
      <span>{isLoading ? 'Opening...' : 'Get XDC Testnet Tokens'}</span>
      <ExternalLink className="w-4 h-4" />
    </button>
  )
}

export default FaucetButton
