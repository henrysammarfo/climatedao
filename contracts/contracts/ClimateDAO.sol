// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ClimateToken.sol";
import "./Proposal.sol";

/**
 * @title ClimateDAO
 * @dev Main DAO contract for managing climate projects and governance
 * @notice This contract handles proposal creation, voting, and fund management
 */
contract ClimateDAO is Ownable, ReentrancyGuard {
    ClimateToken public immutable climateToken;
    
    uint256 public proposalCounter;
    uint256 public totalFundsRaised;
    uint256 public totalFundsDistributed;
    
    // DAO Configuration
    uint256 public constant MIN_PROPOSAL_AMOUNT = 1000 * 10**18; // 1000 tokens minimum
    uint256 public constant MAX_PROPOSAL_AMOUNT = 100000 * 10**18; // 100k tokens maximum
    uint256 public constant VOTING_DURATION = 7 days;
    uint256 public constant QUORUM_THRESHOLD = 1000 * 10**18; // 1000 tokens
    uint256 public constant MAJORITY_THRESHOLD = 51; // 51%
    
    // Fee structure (in basis points, 100 = 1%)
    uint256 public platformFee = 250; // 2.5%
    uint256 public constant MAX_PLATFORM_FEE = 500; // 5% maximum
    
    mapping(uint256 => address) public proposals;
    mapping(address => uint256[]) public userProposals;
    mapping(address => uint256) public userContributions;
    mapping(address => bool) public isModerator;
    mapping(address => bool) public validProposal;
    
    // User Registry
    mapping(address => bool) public registeredUsers;
    mapping(address => UserInfo) public userRegistry;
    
    struct UserInfo {
        uint256 registrationTimestamp;
        uint256 totalContributions;
        uint256 proposalCount;
        uint256 voteCount;
        bool isActive;
    }
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address indexed proposalContract,
        string title,
        uint256 requestedAmount
    );
    
    event FundsDonated(
        address indexed donor,
        uint256 amount,
        uint256 totalRaised
    );
    
    event FundsDistributed(
        uint256 indexed proposalId,
        address indexed beneficiary,
        uint256 amount
    );
    
    event ModeratorAdded(address indexed moderator);
    event ModeratorRemoved(address indexed moderator);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    
    // User Registry Events
    event UserRegistered(address indexed user, uint256 timestamp);
    event UserProfileUpdated(address indexed user, uint256 totalContributions, uint256 proposalCount, uint256 voteCount);
    
    modifier onlyModerator() {
        require(isModerator[msg.sender] || msg.sender == owner(), "Not a moderator");
        _;
    }
    
    modifier validProposalAmount(uint256 amount) {
        require(amount >= MIN_PROPOSAL_AMOUNT, "Amount below minimum");
        require(amount <= MAX_PROPOSAL_AMOUNT, "Amount above maximum");
        _;
    }
    
    constructor(address _climateToken) Ownable(msg.sender) {
        climateToken = ClimateToken(_climateToken);
        isModerator[msg.sender] = true;
        
        // Register the owner as the first user
        _registerUser(msg.sender);
    }
    
    /**
     * @dev Create a new proposal
     * @param beneficiary The address that will receive funds if proposal passes
     * @param projectDetails The project details struct
     * @return proposalId The ID of the created proposal
     */
    function createProposal(
        address beneficiary,
        Proposal.ProjectDetails memory projectDetails
    ) external validProposalAmount(projectDetails.requestedAmount) returns (uint256) {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(bytes(projectDetails.title).length > 0, "Title required");
        require(bytes(projectDetails.description).length > 0, "Description required");
        
        // Auto-register user if not already registered
        if (!registeredUsers[msg.sender]) {
            _registerUser(msg.sender);
        }
        
        proposalCounter++;
        uint256 proposalId = proposalCounter;
        
        // Deploy new proposal contract
        Proposal newProposal = new Proposal(
            proposalId,
            msg.sender,
            beneficiary,
            projectDetails,
            VOTING_DURATION,
            QUORUM_THRESHOLD,
            MAJORITY_THRESHOLD
        );
        
        proposals[proposalId] = address(newProposal);
        validProposal[address(newProposal)] = true;
        userProposals[msg.sender].push(proposalId);
        
        // Update user statistics
        userRegistry[msg.sender].proposalCount++;
        emit UserProfileUpdated(
            msg.sender,
            userRegistry[msg.sender].totalContributions,
            userRegistry[msg.sender].proposalCount,
            userRegistry[msg.sender].voteCount
        );
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            address(newProposal),
            projectDetails.title,
            projectDetails.requestedAmount
        );
        
        return proposalId;
    }
    
    /**
     * @dev Donate funds to the DAO
     * @param amount The amount of tokens to donate
     */
    function donateFunds(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(climateToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Auto-register user if not already registered
        if (!registeredUsers[msg.sender]) {
            _registerUser(msg.sender);
        }
        
        userContributions[msg.sender] += amount;
        totalFundsRaised += amount;
        
        // Update user statistics
        userRegistry[msg.sender].totalContributions += amount;
        emit UserProfileUpdated(
            msg.sender,
            userRegistry[msg.sender].totalContributions,
            userRegistry[msg.sender].proposalCount,
            userRegistry[msg.sender].voteCount
        );
        
        emit FundsDonated(msg.sender, amount, totalFundsRaised);
    }
    
    /**
     * @dev Execute a passed proposal and distribute funds
     * @param proposalId The ID of the proposal to execute
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        require(proposals[proposalId] != address(0), "Proposal does not exist");
        
        Proposal proposal = Proposal(proposals[proposalId]);
        require(proposal.status() == Proposal.ProposalStatus.Passed, "Proposal has not passed");
        
        // Mark proposal as executed
        proposal.markAsExecuted();
        
        // Calculate distribution amount (minus platform fee)
        // The public projectDetails getter returns a tuple with all struct members except arrays
        // We need to destructure it to get the requestedAmount (5th element, 0-indexed)
        (string memory title, string memory description, string memory location, 
         Proposal.ProjectCategory category, uint256 requestedAmount, uint256 duration, 
         string memory website) = proposal.projectDetails();
        uint256 feeAmount = (requestedAmount * platformFee) / 10000;
        uint256 distributionAmount = requestedAmount - feeAmount;
        
        // Check if DAO has sufficient funds
        require(climateToken.balanceOf(address(this)) >= distributionAmount, "Insufficient funds");
        
        // Transfer funds to beneficiary
        require(climateToken.transfer(proposal.beneficiary(), distributionAmount), "Transfer failed");
        
        totalFundsDistributed += distributionAmount;
        
        emit FundsDistributed(proposalId, proposal.beneficiary(), distributionAmount);
    }
    
    /**
     * @dev Update impact metrics for a proposal using AI analysis
     * @param proposalId The ID of the proposal
     * @param co2Reduction Expected CO2 reduction in tons
     * @param energyGeneration Expected energy generation in MWh
     * @param jobsCreated Expected jobs created
     * @param aiScore AI impact score (0-100)
     */
    function updateProposalImpactMetrics(
        uint256 proposalId,
        uint256 co2Reduction,
        uint256 energyGeneration,
        uint256 jobsCreated,
        uint256 aiScore
    ) external onlyModerator {
        require(proposals[proposalId] != address(0), "Proposal does not exist");
        
        Proposal proposal = Proposal(proposals[proposalId]);
        proposal.updateImpactMetrics(co2Reduction, energyGeneration, jobsCreated, aiScore);
    }
    
    /**
     * @dev Add a moderator
     * @param moderator The address to add as moderator
     */
    function addModerator(address moderator) external onlyOwner {
        require(moderator != address(0), "Invalid address");
        require(!isModerator[moderator], "Already a moderator");
        
        isModerator[moderator] = true;
        emit ModeratorAdded(moderator);
    }
    
    /**
     * @dev Remove a moderator
     * @param moderator The address to remove as moderator
     */
    function removeModerator(address moderator) external onlyOwner {
        require(isModerator[moderator], "Not a moderator");
        require(moderator != owner(), "Cannot remove owner");
        
        isModerator[moderator] = false;
        emit ModeratorRemoved(moderator);
    }
    
    /**
     * @dev Update platform fee
     * @param newFee The new platform fee in basis points
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_PLATFORM_FEE, "Fee too high");
        
        uint256 oldFee = platformFee;
        platformFee = newFee;
        
        emit PlatformFeeUpdated(oldFee, newFee);
    }
    
    /**
     * @dev Withdraw platform fees
     * @param amount The amount to withdraw
     */
    function withdrawFees(uint256 amount) external onlyOwner {
        require(amount <= climateToken.balanceOf(address(this)), "Insufficient balance");
        require(climateToken.transfer(owner(), amount), "Transfer failed");
    }
    
    /**
     * @dev Get proposal details
     * @param proposalId The ID of the proposal
     * @return proposalAddress The address of the proposal contract
     * @return proposer The address of the proposer
     * @return beneficiary The address of the beneficiary
     * @return status The current status of the proposal
     */
    function getProposalDetails(uint256 proposalId) external view returns (
        address proposalAddress,
        address proposer,
        address beneficiary,
        Proposal.ProposalStatus status
    ) {
        require(proposals[proposalId] != address(0), "Proposal does not exist");
        
        Proposal proposal = Proposal(proposals[proposalId]);
        return (
            proposals[proposalId],
            proposal.proposer(),
            proposal.beneficiary(),
            proposal.status()
        );
    }
    
    /**
     * @dev Get user's proposals
     * @param user The address of the user
     * @return proposalIds Array of proposal IDs created by the user
     */
    function getUserProposals(address user) external view returns (uint256[] memory) {
        return userProposals[user];
    }
    
    /**
     * @dev Get DAO statistics
     * @return totalProposals Total number of proposals created
     * @return totalRaised Total funds raised
     * @return totalDistributed Total funds distributed
     * @return currentBalance Current DAO balance
     */
    function getDAOStats() external view returns (
        uint256 totalProposals,
        uint256 totalRaised,
        uint256 totalDistributed,
        uint256 currentBalance
    ) {
        return (
            proposalCounter,
            totalFundsRaised,
            totalFundsDistributed,
            climateToken.balanceOf(address(this))
        );
    }
    
    /**
     * @dev Register a user in the DAO (self-registration only)
     * @param user The address of the user to register
     */
    function registerUser(address user) external {
        require(user != address(0), "Invalid address");
        require(msg.sender == user, "Only the user can self-register");
        require(!registeredUsers[user], "User already registered");
        
        _registerUser(user);
    }
    
    /**
     * @dev Check if a user is registered
     * @param user The address of the user to check
     * @return isRegistered True if user is registered
     */
    function isUserRegistered(address user) external view returns (bool) {
        return registeredUsers[user];
    }
    
    /**
     * @dev Get user information
     * @param user The address of the user
     * @return userInfo The user information struct
     */
    function getUserInfo(address user) external view returns (UserInfo memory) {
        require(registeredUsers[user], "User not registered");
        return userRegistry[user];
    }
    
    /**
     * @dev Update user vote count (called by proposal contracts)
     * @param user The address of the user who voted
     */
    function updateUserVoteCount(address user) external {
        require(registeredUsers[user], "User not registered");
        require(validProposal[msg.sender], "Only proposal contracts can update vote count");
        
        userRegistry[user].voteCount++;
        emit UserProfileUpdated(
            user,
            userRegistry[user].totalContributions,
            userRegistry[user].proposalCount,
            userRegistry[user].voteCount
        );
    }
    
    /**
     * @dev Internal function to register a user
     * @param user The address of the user to register
     */
    function _registerUser(address user) internal {
        registeredUsers[user] = true;
        userRegistry[user] = UserInfo({
            registrationTimestamp: block.timestamp,
            totalContributions: 0,
            proposalCount: 0,
            voteCount: 0,
            isActive: true
        });
        
        emit UserRegistered(user, block.timestamp);
    }
}
