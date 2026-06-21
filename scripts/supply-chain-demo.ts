import { network } from "hardhat";

const { ethers } = await network.create();

function statusName(status: bigint | number): string {
  const statuses = ["Created", "Shipped", "Received", "Sold"];
  return statuses[Number(status)];
}

console.log("Starting Supply Chain Tracking demo...\n");

const [manufacturer, distributor, retailer, customer] = await ethers.getSigners();

console.log("Participants:");
console.log("Manufacturer:", manufacturer.address);
console.log("Distributor :", distributor.address);
console.log("Retailer    :", retailer.address);
console.log("Customer    :", customer.address);
console.log("");

const tracker = await ethers.deployContract("SupplyChainTracker");
await tracker.waitForDeployment();

const contractAddress = await tracker.getAddress();

console.log("SupplyChainTracker deployed to:", contractAddress);
console.log("");

console.log("Authorizing distributor and retailer...");

let tx = await tracker.authorizeParticipant(distributor.address);
await tx.wait();

tx = await tracker.authorizeParticipant(retailer.address);
await tx.wait();

console.log("Distributor authorized:", await tracker.authorizedParticipants(distributor.address));
console.log("Retailer authorized   :", await tracker.authorizedParticipants(retailer.address));
console.log("");

const productData =
  "Product: PTIT Laptop | Serial: PTIT-2026-001 | Origin: Hanoi Factory";

const productHash = ethers.id(productData);

console.log("Creating product...");
console.log("Product data:", productData);
console.log("Product hash:", productHash);

tx = await tracker.createProduct(
  "PTIT Laptop",
  "Hanoi Factory",
  productHash
);

let receipt = await tx.wait();

const productId = 1;

console.log("Product created successfully");
console.log("Create transaction hash:", tx.hash);
console.log("Block number:", receipt?.blockNumber);
console.log("");

console.log("Updating product status: Created -> Shipped");

tx = await tracker
  .connect(distributor)
  .updateStatus(productId, 1, "Hanoi Warehouse");

receipt = await tx.wait();

console.log("Status updated to Shipped");
console.log("Transaction hash:", tx.hash);
console.log("Block number:", receipt?.blockNumber);
console.log("");

console.log("Updating product status: Shipped -> Received");

tx = await tracker
  .connect(retailer)
  .updateStatus(productId, 2, "PTIT Retail Store");

receipt = await tx.wait();

console.log("Status updated to Received");
console.log("Transaction hash:", tx.hash);
console.log("Block number:", receipt?.blockNumber);
console.log("");

console.log("Verifying product integrity...");

const isOriginalValid = await tracker.verifyProduct(productId, productHash);

const tamperedProductData =
  "Product: FAKE PTIT Laptop | Serial: PTIT-2026-001 | Origin: Unknown";

const tamperedHash = ethers.id(tamperedProductData);

const isTamperedValid = await tracker.verifyProduct(productId, tamperedHash);

console.log("Original product verification result:", isOriginalValid);
console.log("Tampered product verification result:", isTamperedValid);
console.log("");

console.log("Current product information:");

const product = await tracker.getProduct(productId);

console.log("Product ID       :", product[0].toString());
console.log("Product name     :", product[1]);
console.log("Product origin   :", product[2]);
console.log("Product hash     :", product[3]);
console.log("Current status   :", statusName(product[4]));
console.log("Current handler  :", product[5]);
console.log("Created timestamp:", product[6].toString());
console.log("");

console.log("Product history on blockchain:");

const historyCount = Number(await tracker.getHistoryCount(productId));

for (let i = 0; i < historyCount; i++) {
  const record = await tracker.getHistoryRecord(productId, i);

  console.log(
    `${i + 1}. Status: ${statusName(record[0])} | Location: ${record[1]} | Updated by: ${record[2]} | Timestamp: ${record[3].toString()}`
  );
}

console.log("");
console.log("Demo completed successfully.");
