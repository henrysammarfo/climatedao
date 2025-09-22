// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Proposal
 * @dev Represents a single proposal in the ClimateDAO ecosystem
 * @notice Each proposal contains project details, funding requirements, and voting data
 */
contract Proposal is Ownable, ReentrancyGuard {
    enum ProposalStatus {
        Active,
        Passed,
        Rejected,
        Executed,
        Cancelled
    }
    
    enum ProjectCategory {
        RenewableEnergy,
        CarbonCapture,
        Reforestation,
        OceanCleanup,
        SustainableAgriculture,
        ClimateEducation,
        Other
    }
    
    struct ProjectDetails {
        string title;
        string description;
        string location;
        ProjectCategory category;
        uint256 requestedAmount;
        uint256 duration; // in days
        string website;
        string[] images;
    }
    
    struct VotingData {
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 totalVotes;
        uint256 startTime;
        uint256 endTime;
        mapping(address => bool) hasVoted;
        mapping(address => uint8) voteChoice; // 0: against, 1: for, 2: abstain
    }
    
    struct ImpactMetrics {
        uint256 expectedCO2Reduction; // in tons
        uint256 expectedEnergyGeneration; // in MWh
        uint256 expectedJobsCreated;
        uint256 aiImpactScore; // 0-100
        bool aiAnalysisComplete;
    }
    
    ProjectDetails public projectDetails;
    VotingData public votingData;
    ImpactMetrics public impactMetrics;
    ProposalStatus public status;
    
    address public proposer;
    address public beneficiary;
    uint256 public proposalId;
    uint256 public quorumRequired;
    uint256 public majorityThreshold; // percentage (e.g., 51 for 51%)
    
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 requestedAmount
    );
    
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 choice,
        uint256 weight
    );
    
    event ProposalStatusChanged(
        uint256 indexed proposalId,
        ProposalStatus oldStatus,
        ProposalStatus newStatus
    );
    
    event ImpactMetricsUpdated(
        uint256 indexed proposalId,
        uint256 co2Reduction,
        uint256 energyGeneration,
        uint256 jobsCreated,
        uint256 aiScore
    );
    
    modifier onlyActiveProposal() {
        require(status == ProposalStatus.Active, "Proposal is not active");
        _;
    }
    
    modifier onlyAfterVoting() {
        require(block.timestamp > votingData.endTime, "Voting period has not ended");
        _;
    }
    
    constructor(
        uint256 _proposalId,
        address _proposer,
        address _beneficiary,
        ProjectDetails memory _projectDetails,
        uint256 _votingDuration,
        uint256 _quorumRequired,
        uint256 _majorityThreshold
    ) Ownable(msg.sender) {
        proposalId = _proposalId;
        proposer = _proposer;
        beneficiary = _beneficiary;
        projectDetails = _projectDetails;
        quorumRequired = _quorumRequired;
        majorityThreshold = _majorityThreshold;
        
        votingData.startTime = block.timestamp;
        votingData.endTime = block.timestamp + _votingDuration;
        status = ProposalStatus.Active;
        
        emit ProposalCreated(_proposalId, _proposer, _projectDetails.title, _projectDetails.requestedAmount);
    }
    
    /**
     * @dev Cast a vote on the proposal
     * @param choice 0: against, 1: for, 2: abstain
     * @param weight The voting weight of the voter
     */
    function castVote(uint8 choice, uint256 weight) external onlyActiveProposal {
        require(choice <= 2, "Invalid vote choice");
        require(!votingData.hasVoted[msg.sender], "Already voted");
        require(block.timestamp <= votingData.endTime, "Voting period has ended");
        require(weight > 0, "Voting weight must be greater than 0");
        
        votingData.hasVoted[msg.sender] = true;
        votingData.voteChoice[msg.sender] = choice;
        votingData.totalVotes += weight;
        
        if (choice == 1) {
            votingData.forVotes += weight;
        } else if (choice == 0) {
            votingData.againstVotes += weight;
        } else {
            votingData.abstainVotes += weight;
        }
        
        emit VoteCast(msg.sender, proposalId, choice, weight);
    }
    
    /**
     * @dev Execute the proposal if it has passed
     * @notice Can only be called after voting period ends
     */
    function executeProposal() external onlyAfterVoting nonReentrant {
        require(status == ProposalStatus.Active, "Proposal is not active");
        
        ProposalStatus newStatus;
        
        if (votingData.totalVotes < quorumRequired) {
            newStatus = ProposalStatus.Rejected;
        } else if (votingData.forVotes * 100 / (votingData.forVotes + votingData.againstVotes) >= majorityThreshold) {
            newStatus = ProposalStatus.Passed;
        } else {
            newStatus = ProposalStatus.Rejected;
        }
        
        ProposalStatus oldStatus = status;
        status = newStatus;
        
        emit ProposalStatusChanged(proposalId, oldStatus, newStatus);
    }
    
    /**
     * @dev Mark the proposal as executed
     * @notice Only owner can mark as executed
     */
    function markAsExecuted() external onlyOwner {
        require(status == ProposalStatus.Passed, "Proposal must be passed to execute");
        
        ProposalStatus oldStatus = status;
        status = ProposalStatus.Executed;
        
        emit ProposalStatusChanged(proposalId, oldStatus, ProposalStatus.Executed);
    }
    
    /**
     * @dev Cancel the proposal
     * @notice Only proposer or owner can cancel
     */
    function cancelProposal() external {
        require(
            msg.sender == proposer || msg.sender == owner(),
            "Only proposer or owner can cancel"
        );
        require(status == ProposalStatus.Active, "Proposal is not active");
        
        ProposalStatus oldStatus = status;
        status = ProposalStatus.Cancelled;
        
        emit ProposalStatusChanged(proposalId, oldStatus, ProposalStatus.Cancelled);
    }
    
    /**
     * @dev Update impact metrics with AI analysis results
     * @param co2Reduction Expected CO2 reduction in tons
     * @param energyGeneration Expected energy generation in MWh
     * @param jobsCreated Expected jobs created
     * @param aiScore AI impact score (0-100)
     * @notice Only owner can update impact metrics
     */
    function updateImpactMetrics(
        uint256 co2Reduction,
        uint256 energyGeneration,
        uint256 jobsCreated,
        uint256 aiScore
    ) external onlyOwner {
        impactMetrics.expectedCO2Reduction = co2Reduction;
        impactMetrics.expectedEnergyGeneration = energyGeneration;
        impactMetrics.expectedJobsCreated = jobsCreated;
        impactMetrics.aiImpactScore = aiScore;
        impactMetrics.aiAnalysisComplete = true;
        
        emit ImpactMetricsUpdated(proposalId, co2Reduction, energyGeneration, jobsCreated, aiScore);
    }
    
    /**
     * @dev Get voting results
     * @return forVotes Number of votes for the proposal
     * @return againstVotes Number of votes against the proposal
     * @return abstainVotes Number of abstain votes
     * @return totalVotes Total number of votes cast
     */
    function getVotingResults() external view returns (
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        uint256 totalVotes
    ) {
        return (
            votingData.forVotes,
            votingData.againstVotes,
            votingData.abstainVotes,
            votingData.totalVotes
        );
    }
    
    /**
     * @dev Check if a user has voted
     * @param voter The address to check
     * @return hasVoted True if the user has voted
     * @return choice The vote choice (0: against, 1: for, 2: abstain)
     */
    function getUserVote(address voter) external view returns (bool hasVoted, uint8 choice) {
        return (votingData.hasVoted[voter], votingData.voteChoice[voter]);
    }
    
    /**
     * @dev Check if proposal has passed
     * @return passed True if proposal has passed
     */
    function hasPassed() external view returns (bool passed) {
        if (votingData.totalVotes < quorumRequired) {
            return false;
        }
        
        uint256 totalDecisiveVotes = votingData.forVotes + votingData.againstVotes;
        if (totalDecisiveVotes == 0) {
            return false;
        }
        
        return votingData.forVotes * 100 / totalDecisiveVotes >= majorityThreshold;
    }
}
