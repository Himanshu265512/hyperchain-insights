const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Hyperchain Insights deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "tMETIS");
  
  if (balance < ethers.parseEther("0.1")) {
    console.error("⚠️  Warning: Low balance. Make sure you have enough tMETIS for deployment.");
  }

  // Deploy TransactionMonitor contract
  console.log("\n📝 Deploying TransactionMonitor...");
  const TransactionMonitor = await ethers.getContractFactory("TransactionMonitor");
  const transactionMonitor = await TransactionMonitor.deploy();
  await transactionMonitor.waitForDeployment();
  
  const monitorAddress = await transactionMonitor.getAddress();
  console.log("✅ TransactionMonitor deployed to:", monitorAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const totalAnalyzed = await transactionMonitor.totalTransactionsAnalyzed();
  console.log("Initial transactions analyzed:", totalAnalyzed.toString());

  // Save deployment info
  const deploymentInfo = {
    network: "hyperion_testnet",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      TransactionMonitor: {
        address: monitorAddress,
        transactionHash: transactionMonitor.deploymentTransaction()?.hash,
      },
    },
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, "hyperion_testnet.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n💾 Deployment info saved to:", deploymentFile);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("Contract address:", monitorAddress);
  console.log("Next steps:");
  console.log("1. Update your .env file with the contract address");
  console.log("2. Start the indexing service");
  console.log("3. Begin transaction monitoring");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });