import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAccount, useDisconnect } from 'wagmi'
import { 
  Home, 
  FileText, 
  Plus, 
  BarChart3, 
  Wallet,
  Leaf,
  Menu,
  X,
  Sun,
  Moon,
  Users
} from 'lucide-react'
import { useState } from 'react'
import { useDarkMode } from '../hooks/useDarkMode'
import { useTokenBalance } from '../hooks/useTokenBalance'
import FaucetButton from './FaucetButton'
import PerformanceMonitor from './PerformanceMonitor'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const { needsFaucet } = useTokenBalance()
  
  // Determine faucet button variant based on user needs
  const getFaucetVariant = () => {
    if (!isConnected) return 'hidden'
    if (needsFaucet()) return 'prominent'
    return 'default'
  }

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Proposals', href: '/proposals', icon: FileText },
    { name: 'Create', href: '/create', icon: Plus },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Board', href: '/board', icon: Users },
  ]

  const isActive = (href: string) => location.pathname === href

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">ClimateDAO</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Wallet Info */}
            <div className="flex items-center space-x-4">
              {/* Enhanced Faucet Button with smart visibility */}
              <FaucetButton 
                variant={getFaucetVariant()}
                showBalance={needsFaucet()}
                className="hidden sm:block"
              />
              
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}
              </button>

              {isConnected && (
                <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Wallet className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
              )}
              
              {isConnected && (
                <button
                  onClick={() => disconnect()}
                  className="btn-outline text-sm"
                >
                  Disconnect
                </button>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Mobile Faucet Button */}
              {isConnected && (
                <div className="px-3 py-2">
                  <FaucetButton 
                    variant={needsFaucet() ? 'prominent' : 'default'}
                    showBalance={needsFaucet()}
                    className="w-full"
                  />
                </div>
              )}
              
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-300">
            <p>&copy; 2024 ClimateDAO. Built on XDC Network with AI-powered impact assessment.</p>
          </div>
        </div>
      </footer>

      {/* Performance Monitor (Development only) */}
      <PerformanceMonitor />
    </div>
  )
}

export default Layout
