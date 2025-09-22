import { ethers } from "hardhat";
import { ClimateDAO, ClimateToken } from "../typechain-types";

async function main() {
  console.log("🔧 ClimateDAO Interaction Script");
  console.log("================================");

  // Load deployment info
  const fs = require('fs');
  let deploymentInfo;
  try {
    deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
    console.log("📄 Loaded deployment info from deployment-info.json");
  } catch (error) {
    console.error("❌ Could not load deployment info. Please run deploy script first.");
    return;
  }

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // Connect to deployed contracts
  const climateDAO = await ethers.getContractAt("ClimateDAO", deploymentInfo.climateDAO);
  const climateToken = await ethers.getContractAt("ClimateToken", deploymentInfo.climateToken);

  console.log("\n📊 Contract Information:");
  console.log(`ClimateDAO: ${climateDAO.address}`);
  console.log(`ClimateToken: ${climateToken.address}`);

  // Get contract state
  console.log("\n📈 Contract State:");
  const proposalCount = await climateDAO.getProposalCount();
  const totalFundsRaised = await climateDAO.totalFundsRaised();
  const tokenTotalSupply = await climateToken.totalSupply();
  const tokenBalance = await climateToken.balanceOf(signer.address);

  console.log(`Total Proposals: ${proposalCount}`);
  console.log(`Total Funds Raised: ${ethers.utils.formatEther(totalFundsRaised)} XDC`);
  console.log(`Token Total Supply: ${ethers.utils.formatEther(tokenTotalSupply)} CLIMATE`);
  console.log(`Your Token Balance: ${ethers.utils.formatEther(tokenBalance)} CLIMATE`);

  // Display existing proposals
  if (proposalCount.gt(0)) {
    console.log("\n📋 Existing Proposals:");
    for (let i = 0; i < proposalCount.toNumber(); i++) {
      const proposal = await climateDAO.getProposal(i);
      const isPassed = await climateDAO.isProposalPassed(i);
      
      console.log(`\nProposal ${i}:`);
      console.log(`  Title: ${proposal.title}`);
      console.log(`  Proposer: ${proposal.proposer}`);
      console.log(`  Requested Amount: ${ethers.utils.formatEther(proposal.requestedAmount)} XDC`);
      console.log(`  Yes Votes: ${ethers.utils.formatEther(proposal.yesVotes)} CLIMATE`);
      console.log(`  No Votes: ${ethers.utils.formatEther(proposal.noVotes)} CLIMATE`);
      console.log(`  Impact Score: ${proposal.impactScore}%`);
      console.log(`  Status: ${proposal.executed ? 'Executed' : proposal.cancelled ? 'Cancelled' : isPassed ? 'Passed' : 'Active'}`);
      console.log(`  End Time: ${new Date(proposal.endTime.toNumber() * 1000).toLocaleString()}`);
    }
  }

  // Interactive menu
  console.log("\n🎮 Available Actions:");
  console.log("1. Create a new proposal");
  console.log("2. Vote on a proposal");
  console.log("3. Execute a proposal");
  console.log("4. Deposit funds");
  console.log("5. Stake tokens");
  console.log("6. Claim staking rewards");
  console.log("7. Update impact score (AI)");
  console.log("8. Exit");

  // For demonstration, let's create a new proposal
  console.log("\n📝 Creating a new proposal...");
  try {
    const tx = await climateDAO.createProposal(
      "Solar Panel Installation in Rural Areas",
      "This proposal aims to install solar panels in 50 rural households to provide clean energy access and reduce carbon emissions. The project will be completed over 12 months with regular progress reports.",
      ethers.utils.parseEther("2500"), // 2500 XDC
      14 * 24 * 60 * 60, // 14 days
      "QmSolarPanelProjectHash987654321"
    );
    await tx.wait();
    console.log("✅ New proposal created successfully!");
  } catch (error) {
    console.log("❌ Failed to create proposal:", error);
  }

  // Demonstrate voting
  if (proposalCount.gt(0)) {
    console.log("\n🗳️ Voting on proposal 0...");
    try {
      const voteTx = await climateDAO.vote(0, true); // Vote yes
      await voteTx.wait();
      console.log("✅ Vote cast successfully!");
    } catch (error) {
      console.log("❌ Failed to vote:", error);
    }
  }

  // Demonstrate staking
  console.log("\n💰 Staking tokens...");
  try {
    const stakeAmount = ethers.utils.parseEther("100"); // Stake 100 tokens
    const stakeTx = await climateToken.stake(stakeAmount);
    await stakeTx.wait();
    console.log("✅ Tokens staked successfully!");
  } catch (error) {
    console.log("❌ Failed to stake tokens:", error);
  }

  // Check staking info
  console.log("\n📊 Staking Information:");
  try {
    const stakingInfo = await climateToken.getStakingInfo(signer.address);
    console.log(`Staked Amount: ${ethers.utils.formatEther(stakingInfo.staked)} CLIMATE`);
    console.log(`Pending Rewards: ${ethers.utils.formatEther(stakingInfo.rewards)} CLIMATE`);
    console.log(`Staking Start: ${new Date(stakingInfo.stakingStart.toNumber() * 1000).toLocaleString()}`);
  } catch (error) {
    console.log("❌ Failed to get staking info:", error);
  }

  console.log("\n✅ Interaction script completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Interaction failed:", error);
    process.exit(1);
  });
