# ClimateDAO Testing Guide

## Prerequisites
1. **Environment Setup**: Copy `frontend/env.example` to `frontend/.env` and configure:
   - `VITE_HF_API_KEY`: Your Hugging Face API token
   - `VITE_TRIBES_API_KEY`: Your Tribes API key (if available)
   - Contract addresses are already configured

2. **Wallet Setup**: 
   - Install MetaMask
   - Add XDC Apothem Testnet (Chain ID: 51)
   - Get testnet XDC from [faucet](https://faucet.apothem.network/)

## Test 1: Token Functionality

### 1.1 Claim Tokens
1. Connect wallet to XDC Apothem Testnet
2. Go to Dashboard
3. Look for "Claim Tokens" or faucet button
4. Click to claim 100 CLIMATE tokens
5. Verify balance updates in dashboard

### 1.2 Staking Tokens
1. Go to Dashboard or Staking section
2. Enter amount to stake (e.g., 50 CLIMATE)
3. Click "Stake Tokens"
4. Confirm transaction in MetaMask
5. Verify staked amount shows in dashboard
6. Check that rewards start accumulating

### 1.3 Voting with Tokens
1. Create a test proposal (see Test 2)
2. Go to Proposals page
3. Find your proposal
4. Click "Vote Now"
5. Select vote choice (For/Against/Abstain)
6. Confirm transaction
7. Verify vote is recorded

## Test 2: Proposal Creation

### 2.1 Create Proposal
1. Go to "Create Proposal" page
2. Fill in required fields:
   - Title: "Test Solar Panel Project"
   - Description: "Install solar panels in community center"
   - Category: "Renewable Energy"
   - Location: "Test City"
   - Requested Amount: 5000
   - Duration: 365
   - Website: "https://example.com"
3. Click "Create Proposal"
4. Confirm transaction in MetaMask
5. Wait for transaction confirmation

### 2.2 Verify Proposal Appears
1. Go to "Proposals" page
2. Look for your newly created proposal
3. Verify all details are correct
4. Check that status shows "Active"
5. Verify voting period is set correctly

### 2.3 AI Analysis
1. On the Create Proposal page, click "Analyze with AI"
2. Wait for AI analysis to complete
3. Verify impact score, CO2 reduction, etc. are displayed
4. Check that analysis is reasonable for the proposal type

## Test 3: Dashboard Functionality

### 3.1 User Statistics
1. Go to Dashboard
2. Verify "Your Proposals" shows correct count
3. Check "Votes Cast" updates after voting
4. Verify "Contribution Score" (XP) is displayed
5. Check "Tokens Staked" shows correct amount

### 3.2 Recent Activity
1. Perform some actions (create proposal, vote)
2. Check Dashboard "Recent Activity" section
3. Verify activities appear in chronological order
4. Check that timestamps are correct

## Test 4: Tribes Integration

### 4.1 Profile Data
1. Go to Dashboard > Tribes tab
2. Check that user profile loads
3. Verify XP and level are displayed
4. Check that badges section loads (may be empty initially)

### 4.2 Events and Leaderboard
1. Check Events tab for upcoming events
2. Check Leaderboard tab for community rankings
3. Note: These may show "no data" if Tribes SDK isn't fully configured

## Expected Results

### ✅ Working Features
- Token claiming and staking
- Proposal creation and display
- Voting functionality
- AI analysis (with valid API key)
- Dashboard statistics
- Recent activity tracking

### ⚠️ May Need Configuration
- Tribes events and leaderboard (requires proper Tribes SDK setup)
- Tribe token creation (requires Tribes permissions)

## Troubleshooting

### Common Issues
1. **"No wallet provider found"**: Install MetaMask and refresh page
2. **"Wrong network"**: Switch to XDC Apothem Testnet
3. **"Insufficient funds"**: Get XDC from faucet
4. **"AI analysis failed"**: Check Hugging Face API key
5. **"Proposals not loading"**: Check network connection and contract addresses

### Debug Steps
1. Open browser console (F12)
2. Check for error messages
3. Verify environment variables are loaded
4. Check network requests in Network tab
5. Verify wallet connection status

## Success Criteria
- [ ] Can claim CLIMATE tokens
- [ ] Can stake tokens and see rewards
- [ ] Can create proposals that appear in list
- [ ] Can vote on proposals
- [ ] AI analysis works with valid API key
- [ ] Dashboard shows real user data
- [ ] Recent activity tracks user actions
- [ ] No console errors during normal operation
