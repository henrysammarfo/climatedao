import { Routes, Route } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { lazy, Suspense } from 'react'

import Layout from './components/Layout'
import ConnectWallet from './components/ConnectWallet'
import ErrorBoundary from './components/ErrorBoundary'
import { useDarkMode } from './hooks/useDarkMode'
import LoadingSpinner from './components/LoadingSpinner'

// Lazy load heavy components
const Home = lazy(() => import('./pages/Home'))
const Proposals = lazy(() => import('./pages/Proposals'))
const CreateProposal = lazy(() => import('./pages/CreateProposal'))
const ProposalDetail = lazy(() => import('./pages/ProposalDetail'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const BoardManagement = lazy(() => import('./pages/BoardManagement'))

function App() {
  const { isConnected } = useAccount()
  useDarkMode() // Initialize dark mode

  if (!isConnected) {
    return <ConnectWallet />
  }

  return (
    <ErrorBoundary>
      <Layout>
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
              <Route path="/proposals" element={<ErrorBoundary><Proposals /></ErrorBoundary>} />
              <Route path="/proposals/:id" element={<ErrorBoundary><ProposalDetail /></ErrorBoundary>} />
              <Route path="/create" element={<ErrorBoundary><CreateProposal /></ErrorBoundary>} />
              <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
              <Route path="/board" element={<ErrorBoundary><BoardManagement /></ErrorBoundary>} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Layout>
    </ErrorBoundary>
  )
}

export default App