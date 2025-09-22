import { ethers } from "hardhat";
import { ClimateDAO, ClimateToken } from "../typechain-types";

async function main() {
  console.log("🚀 Starting ClimateDAO deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy ClimateDAO contract
  console.log("\n📋 Deploying ClimateDAO contract...");
  const ClimateDAOFactory = await ethers.getContractFactory("ClimateDAO");
  const climateDAO = await ClimateDAOFactory.deploy();
  await climateDAO.deployed();
  
  console.log("✅ ClimateDAO deployed to:", climateDAO.address);

  // Get the ClimateToken address from the deployed contract
  const tokenAddress = await climateDAO.climateToken();
  console.log("✅ ClimateToken deployed to:", tokenAddress);

  // Add some initial members
  console.log("\n👥 Adding initial members...");
  const members = [
    deployer.address,
    "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6", // Example address
    "0x8ba1f109551bD432803012645Hac136c4c8b8C8"  // Example address
  ];

  for (const member of members) {
    try {
      await climateDAO.addMember(member);
      console.log(`✅ Added member: ${member}`);
    } catch (error) {
      console.log(`❌ Failed to add member ${member}:`, error);
    }
  }

  // Create a sample proposal
  console.log("\n📝 Creating sample proposal...");
  try {
    const tx = await climateDAO.createProposal(
      "Plant 1000 Trees in Amazon Rainforest",
      "This proposal aims to fund a reforestation project in the Amazon rainforest to combat deforestation and climate change. The project will plant 1000 native tree species over 6 months.",
      ethers.utils.parseEther("1000"), // 1000 XDC
      7 * 24 * 60 * 60, // 7 days
      "QmSampleIPFSHash123456789"
    );
    await tx.wait();
    console.log("✅ Sample proposal created");
  } catch (error) {
    console.log("❌ Failed to create sample proposal:", error);
  }

  // Deposit some initial funds
  console.log("\n💰 Depositing initial funds...");
  try {
    const depositTx = await climateDAO.depositFunds({
      value: ethers.utils.parseEther("5000") // 5000 XDC
    });
    await depositTx.wait();
    console.log("✅ Initial funds deposited");
  } catch (error) {
    console.log("❌ Failed to deposit funds:", error);
  }

  // Update impact score for the proposal
  console.log("\n🤖 Updating AI impact score...");
  try {
    const impactTx = await climateDAO.updateImpactScore(0, 85); // 85% impact score
    await impactTx.wait();
    console.log("✅ Impact score updated to 85%");
  } catch (error) {
    console.log("❌ Failed to update impact score:", error);
  }

  // Display deployment summary
  console.log("\n🎉 Deployment Summary:");
  console.log("========================");
  console.log(`ClimateDAO Contract: ${climateDAO.address}`);
  console.log(`ClimateToken Contract: ${tokenAddress}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Network: ${await climateDAO.provider.getNetwork().then(n => n.name)}`);
  console.log(`Chain ID: ${await climateDAO.provider.getNetwork().then(n => n.chainId)}`);
  
  // Save deployment info
  const deploymentInfo = {
    network: await climateDAO.provider.getNetwork().then(n => n.name),
    chainId: await climateDAO.provider.getNetwork().then(n => n.chainId),
    climateDAO: climateDAO.address,
    climateToken: tokenAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await climateDAO.provider.getBlockNumber()
  };

  console.log("\n📄 Deployment info saved to deployment-info.json");
  
  // Write deployment info to file
  const fs = require('fs');
  fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));

  console.log("\n✅ Deployment completed successfully!");
  console.log("\n🔗 Next steps:");
  console.log("1. Update frontend configuration with contract addresses");
  console.log("2. Test the deployed contracts");
  console.log("3. Deploy frontend to hosting service");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
