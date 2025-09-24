import { Routes, Route } from 'react-router-dom'
import { useAccount } from 'wagmi'

import Layout from './components/Layout'
import Home from './pages/Home'
import Proposals from './pages/Proposals'
import CreateProposal from './pages/CreateProposal'
import ProposalDetail from './pages/ProposalDetail'
import Dashboard from './pages/Dashboard'
import BoardManagement from './pages/BoardManagement'
import ConnectWallet from './components/ConnectWallet'
import ErrorBoundary from './components/ErrorBoundary'
import { useDarkMode } from './hooks/useDarkMode'

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
          <Routes>
            <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
            <Route path="/proposals" element={<ErrorBoundary><Proposals /></ErrorBoundary>} />
            <Route path="/proposals/:id" element={<ErrorBoundary><ProposalDetail /></ErrorBoundary>} />
            <Route path="/create" element={<ErrorBoundary><CreateProposal /></ErrorBoundary>} />
            <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
            <Route path="/board" element={<ErrorBoundary><BoardManagement /></ErrorBoundary>} />
          </Routes>
        </ErrorBoundary>
      </Layout>
    </ErrorBoundary>
  )
}

export default App