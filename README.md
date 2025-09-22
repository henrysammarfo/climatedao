# ClimateDAO

An AI-powered on-chain DAO for funding and governing environmental projects, built on XDC Network with Tribes OS integration.

## Overview

ClimateDAO addresses the lack of transparent, community-driven funding for climate initiatives by leveraging blockchain technology for trustless donations and AI for objective impact assessment. The platform enables global participation in climate action through decentralized governance and funding mechanisms.

## Features

- **Decentralized Governance**: Community-driven proposal creation and voting
- **AI-Powered Impact Assessment**: Automated analysis of environmental project proposals
- **Transparent Funding**: Blockchain-based donation tracking and fund distribution
- **Community Engagement**: XP/badges system, events, and token-gated spaces
- **Real-time Analytics**: Impact scoring and project performance tracking

## Tech Stack

- **Blockchain**: XDC Network (Apothem Testnet)
- **Smart Contracts**: Solidity 0.8.24
- **Frontend**: React 18.3.1, Vite 5.4.3, TypeScript 5.5.4
- **Web3**: Wagmi 2.12.8, viem 2.21.1
- **Styling**: Tailwind CSS 3.4.13
- **AI**: Hugging Face Inference API
- **Community**: Tribes OS SDK

## Project Structure

```
climatedao/
├── contracts/          # Smart contracts
├── frontend/           # React frontend
├── scripts/            # Deployment and utility scripts
└── docs/              # Documentation
```

## Quick Start

1. **Install Dependencies**
   ```bash
   npm run install:all
   ```

2. **Compile Contracts**
   ```bash
   npm run compile
   ```

3. **Run Tests**
   ```bash
   npm test
   ```

4. **Deploy to Apothem Testnet**
   ```bash
   npm run deploy
   ```

5. **Start Frontend**
   ```bash
   npm run dev
   ```

## Live Deployment

**Smart Contracts (XDC Apothem Testnet):**
- ClimateToken: `0x41d87298B54d329872c29ec385367cD4C404e8e6`
- ClimateDAO: `0xfD2CFC86e06c54d1ffe9B503391d91452a8Fd02D`
- Network: XDC Apothem Testnet (Chain ID: 51)
- Explorer: https://explorer.apothem.network

**Frontend:**
- Built and ready for deployment to Vercel/Netlify
- Environment variables configured for live contracts

## Environment Variables

Create `.env` files in both `contracts/` and `frontend/` directories:

### contracts/.env
```
PRIVATE_KEY=your_private_key_here
XDC_RPC_URL=https://rpc.apothem.network
```

### frontend/.env
```
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key
VITE_TRIBES_API_KEY=your_tribes_api_key
VITE_CONTRACT_ADDRESS=deployed_contract_address
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

## Contributing

1. Fork the repository
2. Create a feature branch (NEVER work on master)
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request for review

## License

MIT License - see LICENSE file for details