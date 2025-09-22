import { ethers } from "hardhat";
import { ClimateToken, ClimateDAO } from "../typechain-types";

async function main() {
  console.log("Starting ClimateDAO deployment...");

  // Get the deployer account
  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("No signers available. Please check your private key configuration.");
  }
  
  const deployer = signers[0];
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy ClimateToken
  console.log("\nDeploying ClimateToken...");
  const ClimateTokenFactory = await ethers.getContractFactory("ClimateToken");
  const climateToken = await ClimateTokenFactory.deploy();
  await climateToken.waitForDeployment();
  
  const climateTokenAddress = await climateToken.getAddress();
  console.log("ClimateToken deployed to:", climateTokenAddress);

  // Deploy ClimateDAO
  console.log("\nDeploying ClimateDAO...");
  const ClimateDAOFactory = await ethers.getContractFactory("ClimateDAO");
  const climateDAO = await ClimateDAOFactory.deploy(climateTokenAddress);
  await climateDAO.waitForDeployment();
  
  const climateDAOAddress = await climateDAO.getAddress();
  console.log("ClimateDAO deployed to:", climateDAOAddress);

  // Transfer initial tokens to DAO for funding
  console.log("\nTransferring initial tokens to DAO...");
  const transferTx = await climateToken.transfer(climateDAOAddress, ethers.parseEther("100000")); // 100k tokens
  await transferTx.wait();
  console.log("Transferred 100,000 tokens to DAO");

  // Verify deployments
  console.log("\nVerifying deployments...");
  const tokenBalance = await climateToken.balanceOf(climateDAOAddress);
  console.log("DAO token balance:", ethers.formatEther(tokenBalance));

  // Save deployment info
  const deploymentInfo = {
    network: "apothem",
    chainId: 51,
    deployer: deployer.address,
    contracts: {
      ClimateToken: {
        address: climateTokenAddress,
        constructorArgs: []
      },
      ClimateDAO: {
        address: climateDAOAddress,
        constructorArgs: [climateTokenAddress]
      }
    },
    timestamp: new Date().toISOString()
  };

  console.log("\nDeployment completed successfully!");
  console.log("Deployment info:", JSON.stringify(deploymentInfo, null, 2));

  // Export addresses for frontend
  console.log("\nFrontend environment variables:");
  console.log(`VITE_CLIMATE_TOKEN_ADDRESS=${climateTokenAddress}`);
  console.log(`VITE_CLIMATE_DAO_ADDRESS=${climateDAOAddress}`);
  console.log(`VITE_XDC_CHAIN_ID=51`);
  console.log(`VITE_XDC_RPC_URL=https://rpc.apothem.network`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
