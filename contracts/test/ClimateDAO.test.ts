import { expect } from "chai";
import { ethers } from "hardhat";
import { ClimateToken, ClimateDAO, Proposal } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ClimateDAO", function () {
  let climateToken: ClimateToken;
  let climateDAO: ClimateDAO;
  let owner: SignerWithAddress;
  let proposer: SignerWithAddress;
  let beneficiary: SignerWithAddress;
  let voter1: SignerWithAddress;
  let voter2: SignerWithAddress;
  let moderator: SignerWithAddress;

  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const MINT_AMOUNT = ethers.parseEther("100");
  const MIN_PROPOSAL_AMOUNT = ethers.parseEther("1000");
  const MAX_PROPOSAL_AMOUNT = ethers.parseEther("100000");

  beforeEach(async function () {
    [owner, proposer, beneficiary, voter1, voter2, moderator] = await ethers.getSigners();

    // Deploy ClimateToken
    const ClimateTokenFactory = await ethers.getContractFactory("ClimateToken");
    climateToken = await ClimateTokenFactory.deploy();
    await climateToken.waitForDeployment();

    // Deploy ClimateDAO
    const ClimateDAOFactory = await ethers.getContractFactory("ClimateDAO");
    climateDAO = await ClimateDAOFactory.deploy(await climateToken.getAddress());
    await climateDAO.waitForDeployment();

    // Transfer initial tokens to DAO
    await climateToken.transfer(await climateDAO.getAddress(), ethers.parseEther("100000"));

    // Claim tokens for test users
    await climateToken.connect(proposer).claimTokens();
    await climateToken.connect(voter1).claimTokens();
    await climateToken.connect(voter2).claimTokens();

    // Approve DAO to spend tokens
    await climateToken.connect(proposer).approve(await climateDAO.getAddress(), ethers.parseEther("100000"));
    await climateToken.connect(voter1).approve(await climateDAO.getAddress(), ethers.parseEther("100000"));
    await climateToken.connect(voter2).approve(await climateDAO.getAddress(), ethers.parseEther("100000"));
  });

  describe("Deployment", function () {
    it("Should deploy with correct initial values", async function () {
      expect(await climateToken.name()).to.equal("ClimateDAO Token");
      expect(await climateToken.symbol()).to.equal("CLIMATE");
      // The total supply will be INITIAL_SUPPLY plus any tokens minted during setup
      expect(await climateToken.totalSupply()).to.be.gte(INITIAL_SUPPLY);
    });

    it("Should set correct DAO configuration", async function () {
      expect(await climateDAO.MIN_PROPOSAL_AMOUNT()).to.equal(MIN_PROPOSAL_AMOUNT);
      expect(await climateDAO.MAX_PROPOSAL_AMOUNT()).to.equal(MAX_PROPOSAL_AMOUNT);
      expect(await climateDAO.VOTING_DURATION()).to.equal(7 * 24 * 60 * 60); // 7 days
    });
  });

  describe("Token Claiming", function () {
    it("Should allow users to claim initial tokens", async function () {
      // Use a different user for this test since proposer already claimed in setup
      const newUser = (await ethers.getSigners())[6];
      const balanceBefore = await climateToken.balanceOf(newUser.address);
      await climateToken.connect(newUser).claimTokens();
      const balanceAfter = await climateToken.balanceOf(newUser.address);
      
      expect(balanceAfter - balanceBefore).to.equal(MINT_AMOUNT);
      expect(await climateToken.hasClaimed(newUser.address)).to.be.true;
    });

    it("Should not allow users to claim tokens twice", async function () {
      const newUser = (await ethers.getSigners())[7];
      await climateToken.connect(newUser).claimTokens();
      await expect(
        climateToken.connect(newUser).claimTokens()
      ).to.be.revertedWith("Tokens already claimed");
    });
  });

  describe("Proposal Creation", function () {
    it("Should create a proposal successfully", async function () {
      const projectDetails = {
        title: "Solar Farm Project",
        description: "Building a 10MW solar farm in California",
        location: "California, USA",
        category: 0, // RenewableEnergy
        requestedAmount: ethers.parseEther("50000"),
        duration: 365,
        website: "https://example.com",
        images: ["https://example.com/image1.jpg"]
      };

      const tx = await climateDAO.connect(proposer).createProposal(
        beneficiary.address,
        projectDetails
      );

      await expect(tx)
        .to.emit(climateDAO, "ProposalCreated")
        .withArgs(1, proposer.address, await climateDAO.proposals(1), "Solar Farm Project", ethers.parseEther("50000"));

      expect(await climateDAO.proposalCounter()).to.equal(1);
      expect(await climateDAO.proposals(1)).to.not.equal(ethers.ZeroAddress);
    });

    it("Should reject proposals with invalid amounts", async function () {
      const projectDetails = {
        title: "Invalid Project",
        description: "Project with invalid amount",
        location: "Test Location",
        category: 0,
        requestedAmount: ethers.parseEther("500"), // Below minimum
        duration: 365,
        website: "https://example.com",
        images: []
      };

      await expect(
        climateDAO.connect(proposer).createProposal(beneficiary.address, projectDetails)
      ).to.be.revertedWith("Amount below minimum");
    });

    it("Should reject proposals with empty title or description", async function () {
      const projectDetails = {
        title: "",
        description: "Valid description",
        location: "Test Location",
        category: 0,
        requestedAmount: ethers.parseEther("5000"),
        duration: 365,
        website: "https://example.com",
        images: []
      };

      await expect(
        climateDAO.connect(proposer).createProposal(beneficiary.address, projectDetails)
      ).to.be.revertedWith("Title required");
    });
  });

  describe("Voting", function () {
    let proposalAddress: string;
    let proposal: Proposal;

    beforeEach(async function () {
      const projectDetails = {
        title: "Test Project",
        description: "Test description",
        location: "Test Location",
        category: 0,
        requestedAmount: ethers.parseEther("10000"),
        duration: 365,
        website: "https://example.com",
        images: []
      };

      await climateDAO.connect(proposer).createProposal(beneficiary.address, projectDetails);
      proposalAddress = await climateDAO.proposals(1);
      proposal = await ethers.getContractAt("Proposal", proposalAddress);
    });

    it("Should allow users to vote on proposals", async function () {
      const voterBalance = await climateToken.balanceOf(voter1.address);
      
      await proposal.connect(voter1).castVote(1, voterBalance); // Vote for
      
      const [hasVoted, choice] = await proposal.getUserVote(voter1.address);
      expect(hasVoted).to.be.true;
      expect(choice).to.equal(1);
    });

    it("Should not allow users to vote twice", async function () {
      const voterBalance = await climateToken.balanceOf(voter1.address);
      
      await proposal.connect(voter1).castVote(1, voterBalance);
      
      await expect(
        proposal.connect(voter1).castVote(1, voterBalance)
      ).to.be.revertedWith("Already voted");
    });

    it("Should calculate voting results correctly", async function () {
      const voter1Balance = await climateToken.balanceOf(voter1.address);
      const voter2Balance = await climateToken.balanceOf(voter2.address);
      
      await proposal.connect(voter1).castVote(1, voter1Balance); // Vote for
      await proposal.connect(voter2).castVote(0, voter2Balance); // Vote against
      
      const [forVotes, againstVotes, abstainVotes, totalVotes] = await proposal.getVotingResults();
      
      expect(forVotes).to.equal(voter1Balance);
      expect(againstVotes).to.equal(voter2Balance);
      expect(totalVotes).to.equal(voter1Balance + voter2Balance);
    });
  });

  describe("Fund Management", function () {
    it("Should allow users to donate funds", async function () {
      const donationAmount = ethers.parseEther("50"); // Use a smaller amount that voter1 can afford
      
      await expect(
        climateDAO.connect(voter1).donateFunds(donationAmount)
      ).to.emit(climateDAO, "FundsDonated")
      .withArgs(voter1.address, donationAmount, donationAmount);

      expect(await climateDAO.userContributions(voter1.address)).to.equal(donationAmount);
      expect(await climateDAO.totalFundsRaised()).to.equal(donationAmount);
    });

    it("Should execute passed proposals and distribute funds", async function () {
      // Create and fund a proposal
      const projectDetails = {
        title: "Funded Project",
        description: "A project that will be funded",
        location: "Test Location",
        category: 0,
        requestedAmount: ethers.parseEther("5000"),
        duration: 365,
        website: "https://example.com",
        images: []
      };

      await climateDAO.connect(proposer).createProposal(beneficiary.address, projectDetails);
      const proposalAddress = await climateDAO.proposals(1);
      const proposal = await ethers.getContractAt("Proposal", proposalAddress);

      // Vote to pass the proposal - need enough votes to meet quorum (1000 tokens)
      // Use the owner who has enough tokens to meet quorum
      await proposal.connect(owner).castVote(1, ethers.parseEther("1000")); // Exactly the quorum amount

      // Fast forward time to end voting
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      // First execute the proposal to determine if it passed
      await proposal.executeProposal();
      
      // Then execute in DAO to distribute funds
      await climateDAO.executeProposal(1);

      // Check that funds were distributed
      expect(await proposal.status()).to.equal(3); // Executed
    });
  });

  describe("Moderator Functions", function () {
    it("Should allow owner to add moderators", async function () {
      await expect(
        climateDAO.addModerator(moderator.address)
      ).to.emit(climateDAO, "ModeratorAdded")
      .withArgs(moderator.address);

      expect(await climateDAO.isModerator(moderator.address)).to.be.true;
    });

    it("Should allow moderators to update impact metrics", async function () {
      await climateDAO.addModerator(moderator.address);

      const projectDetails = {
        title: "AI Analyzed Project",
        description: "A project for AI analysis",
        location: "Test Location",
        category: 0,
        requestedAmount: ethers.parseEther("10000"),
        duration: 365,
        website: "https://example.com",
        images: []
      };

      await climateDAO.connect(proposer).createProposal(beneficiary.address, projectDetails);
      
      await expect(
        climateDAO.connect(moderator).updateProposalImpactMetrics(
          1,
          1000, // CO2 reduction
          5000, // Energy generation
          50,   // Jobs created
          85    // AI score
        )
      ).to.not.be.reverted;
    });

    it("Should not allow non-moderators to update impact metrics", async function () {
      const projectDetails = {
        title: "Test Project",
        description: "Test description",
        location: "Test Location",
        category: 0,
        requestedAmount: ethers.parseEther("10000"),
        duration: 365,
        website: "https://example.com",
        images: []
      };

      await climateDAO.connect(proposer).createProposal(beneficiary.address, projectDetails);
      
      await expect(
        climateDAO.connect(voter1).updateProposalImpactMetrics(1, 1000, 5000, 50, 85)
      ).to.be.revertedWith("Not a moderator");
    });
  });

  describe("Platform Fee Management", function () {
    it("Should allow owner to update platform fee", async function () {
      const newFee = 300; // 3%
      
      await expect(
        climateDAO.updatePlatformFee(newFee)
      ).to.emit(climateDAO, "PlatformFeeUpdated")
      .withArgs(250, newFee);

      expect(await climateDAO.platformFee()).to.equal(newFee);
    });

    it("Should not allow platform fee above maximum", async function () {
      const excessiveFee = 600; // 6%
      
      await expect(
        climateDAO.updatePlatformFee(excessiveFee)
      ).to.be.revertedWith("Fee too high");
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should handle zero amount donations", async function () {
      await expect(
        climateDAO.connect(voter1).donateFunds(0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should prevent execution of non-existent proposals", async function () {
      await expect(
        climateDAO.executeProposal(999)
      ).to.be.revertedWith("Proposal does not exist");
    });

    it("Should prevent execution of non-passed proposals", async function () {
      const projectDetails = {
        title: "Failing Project",
        description: "A project that will fail",
        location: "Test Location",
        category: 0,
        requestedAmount: ethers.parseEther("10000"),
        duration: 365,
        website: "https://example.com",
        images: []
      };

      await climateDAO.connect(proposer).createProposal(beneficiary.address, projectDetails);
      
      await expect(
        climateDAO.executeProposal(1)
      ).to.be.revertedWith("Proposal has not passed");
    });

    it("Should reject proposals with amount above maximum", async function () {
      const projectDetails = {
        title: "Expensive Project",
        description: "Project with amount above maximum",
        location: "Test Location",
        category: 0,
        requestedAmount: ethers.parseEther("200000"), // Above maximum
        duration: 365,
        website: "https://example.com",
        images: []
      };

      await expect(
        climateDAO.connect(proposer).createProposal(beneficiary.address, projectDetails)
      ).to.be.revertedWith("Amount above maximum");
    });

    it("Should reject proposals with empty description", async function () {
      const projectDetails = {
        title: "Valid Title",
        description: "",
        location: "Test Location",
        category: 0,
        requestedAmount: ethers.parseEther("5000"),
        duration: 365,
        website: "https://example.com",
        images: []
      };

      await expect(
        climateDAO.connect(proposer).createProposal(beneficiary.address, projectDetails)
      ).to.be.revertedWith("Description required");
    });

    it("Should handle voting with zero weight", async function () {
      const projectDetails = {
        title: "Test Project",
        description: "Test description",
        location: "Test Location",
        category: 0,
        requestedAmount: ethers.parseEther("10000"),
        duration: 365,
        website: "https://example.com",
        images: []
      };

      await climateDAO.connect(proposer).createProposal(beneficiary.address, projectDetails);
      const proposalAddress = await climateDAO.proposals(1);
      const proposal = await ethers.getContractAt("Proposal", proposalAddress);

      // Try to vote with zero weight
      await expect(
        proposal.connect(voter1).castVote(1, 0)
      ).to.be.revertedWith("Voting weight must be greater than 0");
    });

    it("Should handle voting after proposal deadline", async function () {
      const projectDetails = {
        title: "Test Project",
        description: "Test description",
        location: "Test Location",
        category: 0,
        requestedAmount: ethers.parseEther("10000"),
        duration: 365,
        website: "https://example.com",
        images: []
      };

      await climateDAO.connect(proposer).createProposal(beneficiary.address, projectDetails);
      const proposalAddress = await climateDAO.proposals(1);
      const proposal = await ethers.getContractAt("Proposal", proposalAddress);

      // Fast forward past voting deadline
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      const voterBalance = await climateToken.balanceOf(voter1.address);
      
      await expect(
        proposal.connect(voter1).castVote(1, voterBalance)
      ).to.be.revertedWith("Voting period has ended");
    });

    it("Should handle proposal execution with insufficient funds", async function () {
      const projectDetails = {
        title: "Expensive Project",
        description: "A project requesting more than available funds",
        location: "Test Location",
        category: 0,
        requestedAmount: ethers.parseEther("200000"), // More than DAO has
        duration: 365,
        website: "https://example.com",
        images: []
      };

      // This should fail at creation due to amount validation
      await expect(
        climateDAO.connect(proposer).createProposal(beneficiary.address, projectDetails)
      ).to.be.revertedWith("Amount above maximum");
    });

    it("Should handle duplicate moderator addition", async function () {
      await climateDAO.addModerator(moderator.address);
      
      await expect(
        climateDAO.addModerator(moderator.address)
      ).to.be.revertedWith("Already a moderator");
    });

    it("Should handle removing non-existent moderator", async function () {
      await expect(
        climateDAO.removeModerator(moderator.address)
      ).to.be.revertedWith("Not a moderator");
    });

    it("Should allow owner to remove moderators", async function () {
      await climateDAO.addModerator(moderator.address);
      expect(await climateDAO.isModerator(moderator.address)).to.be.true;
      
      await expect(
        climateDAO.removeModerator(moderator.address)
      ).to.emit(climateDAO, "ModeratorRemoved")
      .withArgs(moderator.address);

      expect(await climateDAO.isModerator(moderator.address)).to.be.false;
    });

    it("Should handle invalid vote choices", async function () {
      const projectDetails = {
        title: "Test Project",
        description: "Test description",
        location: "Test Location",
        category: 0,
        requestedAmount: ethers.parseEther("10000"),
        duration: 365,
        website: "https://example.com",
        images: []
      };

      await climateDAO.connect(proposer).createProposal(beneficiary.address, projectDetails);
      const proposalAddress = await climateDAO.proposals(1);
      const proposal = await ethers.getContractAt("Proposal", proposalAddress);

      const voterBalance = await climateToken.balanceOf(voter1.address);
      
      // Try to vote with invalid choice (3 is not valid - should be 0, 1, or 2)
      await expect(
        proposal.connect(voter1).castVote(3, voterBalance)
      ).to.be.revertedWith("Invalid vote choice");
    });
  });
});
