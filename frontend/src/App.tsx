import { Routes, Route } from 'react-router-dom'
import { useAccount } from 'wagmi'

import Layout from './components/Layout'
import Home from './pages/Home'
import Proposals from './pages/Proposals'
import CreateProposal from './pages/CreateProposal'
import ProposalDetail from './pages/ProposalDetail'
import Dashboard from './pages/Dashboard'
import ConnectWallet from './components/ConnectWallet'
import { useDarkMode } from './hooks/useDarkMode'

function App() {
  const { isConnected } = useAccount()
  useDarkMode() // Initialize dark mode

  if (!isConnected) {
    return <ConnectWallet />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/proposals" element={<Proposals />} />
        <Route path="/proposals/:id" element={<ProposalDetail />} />
        <Route path="/create" element={<CreateProposal />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Layout>
  )
}

export default App