# 🌍 ClimateDAO

<div align="center">

**An AI-Powered Decentralized Autonomous Organization for Environmental Funding**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-View%20App-green?style=for-the-badge&logo=vercel)](https://climatedao.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/henrysammarfo/climatedao)
[![XDC Network](https://img.shields.io/badge/XDC%20Network-Apothem%20Testnet-blue?style=for-the-badge)](https://explorer.apothem.network)
[![Tribes OS](https://img.shields.io/badge/Tribes%20OS-Integrated-purple?style=for-the-badge)](https://tribessdk.vercel.app)

*Built for the XDC × Tribes Global Hackathon*

</div>

## 📋 Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Live Demo](#live-demo)
- [Smart Contracts](#smart-contracts)
- [Quick Start](#quick-start)
- [Installation Guide](#installation-guide)
- [Environment Setup](#environment-setup)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [Hackathon Submission](#hackathon-submission)
- [License](#license)

## 🎯 Overview

ClimateDAO revolutionizes environmental funding by combining **blockchain technology**, **AI-powered impact assessment**, and **community governance** to create a transparent, efficient platform for funding climate initiatives. Built on XDC Network with Tribes OS integration, it enables global participation in climate action through decentralized decision-making.

### 🌍 The Problem

Current environmental funding suffers from critical issues:

- **🔒 Lack of Transparency**: Traditional funding mechanisms lack transparency and community input
- **👑 Centralized Decision Making**: Funding decisions are made by a few without community participation
- **📊 No Objective Assessment**: Limited analysis of environmental project effectiveness and impact
- **🌐 Geographic Barriers**: Global communities can't easily participate in local climate initiatives
- **⏰ Slow Processes**: Traditional funding takes months or years to approve and distribute
- **💰 High Overhead**: Significant administrative costs reduce actual funding for projects

### ✨ The Solution

ClimateDAO creates a decentralized platform where:

- **🤖 AI-Powered Analysis**: Hugging Face Mistral-7B provides objective impact scoring and feasibility assessment
- **🗳️ Community Governance**: CLIMATE token holders vote on proposals and fund distribution
- **🔗 Transparent Funding**: All transactions are on-chain and verifiable on XDC Explorer
- **🌍 Global Participation**: Anyone can propose, vote on, and fund environmental projects
- **📈 Real Impact Tracking**: Monitor actual environmental outcomes of funded projects
- **⚡ Fast Execution**: Automated smart contracts enable rapid fund distribution
- **💎 Low Fees**: Minimal platform fees maximize funding for environmental projects

## 🚀 Key Features

### 🤖 AI-Powered Impact Assessment
- **Real-time Analysis**: Hugging Face Mistral-7B model provides instant proposal evaluation
- **Impact Scoring**: 0-100 scale for environmental impact and feasibility
- **CO2 Reduction Estimates**: Quantified environmental benefits
- **Job Creation Projections**: Economic impact assessment
- **Energy Generation Estimates**: Renewable energy potential analysis

### 🗳️ Decentralized Governance
- **Community Voting**: CLIMATE token holders vote on all proposals
- **Transparent Process**: All votes and decisions recorded on-chain
- **Quorum Requirements**: Ensures meaningful community participation
- **Proposal Categories**: Renewable Energy, Carbon Capture, Reforestation, Ocean Cleanup, Sustainable Agriculture, Climate Education

### 💰 Transparent Funding
- **Blockchain-Based**: All donations and distributions tracked on XDC Network
- **Smart Contract Execution**: Automated fund distribution to approved projects
- **Real-time Tracking**: Monitor funding progress and project milestones
- **Low Platform Fees**: Maximum funding goes to environmental projects

### 🏆 Tribes OS Integration
- **XP Rewards**: Earn experience points for participation and contributions
- **Achievement Badges**: Unlock badges for milestones and achievements
- **Community Events**: Participate in environmental events and initiatives
- **Token-Gated Spaces**: Access exclusive content and discussions
- **Leaderboards**: Compete with other community members

### 📊 Real-time Analytics
- **Impact Dashboard**: Track environmental outcomes of funded projects
- **Performance Metrics**: Monitor project success rates and ROI
- **Community Statistics**: View participation and engagement metrics
- **Funding Analytics**: Analyze funding patterns and trends

## 🛠️ Tech Stack

### Blockchain & Smart Contracts
- **🌐 Network**: XDC Network (Apothem Testnet)
- **📜 Language**: Solidity 0.8.24
- **🔧 Framework**: Hardhat 2.22.10
- **🧪 Testing**: Chai, Mocha with 74.42% coverage
- **📦 Libraries**: OpenZeppelin Contracts 5.0.2

### Frontend Development
- **⚛️ Framework**: React 18.3.1 with TypeScript 5.5.4
- **⚡ Build Tool**: Vite 5.4.3
- **🎨 Styling**: Tailwind CSS 3.4.13
- **📱 UI Components**: Custom components with Framer Motion
- **🔗 State Management**: React Query for server state

### Web3 Integration
- **🔌 Wallet Connection**: Wagmi 2.12.8
- **⛓️ Blockchain Interface**: viem 2.21.1
- **🌐 Network**: XDC Apothem Testnet (Chain ID: 51)
- **💼 Wallet Support**: MetaMask, WalletConnect, Coinbase Wallet

### AI & External Services
- **🤖 AI Model**: Hugging Face Mistral-7B-Instruct-v0.3
- **🔗 API**: Hugging Face Inference API
- **📊 Analysis**: Real-time proposal impact assessment
- **🏆 Community**: Tribes SDK (@wasserstoff/tribes-sdk)

### Deployment & Infrastructure
- **🚀 Frontend**: Vercel (Production)
- **📦 Package Manager**: npm with workspaces
- **🔒 Security**: Input validation, sanitization, error boundaries
- **📈 Monitoring**: Real-time error tracking and performance metrics

## 📁 Project Structure

```
climatedao/
├── 📁 contracts/                    # Smart Contracts
│   ├── 📁 contracts/               # Solidity contracts
│   │   ├── ClimateDAO.sol         # Main DAO contract
│   │   ├── ClimateToken.sol       # ERC20 token contract
│   │   └── Proposal.sol           # Individual proposal contract
│   ├── 📁 test/                   # Test files
│   │   └── ClimateDAO.test.ts     # Comprehensive test suite
│   ├── 📁 scripts/                # Deployment scripts
│   │   └── deploy.ts              # Contract deployment
│   └── 📄 hardhat.config.ts       # Hardhat configuration
├── 📁 frontend/                    # React Frontend
│   ├── 📁 src/
│   │   ├── 📁 components/         # React components
│   │   ├── 📁 hooks/              # Custom React hooks
│   │   ├── 📁 pages/              # Application pages
│   │   ├── 📁 services/           # API and service layers
│   │   ├── 📁 utils/              # Utility functions
│   │   └── 📁 styles/             # CSS and styling
│   ├── 📄 package.json            # Frontend dependencies
│   └── 📄 vite.config.ts          # Vite configuration
├── 📁 docs/                        # Documentation
│   ├── 📄 video-script.md         # Demo video script
│   ├── 📄 social-media-posts.md   # Promotional content
│   └── 📄 tribes-proposal.md      # Tribes community proposal
├── 📄 package.json                 # Root package.json
└── 📄 README.md                    # This file
```

## 🎬 Live Demo

### 🌐 Application Demo
**Live Application**: [https://climatedao.vercel.app](https://climatedao.vercel.app)

### 📹 Demo Video
**Demo Video**: [🎥 Watch the 2-3 minute demo video here](https://your-demo-video-link.com)

*Replace the above link with your actual demo video URL*

### 🚀 Quick Demo Flow
1. **Connect Wallet**: Connect your XDC wallet to Apothem Testnet
2. **Create Proposal**: Submit an environmental project proposal
3. **AI Analysis**: Get real-time impact assessment from Hugging Face AI
4. **Vote & Fund**: Participate in community governance and funding
5. **Track Impact**: Monitor real environmental outcomes

## ⚡ Quick Start

### 📋 Prerequisites
- **Node.js 18+** and npm/yarn
- **Git** for version control
- **XDC wallet** (MetaMask with XDC Network configured)
- **Hugging Face API key** (for AI features)
- **XDC testnet tokens** (from faucet)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/henrysammarfo/climatedao.git
   cd climatedao
   ```

2. **Install Dependencies**
   ```bash
   # Install all dependencies (contracts + frontend)
   npm run install:all
   
   # Or install separately:
   cd contracts && npm install
   cd ../frontend && npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp contracts/.env.example contracts/.env
   cp frontend/.env.example frontend/.env
   
   # Edit the .env files with your keys
   ```

4. **Compile Contracts**
   ```bash
   npm run compile
   ```

5. **Run Tests**
   ```bash
   npm test
   # Coverage: npm run coverage
   ```

6. **Deploy to Apothem Testnet**
   ```bash
   npm run deploy
   ```

7. **Start Frontend**
   ```bash
   npm run dev
   ```

### First Time Setup

1. **Get XDC Testnet Tokens**
   - Visit [XDC Faucet](https://faucet.apothem.network/)
   - Connect your wallet and request testnet XDC

2. **Configure MetaMask**
   - Network Name: XDC Apothem Testnet
   - RPC URL: https://rpc.apothem.network
   - Chain ID: 51
   - Currency Symbol: XDC

3. **Get Hugging Face API Key**
   - Visit [Hugging Face](https://huggingface.co/settings/tokens)
   - Create a new token with read access
   - Add to `frontend/.env` as `VITE_HF_API_KEY`

## 🔗 Smart Contracts

### 📍 Contract Addresses (XDC Apothem Testnet)
| Contract | Address | Purpose |
|----------|---------|---------|
| **ClimateToken** | `0x41d87298B54d329872c29ec385367cD4C404e8e6` | ERC20 governance token |
| **ClimateDAO** | `0xfD2CFC86e06c54d1ffe9B503391d91452a8Fd02D` | Main DAO contract |

### 🌐 Network Information
- **Network**: XDC Apothem Testnet
- **Chain ID**: 51
- **RPC URL**: https://rpc.apothem.network
- **Explorer**: [https://explorer.apothem.network](https://explorer.apothem.network)

### 🚀 Deployment Status
- **Frontend**: [https://climatedao.vercel.app](https://climatedao.vercel.app)
- **Vercel Dashboard**: [https://vercel.com/teamtitanlink/frontend](https://vercel.com/teamtitanlink/frontend)
- **Status**: ✅ Production Ready
- **Environment**: Configured for live contracts

### ✅ Live Testing Validation

The deployed application has been thoroughly tested with **100% real integrations**:

- **✅ Wallet Connection**: Real XDC Apothem Testnet wallet integration
- **✅ Smart Contract Calls**: All transactions verified on XDC Explorer
- **✅ AI Integration**: Real Hugging Face API calls for proposal analysis
- **✅ Tribes SDK**: Full integration with community features (XP, badges, events)
- **✅ End-to-End Flow**: Create proposals → AI analysis → Vote → Fund → Track impact
- **✅ Test Coverage**: 74.42% with 29 passing tests covering edge cases and security scenarios

## 🔧 Environment Setup

### 📁 contracts/.env
```bash
# XDC Network Configuration
PRIVATE_KEY=your_private_key_here
XDC_RPC_URL=https://rpc.apothem.network

# Optional: Etherscan API for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 📁 frontend/.env
```bash
# Hugging Face API Configuration
VITE_HF_API_KEY=your_huggingface_api_key_here

# Smart Contract Addresses (XDC Apothem Testnet)
VITE_CLIMATE_TOKEN_ADDRESS=0x41d87298B54d329872c29ec385367cD4C404e8e6
VITE_CLIMATE_DAO_ADDRESS=0xfD2CFC86e06c54d1ffe9B503391d91452a8Fd02D

# Optional: Tribes API Configuration
VITE_TRIBES_API_KEY=your_tribes_api_key_here
```

## 🧪 Testing

### Smart Contract Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run coverage

# Run specific test file
npx hardhat test test/ClimateDAO.test.ts
```

### Test Coverage
- **Coverage**: 74.42% overall
- **Tests**: 29 passing tests
- **Edge Cases**: Comprehensive security and edge case testing
- **Integration**: Real contract interaction testing

### Frontend Testing
```bash
# Run frontend tests
cd frontend
npm test

# Run linting
npm run lint

# Build for production
npm run build
```

## 🚀 Deployment

### Smart Contract Deployment
```bash
# Deploy to XDC Apothem Testnet
npm run deploy

# Verify contracts on explorer
npx hardhat verify --network apothem <CONTRACT_ADDRESS>
```

### Frontend Deployment
```bash
# Deploy to Vercel
cd frontend
npx vercel --prod

# Or deploy to other platforms
npm run build
# Upload dist/ folder to your hosting provider
```

## 🔒 Development Guidelines

### Branch Protection Rules
- **NEVER push directly to `master` branch**
- Use feature branches for all development
- Create pull requests for code review
- Ensure all tests pass before merging

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add your feature"

# Push feature branch
git push -u origin feature/your-feature-name

# Create pull request on GitHub
```

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Comprehensive error handling
- Security-first approach
- No hardcoded secrets or API keys

## 🏆 Hackathon Submission

### 📋 DoraHacks Submission
**Platform**: [DoraHacks Tribes Hackathon](https://dorahacks.io/hackathon/tribes)

**Submission Details**:
- **Project Name**: ClimateDAO
- **Description**: AI-powered decentralized autonomous organization for environmental funding
- **Live Demo**: [https://climatedao.vercel.app](https://climatedao.vercel.app)
- **Demo Video**: [🎥 Watch the 2-3 minute demo video here](https://your-demo-video-link.com)
- **GitHub**: [https://github.com/henrysammarfo/climatedao](https://github.com/henrysammarfo/climatedao)
- **Smart Contracts**: XDC Apothem Testnet (addresses above)
- **Tags**: DAO, AI, Climate, DeFi, XDC, Tribes, Blockchain, Environmental

### 🏛️ Tribes Community Proposal
**Proposal Document**: [docs/tribes-proposal.md](docs/tribes-proposal.md)

**Submission Options**:
1. **Via Application**: Use the live ClimateDAO app to create a governance proposal
2. **Via Tribes Dashboard**: Submit ClimateDAO as a community proposal
3. **Social Media**: Tag @tribes_astrix for visibility and community engagement

### 📱 Social Media Promotion
**Content Ready**: [docs/social-media-posts.md](docs/social-media-posts.md)
- Twitter/X posts with hashtags
- LinkedIn professional posts
- Reddit community posts
- Email templates for outreach

## 🤝 Contributing

We welcome contributions to ClimateDAO! Here's how you can help:

### 🚀 Getting Started
1. **Fork the repository** on GitHub
2. **Create a feature branch** (NEVER work on master)
3. **Make your changes** with proper documentation
4. **Add tests** for new functionality
5. **Submit a pull request** for review

### 📝 Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests for new features
- Update documentation for any changes
- Ensure all tests pass before submitting PR
- Use conventional commit messages

### 🐛 Reporting Issues
- Use GitHub Issues for bug reports
- Provide detailed reproduction steps
- Include environment information
- Tag issues appropriately

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **XDC Network** for providing the blockchain infrastructure
- **Tribes OS** for community management features
- **Hugging Face** for AI model access
- **OpenZeppelin** for secure smart contract libraries
- **Vercel** for frontend hosting

---

<div align="center">

**🌍 ClimateDAO - Revolutionizing Environmental Funding Through Blockchain & AI**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-View%20App-green?style=for-the-badge&logo=vercel)](https://climatedao.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/henrysammarfo/climatedao)

*Built with ❤️ for the XDC × Tribes Global Hackathon*

</div>