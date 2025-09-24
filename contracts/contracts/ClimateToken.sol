// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title ClimateToken
 * @dev ERC20 token with voting capabilities for ClimateDAO governance
 * @notice This token represents voting power in the ClimateDAO ecosystem
 */
contract ClimateToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18; // 1 million tokens
    uint256 public constant DAILY_CLAIM_AMOUNT = 50 * 10**18; // 50 tokens per day
    uint256 public constant MAX_DAILY_CLAIMS = 2; // Maximum 2 claims per day
    uint256 public constant CLAIM_COOLDOWN = 12 hours; // 12 hours between claims
    
    mapping(address => bool) public hasClaimedInitial;
    mapping(address => uint256) public contributionScore;
    mapping(address => uint256) public lastClaimTime;
    mapping(address => uint256) public dailyClaimCount;
    mapping(address => uint256) public lastClaimDay;
    
    // Staking functionality
    mapping(address => uint256) public stakedAmount;
    mapping(address => uint256) public stakingStartTime;
    mapping(address => uint256) public lastRewardClaimTime;
    uint256 public constant STAKING_REWARD_RATE = 10; // 10% annual reward rate
    uint256 public constant MIN_STAKING_AMOUNT = 10 * 10**18; // 10 tokens minimum
    
    event TokensClaimed(address indexed user, uint256 amount);
    event DailyTokensClaimed(address indexed user, uint256 amount, uint256 claimCount);
    event ContributionScoreUpdated(address indexed user, uint256 newScore);
    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    
    constructor() 
        ERC20("ClimateDAO Token", "CLIMATE") 
        ERC20Permit("ClimateDAO Token")
        Ownable(msg.sender)
    {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    /**
     * @dev Allows users to claim initial tokens (one-time only)
     * @notice Users can only claim initial tokens once
     */
    function claimInitialTokens() external {
        require(!hasClaimedInitial[msg.sender], "Initial tokens already claimed");
        require(totalSupply() + DAILY_CLAIM_AMOUNT <= INITIAL_SUPPLY * 2, "Maximum supply reached");
        
        hasClaimedInitial[msg.sender] = true;
        _mint(msg.sender, DAILY_CLAIM_AMOUNT);
        
        emit TokensClaimed(msg.sender, DAILY_CLAIM_AMOUNT);
    }
    
    /**
     * @dev Allows users to claim daily tokens
     * @notice Users can claim up to MAX_DAILY_CLAIMS times per day with CLAIM_COOLDOWN between claims
     */
    function claimDailyTokens() external {
        require(totalSupply() + DAILY_CLAIM_AMOUNT <= INITIAL_SUPPLY * 2, "Maximum supply reached");
        
        uint256 currentTime = block.timestamp;
        uint256 currentDay = currentTime / 1 days;
        
        // Reset daily count if it's a new day
        if (lastClaimDay[msg.sender] != currentDay) {
            dailyClaimCount[msg.sender] = 0;
            lastClaimDay[msg.sender] = currentDay;
        }
        
        // Check if user has reached daily limit
        require(dailyClaimCount[msg.sender] < MAX_DAILY_CLAIMS, "Daily claim limit reached");
        
        // Check cooldown period
        require(
            currentTime >= lastClaimTime[msg.sender] + CLAIM_COOLDOWN,
            "Claim cooldown not met"
        );
        
        // Update claim tracking
        dailyClaimCount[msg.sender]++;
        lastClaimTime[msg.sender] = currentTime;
        
        // Mint tokens
        _mint(msg.sender, DAILY_CLAIM_AMOUNT);
        
        emit DailyTokensClaimed(msg.sender, DAILY_CLAIM_AMOUNT, dailyClaimCount[msg.sender]);
    }
    
    /**
     * @dev Get user's claim status
     * @param user The user address to check
     * @return canClaim Whether user can claim tokens now
     * @return nextClaimTime When user can claim next (0 if can claim now)
     * @return dailyClaimsRemaining How many daily claims remaining today
     */
    function getClaimStatus(address user) external view returns (
        bool canClaim,
        uint256 nextClaimTime,
        uint256 dailyClaimsRemaining
    ) {
        uint256 currentTime = block.timestamp;
        uint256 currentDay = currentTime / 1 days;
        
        // Reset daily count if it's a new day
        uint256 userDailyCount = dailyClaimCount[user];
        if (lastClaimDay[user] != currentDay) {
            userDailyCount = 0;
        }
        
        dailyClaimsRemaining = MAX_DAILY_CLAIMS - userDailyCount;
        
        if (userDailyCount >= MAX_DAILY_CLAIMS) {
            canClaim = false;
            nextClaimTime = (currentDay + 1) * 1 days; // Next day
        } else if (currentTime >= lastClaimTime[user] + CLAIM_COOLDOWN) {
            canClaim = true;
            nextClaimTime = 0;
        } else {
            canClaim = false;
            nextClaimTime = lastClaimTime[user] + CLAIM_COOLDOWN;
        }
    }
    
    /**
     * @dev Updates contribution score for a user
     * @param user The address to update
     * @param score The new contribution score
     * @notice Only owner can update contribution scores
     */
    function updateContributionScore(address user, uint256 score) external onlyOwner {
        contributionScore[user] = score;
        emit ContributionScoreUpdated(user, score);
    }
    
    /**
     * @dev Mints additional tokens based on contribution score
     * @param user The address to mint tokens for
     * @param amount The amount of tokens to mint
     * @notice Only owner can mint additional tokens
     */
    function mintForContribution(address user, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= INITIAL_SUPPLY * 2, "Maximum supply reached");
        _mint(user, amount);
    }
    
    /**
     * @dev Stake tokens to earn voting power and rewards
     * @param amount The amount of tokens to stake
     */
    function stakeTokens(uint256 amount) external {
        require(amount >= MIN_STAKING_AMOUNT, "Amount below minimum staking requirement");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Claim any pending rewards first
        if (stakedAmount[msg.sender] > 0) {
            _claimRewards();
        }
        
        // Transfer tokens to contract (staking)
        _transfer(msg.sender, address(this), amount);
        
        // Update staking data
        stakedAmount[msg.sender] += amount;
        if (stakingStartTime[msg.sender] == 0) {
            stakingStartTime[msg.sender] = block.timestamp;
        }
        lastRewardClaimTime[msg.sender] = block.timestamp;
        
        emit TokensStaked(msg.sender, amount);
    }
    
    /**
     * @dev Unstake tokens
     * @param amount The amount of tokens to unstake
     */
    function unstakeTokens(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(stakedAmount[msg.sender] >= amount, "Insufficient staked amount");
        
        // Claim any pending rewards first
        _claimRewards();
        
        // Update staking data
        stakedAmount[msg.sender] -= amount;
        
        // Transfer tokens back to user
        _transfer(address(this), msg.sender, amount);
        
        // Reset staking start time if all tokens unstaked
        if (stakedAmount[msg.sender] == 0) {
            stakingStartTime[msg.sender] = 0;
        }
        
        emit TokensUnstaked(msg.sender, amount);
    }
    
    /**
     * @dev Claim staking rewards
     */
    function claimRewards() external {
        require(stakedAmount[msg.sender] > 0, "No staked tokens");
        _claimRewards();
    }
    
    /**
     * @dev Internal function to calculate and claim rewards
     */
    function _claimRewards() internal {
        uint256 rewards = calculateRewards(msg.sender);
        if (rewards > 0) {
            require(totalSupply() + rewards <= INITIAL_SUPPLY * 2, "Maximum supply reached");
            _mint(msg.sender, rewards);
            lastRewardClaimTime[msg.sender] = block.timestamp;
            emit RewardsClaimed(msg.sender, rewards);
        }
    }
    
    /**
     * @dev Calculate pending rewards for a user
     * @param user The user address
     * @return rewards The amount of pending rewards
     */
    function calculateRewards(address user) public view returns (uint256 rewards) {
        if (stakedAmount[user] == 0) return 0;
        
        uint256 timeStaked = block.timestamp - lastRewardClaimTime[user];
        uint256 annualReward = (stakedAmount[user] * STAKING_REWARD_RATE) / 100;
        rewards = (annualReward * timeStaked) / 365 days;
    }
    
    /**
     * @dev Get user's staking information
     * @param user The user address
     * @return staked The amount of staked tokens
     * @return rewards The amount of pending rewards
     * @return stakingStart When staking started
     */
    function getStakingInfo(address user) external view returns (
        uint256 staked,
        uint256 rewards,
        uint256 stakingStart
    ) {
        staked = stakedAmount[user];
        rewards = calculateRewards(user);
        stakingStart = stakingStartTime[user];
    }
    
    /**
     * @dev Burns tokens from a user's balance
     * @param amount The amount of tokens to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    // The following functions are overrides required by Solidity.
    
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }
    
    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
