import { ethers } from "hardhat";
import { expect } from "chai";
import { ClimateDAO, ClimateToken } from "../typechain-types";

describe("ClimateDAO", function () {
  let climateDAO: ClimateDAO;
  let climateToken: ClimateToken;
  let owner: any;
  let member1: any;
  let member2: any;
  let nonMember: any;

  beforeEach(async function () {
    [owner, member1, member2, nonMember] = await ethers.getSigners();

    // Deploy ClimateDAO
    const ClimateDAOFactory = await ethers.getContractFactory("ClimateDAO");
    climateDAO = await ClimateDAOFactory.deploy();
    await climateDAO.deployed();

    // Get ClimateToken address
    const tokenAddress = await climateDAO.climateToken();
    climateToken = await ethers.getContractAt("ClimateToken", tokenAddress);

    // Add members
    await climateDAO.addMember(member1.address);
    await climateDAO.addMember(member2.address);
  });

  describe("Deployment", function () {
    it("Should deploy with correct initial state", async function () {
      expect(await climateDAO.owner()).to.equal(owner.address);
      expect(await climateDAO.getProposalCount()).to.equal(0);
      expect(await climateDAO.totalFundsRaised()).to.equal(0);
    });

    it("Should deploy ClimateToken with correct initial supply", async function () {
      const totalSupply = await climateToken.totalSupply();
      expect(totalSupply).to.equal(ethers.utils.parseEther("1000000"));
    });
  });

  describe("Membership", function () {
    it("Should allow owner to add members", async function () {
      await expect(climateDAO.addMember(member1.address))
        .to.emit(climateDAO, "MemberAdded")
        .withArgs(member1.address);
      
      expect(await climateDAO.isMember(member1.address)).to.be.true;
    });

    it("Should not allow non-owner to add members", async function () {
      await expect(
        climateDAO.connect(member1).addMember(member2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow adding existing members", async function () {
      await expect(
        climateDAO.addMember(member1.address)
      ).to.be.revertedWith("ClimateDAO: Already a member");
    });
  });

  describe("Proposal Creation", function () {
    it("Should allow members to create proposals", async function () {
      const tx = await climateDAO.connect(member1).createProposal(
        "Test Proposal",
        "This is a test proposal",
        ethers.utils.parseEther("100"),
        7 * 24 * 60 * 60, // 7 days
        "QmTestHash"
      );

      await expect(tx)
        .to.emit(climateDAO, "ProposalCreated")
        .withArgs(0, member1.address, "Test Proposal", ethers.utils.parseEther("100"), anyValue);

      const proposal = await climateDAO.getProposal(0);
      expect(proposal.proposer).to.equal(member1.address);
      expect(proposal.title).to.equal("Test Proposal");
      expect(proposal.requestedAmount).to.equal(ethers.utils.parseEther("100"));
    });

    it("Should not allow non-members to create proposals", async function () {
      await expect(
        climateDAO.connect(nonMember).createProposal(
          "Test Proposal",
          "This is a test proposal",
          ethers.utils.parseEther("100"),
          7 * 24 * 60 * 60,
          "QmTestHash"
        )
      ).to.be.revertedWith("ClimateDAO: Not a member");
    });

    it("Should not allow proposals with invalid duration", async function () {
      await expect(
        climateDAO.connect(member1).createProposal(
          "Test Proposal",
          "This is a test proposal",
          ethers.utils.parseEther("100"),
          6 * 24 * 60 * 60, // Less than 7 days
          "QmTestHash"
        )
      ).to.be.revertedWith("ClimateDAO: Duration too short");
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      // Create a proposal
      await climateDAO.connect(member1).createProposal(
        "Test Proposal",
        "This is a test proposal",
        ethers.utils.parseEther("100"),
        7 * 24 * 60 * 60,
        "QmTestHash"
      );

      // Transfer some tokens to members for voting
      await climateToken.transfer(member1.address, ethers.utils.parseEther("1000"));
      await climateToken.transfer(member2.address, ethers.utils.parseEther("1000"));
    });

    it("Should allow members to vote", async function () {
      const tx = await climateDAO.connect(member1).vote(0, true);
      
      await expect(tx)
        .to.emit(climateDAO, "VoteCast")
        .withArgs(0, member1.address, true, ethers.utils.parseEther("1000"));

      const proposal = await climateDAO.getProposal(0);
      expect(proposal.yesVotes).to.equal(ethers.utils.parseEther("1000"));
    });

    it("Should not allow non-members to vote", async function () {
      await expect(
        climateDAO.connect(nonMember).vote(0, true)
      ).to.be.revertedWith("ClimateDAO: Not a member");
    });

    it("Should not allow double voting", async function () {
      await climateDAO.connect(member1).vote(0, true);
      
      await expect(
        climateDAO.connect(member1).vote(0, false)
      ).to.be.revertedWith("ClimateDAO: Already voted");
    });
  });

  describe("Fund Management", function () {
    it("Should allow deposits", async function () {
      const depositAmount = ethers.utils.parseEther("1000");
      const tx = await climateDAO.depositFunds({ value: depositAmount });
      
      await expect(tx)
        .to.emit(climateDAO, "FundsDeposited")
        .withArgs(owner.address, depositAmount);

      expect(await climateDAO.totalFundsRaised()).to.equal(depositAmount);
    });

    it("Should not allow zero deposits", async function () {
      await expect(
        climateDAO.depositFunds({ value: 0 })
      ).to.be.revertedWith("ClimateDAO: No funds sent");
    });
  });

  describe("Impact Score", function () {
    it("Should allow owner to update impact score", async function () {
      // Create a proposal first
      await climateDAO.connect(member1).createProposal(
        "Test Proposal",
        "This is a test proposal",
        ethers.utils.parseEther("100"),
        7 * 24 * 60 * 60,
        "QmTestHash"
      );

      const tx = await climateDAO.updateImpactScore(0, 85);
      
      await expect(tx)
        .to.emit(climateDAO, "ImpactScoreUpdated")
        .withArgs(0, 85);

      const proposal = await climateDAO.getProposal(0);
      expect(proposal.impactScore).to.equal(85);
    });

    it("Should not allow invalid impact scores", async function () {
      await climateDAO.connect(member1).createProposal(
        "Test Proposal",
        "This is a test proposal",
        ethers.utils.parseEther("100"),
        7 * 24 * 60 * 60,
        "QmTestHash"
      );

      await expect(
        climateDAO.updateImpactScore(0, 101)
      ).to.be.revertedWith("ClimateDAO: Invalid score");
    });
  });
});

describe("ClimateToken", function () {
  let climateToken: ClimateToken;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const ClimateTokenFactory = await ethers.getContractFactory("ClimateToken");
    climateToken = await ClimateTokenFactory.deploy();
    await climateToken.deployed();
  });

  describe("Deployment", function () {
    it("Should deploy with correct initial supply", async function () {
      const totalSupply = await climateToken.totalSupply();
      expect(totalSupply).to.equal(ethers.utils.parseEther("1000000"));
    });

    it("Should have correct name and symbol", async function () {
      expect(await climateToken.name()).to.equal("ClimateDAO Token");
      expect(await climateToken.symbol()).to.equal("CLIMATE");
    });
  });

  describe("Staking", function () {
    beforeEach(async function () {
      // Transfer some tokens to user1 for staking
      await climateToken.transfer(user1.address, ethers.utils.parseEther("1000"));
    });

    it("Should allow users to stake tokens", async function () {
      const stakeAmount = ethers.utils.parseEther("100");
      const tx = await climateToken.connect(user1).stake(stakeAmount);
      
      await expect(tx)
        .to.emit(climateToken, "TokensStaked")
        .withArgs(user1.address, stakeAmount);

      const stakingInfo = await climateToken.getStakingInfo(user1.address);
      expect(stakingInfo.staked).to.equal(stakeAmount);
    });

    it("Should not allow staking zero tokens", async function () {
      await expect(
        climateToken.connect(user1).stake(0)
      ).to.be.revertedWith("ClimateToken: Amount must be greater than 0");
    });

    it("Should not allow staking more than balance", async function () {
      const balance = await climateToken.balanceOf(user1.address);
      const stakeAmount = balance.add(ethers.utils.parseEther("1"));
      
      await expect(
        climateToken.connect(user1).stake(stakeAmount)
      ).to.be.revertedWith("ClimateToken: Insufficient balance");
    });
  });

  describe("Rewards", function () {
    beforeEach(async function () {
      // Transfer tokens and stake them
      await climateToken.transfer(user1.address, ethers.utils.parseEther("1000"));
      await climateToken.connect(user1).stake(ethers.utils.parseEther("100"));
    });

    it("Should calculate rewards correctly", async function () {
      // Fast forward time by 1 year
      await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      const rewards = await climateToken.calculateRewards(user1.address);
      expect(rewards).to.be.closeTo(ethers.utils.parseEther("10"), ethers.utils.parseEther("0.1"));
    });

    it("Should allow claiming rewards", async function () {
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      const tx = await climateToken.connect(user1).claimRewards();
      
      await expect(tx)
        .to.emit(climateToken, "RewardsClaimed")
        .withArgs(user1.address, anyValue);
    });
  });
});

// Helper function for anyValue matcher
function anyValue() {
  return true;
}
