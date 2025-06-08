const { ethers } = require('ethers');

class BlockchainService {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        
        // Initialize contracts
        this.gameContract = new ethers.Contract(
            process.env.GAME_CONTRACT_ADDRESS,
            require('../contracts/LuckLoopGame.json').abi,
            this.wallet
        );
        
        this.nftContract = new ethers.Contract(
            process.env.NFT_CONTRACT_ADDRESS,
            require('../contracts/LuckLoopNFT.json').abi,
            this.wallet
        );
    }

    async recordGameOnChain(playerAddress, gameResult) {
        try {
            const gameId = ethers.keccak256(
                ethers.toUtf8Bytes(`${playerAddress}_${Date.now()}_${gameResult.symbols.join('')}`)
            );

            // Create metadata for IPFS
            const metadata = {
                name: gameResult.name,
                description: gameResult.description,
                image: `${process.env.BASE_URL}/api/nft-image/${gameId}`,
                attributes: [
                    { trait_type: "Rarity", value: gameResult.rarity },
                    { trait_type: "Symbols", value: gameResult.symbols.join('') },
                    { trait_type: "Timestamp", value: new Date().toISOString() }
                ]
            };

            // Upload to IPFS (simplified - use Pinata or similar service)
            const tokenURI = await this.uploadToIPFS(metadata);

            // Record on blockchain
            const tx = await this.gameContract.recordGameResult(
                playerAddress,
                gameResult.symbols.join(''),
                gameResult.rarity,
                gameResult.name,
                gameResult.description,
                tokenURI,
                gameId
            );

            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Blockchain recording failed:', error);
            throw error;
        }
    }

    async uploadToIPFS(metadata) {
        // This is a simplified version - implement actual IPFS upload
        // Using Pinata, Infura, or similar service
        const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PINATA_JWT}`
            },
            body: JSON.stringify({
                pinataContent: metadata,
                pinataMetadata: {
                    name: `luck-loop-${Date.now()}.json`
                }
            })
        });

        const result = await response.json();
        return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    }

    async getPlayerStats(playerAddress) {
        try {
            const stats = await this.gameContract.getPlayerStats(playerAddress);
            const rarityStats = await this.nftContract.getRarityStats();
            
            return {
                playerSpins: stats.spins.toString(),
                lastSpin: stats.lastSpin.toString(),
                nftCount: stats.nfts.length,
                globalStats: {
                    legendary: rarityStats.legendary.toString(),
                    epic: rarityStats.epic.toString(),
                    rare: rarityStats.rare.toString(),
                    common: rarityStats.common.toString()
                }
            };
        } catch (error) {
            console.error('Failed to get player stats:', error);
            return null;
        }
    }

    async canPlayerSpin(playerAddress) {
        try {
            return await this.gameContract.canSpin(playerAddress);
        } catch (error) {
            console.error('Failed to check spin eligibility:', error);
            return false;
        }
    }
}

module.exports = { BlockchainService };

async function recordGameOnChain(playerAddress, gameResult) {
    const blockchain = new BlockchainService();
    return await blockchain.recordGameOnChain(playerAddress, gameResult);
}

module.exports = { recordGameOnChain, BlockchainService };
