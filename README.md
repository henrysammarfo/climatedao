# ClimateDAO

An AI-powered on-chain DAO for funding and governing environmental projects, built on XDC Network with Tribes OS integration.

## Overview

ClimateDAO addresses the critical lack of transparent, community-driven funding for climate initiatives by leveraging blockchain technology for trustless donations and AI for objective impact assessment. The platform enables global participation in climate action through decentralized governance and funding mechanisms.

### The Problem
- **Lack of Transparency**: Traditional climate funding lacks transparency and community input
- **Centralized Decision Making**: Funding decisions are made by a few without community participation
- **No Impact Assessment**: Limited objective analysis of environmental project effectiveness
- **Geographic Barriers**: Global communities can't easily participate in local climate initiatives

### The Solution
ClimateDAO creates a decentralized platform where:
- **AI-Powered Analysis**: Hugging Face Mistral-7B provides objective impact scoring and feasibility assessment
- **Community Governance**: CLIMATE token holders vote on proposals and fund distribution
- **Transparent Funding**: All transactions are on-chain and verifiable
- **Global Participation**: Anyone can propose, vote on, and fund environmental projects
- **Real Impact Tracking**: Monitor actual environmental outcomes of funded projects

## Features

- **Decentralized Governance**: Community-driven proposal creation and voting
- **AI-Powered Impact Assessment**: Automated analysis using Hugging Face Mistral-7B
- **Transparent Funding**: Blockchain-based donation tracking and fund distribution
- **Tribes OS Integration**: Real community management with XP/badges, events, and token-gated spaces
- **Real-time Analytics**: Impact scoring and project performance tracking
- **Tribe Token Economy**: ERC20 tokens for governance and community rewards

## Tech Stack

- **Blockchain**: XDC Network (Apothem Testnet)
- **Smart Contracts**: Solidity 0.8.24
- **Frontend**: React 18.3.1, Vite 5.4.3, TypeScript 5.5.4
- **Web3**: Wagmi 2.12.8, viem 2.21.1
- **Styling**: Tailwind CSS 3.4.13
- **AI**: Hugging Face Inference API (Mistral-7B-Instruct-v0.3)
- **Community**: Tribes SDK (@wasserstoff/tribes-sdk)

## Project Structure

```
climatedao/
├── contracts/          # Smart contracts
├── frontend/           # React frontend
├── scripts/            # Deployment and utility scripts
└── docs/              # Documentation
```

## Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Git
- XDC wallet (MetaMask with XDC Network configured)
- Hugging Face API key (for AI features)

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

## Live Deployment

**Smart Contracts (XDC Apothem Testnet):**
- ClimateToken: `0x41d87298B54d329872c29ec385367cD4C404e8e6`
- ClimateDAO: `0xfD2CFC86e06c54d1ffe9B503391d91452a8Fd02D`
- Network: XDC Apothem Testnet (Chain ID: 51)
- Explorer: https://explorer.apothem.network

**Frontend:**
- **Live URL**: https://frontend-c4sb6trvl-teamtitanlink.vercel.app
- **Vercel Dashboard**: https://vercel.com/teamtitanlink/frontend
- Environment variables configured for live contracts
- Production build optimized and deployed

### Live Testing Validation ✅

The deployed application has been thoroughly tested with real integrations:

- **✅ Wallet Connection**: Real XDC Apothem Testnet wallet integration
- **✅ Smart Contract Calls**: All transactions verified on XDC Explorer
- **✅ AI Integration**: Real Hugging Face API calls for proposal analysis
- **✅ Tribes SDK**: Full integration with community features (XP, badges, events)
- **✅ End-to-End Flow**: Create proposals → AI analysis → Vote → Fund → Track impact

**Test Coverage**: 74.42% with 29 passing tests covering edge cases and security scenarios.

## Environment Variables

Create `.env` files in both `contracts/` and `frontend/` directories:

### contracts/.env
```
PRIVATE_KEY=your_private_key_here
XDC_RPC_URL=https://rpc.apothem.network
```

### frontend/.env
```
VITE_HF_API_KEY=your_huggingface_api_key
VITE_CLIMATE_TOKEN_ADDRESS=0x41d87298B54d329872c29ec385367cD4C404e8e6
VITE_CLIMATE_DAO_ADDRESS=0xfD2CFC86e06c54d1ffe9B503391d91452a8Fd02D
```

## Development

- **Smart Contract Development**: Use Hardhat for testing and deployment
- **Frontend Development**: Vite with hot reload for fast development
- **Testing**: Comprehensive test coverage with Hardhat
- **Deployment**: Automated deployment to XDC Apothem Testnet

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

## Hackathon Submission

### DoraHacks Submission
1. Visit: https://dorahacks.io/hackathon/tribes
2. Submit ClimateDAO as your project
3. Include live URL: https://frontend-c4sb6trvl-teamtitanlink.vercel.app
4. Add contract addresses and GitHub repository

### Tribes Proposal
1. Use the live application to create a governance proposal
2. Or visit Tribes dashboard to submit ClimateDAO as a community proposal
3. Tag @tribes_astrix on social media for visibility

## Contributing

1. Fork the repository
2. Create a feature branch (NEVER work on master)
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request for review

## License

MIT License - see LICENSE file for details