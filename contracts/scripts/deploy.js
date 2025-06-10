// contracts/scripts/deploy.js
async function main() {
  console.log("Deploying contracts...");

  // Deploy NFT contract first
  const LuckLoopNFT = await ethers.getContractFactory("LuckLoopNFT");
  const nftContract = await LuckLoopNFT.deploy();
  await nftContract.deployed();
  console.log("NFT Contract deployed to:", nftContract.address);

  // Deploy Game contract (now only takes the NFT contract address)
  const LuckLoopGame = await ethers.getContractFactory("LuckLoopGame");
  const gameContract = await LuckLoopGame.deploy(nftContract.address);
  await gameContract.deployed();
  console.log("Game Contract deployed to:", gameContract.address);

  // Authorize game contract to mint NFTs
  await nftContract.setAuthorizedMinter(gameContract.address, true);
  console.log("Game contract authorized to mint NFTs");

  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("NFT Contract:", nftContract.address);
  console.log("Game Contract:", gameContract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
