import { network } from "hardhat";
import fs from "node:fs";
import path from "node:path";

const { ethers } = await network.create();

console.log("Deploying SupplyChainTracker for frontend UI...");

const tracker = await ethers.deployContract("SupplyChainTracker");
await tracker.waitForDeployment();

const contractAddress = await tracker.getAddress();

console.log("SupplyChainTracker deployed to:", contractAddress);

const artifactPath = path.join(
  process.cwd(),
  "artifacts/contracts/SupplyChainTracker.sol/SupplyChainTracker.json"
);

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

const outputDir = path.join(process.cwd(), "frontend/src");

fs.mkdirSync(outputDir, { recursive: true });

fs.writeFileSync(
  path.join(outputDir, "contract-info.json"),
  JSON.stringify(
    {
      address: contractAddress,
      abi: artifact.abi,
    },
    null,
    2
  )
);

console.log("Contract address and ABI saved to frontend/src/contract-info.json");
