const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying Luck Loop contracts...");

    // Deploy NFT contract
    const LuckLoopNFT = await ethers.getContractFactory("LuckLoopNFT");
    const nftContract = await LuckLoopNFT.deploy();
    await nftContract.deployed();
    console.log("LuckLoopNFT deployed to:", nftContract.address);

    // Deploy Game contract
    const LuckLoopGame = await ethers.getContractFactory("LuckLoopGame");
    const gameContract = await LuckLoopGame.deploy(nftContract.address);
    await gameContract.deployed();
    console.log("LuckLoopGame deployed to:", gameContract.address);

    // Set game contract as minter
    await nftContract.transferOwnership(gameContract.address);
    console.log("Ownership transferred to game contract");

    // Verify contracts on Etherscan
    if (network.name !== "hardhat" && network.name !== "localhost") {
        console.log("Waiting for block confirmations...");
        await nftContract.deployTransaction.wait(6);
        await gameContract.deployTransaction.wait(6);

        await hre.run("verify:verify", {
            address: nftContract.address,
            constructorArguments: [],
        });

        await hre.run("verify:verify", {
            address: gameContract.address,
            constructorArguments: [nftContract.address],
        });
    }

    console.log("\n=== Deployment Summary ===");
    console.log("NFT Contract:", nftContract.address);
    console.log("Game Contract:", gameContract.address);
    console.log("Network:", network.name);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
