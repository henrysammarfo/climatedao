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
    uint256 public constant MINT_AMOUNT = 100 * 10**18; // 100 tokens per claim
    
    mapping(address => bool) public hasClaimed;
    mapping(address => uint256) public contributionScore;
    
    event TokensClaimed(address indexed user, uint256 amount);
    event ContributionScoreUpdated(address indexed user, uint256 newScore);
    
    constructor() 
        ERC20("ClimateDAO Token", "CLIMATE") 
        ERC20Permit("ClimateDAO Token")
        Ownable(msg.sender)
    {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    /**
     * @dev Allows users to claim initial tokens
     * @notice Users can only claim once
     */
    function claimTokens() external {
        require(!hasClaimed[msg.sender], "Tokens already claimed");
        require(totalSupply() + MINT_AMOUNT <= INITIAL_SUPPLY * 2, "Maximum supply reached");
        
        hasClaimed[msg.sender] = true;
        _mint(msg.sender, MINT_AMOUNT);
        
        emit TokensClaimed(msg.sender, MINT_AMOUNT);
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
