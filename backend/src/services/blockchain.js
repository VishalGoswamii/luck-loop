const { ethers } = require('ethers');

class BlockchainService {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        
        // No wallet/private key needed for read-only operations
        this.gameContract = new ethers.Contract(
            process.env.GAME_CONTRACT_ADDRESS,
            require('../contracts/LuckLoopGame.json').abi,
            this.provider
        );
        
        this.nftContract = new ethers.Contract(
            process.env.NFT_CONTRACT_ADDRESS,
            require('../contracts/LuckLoopNFT.json').abi,
            this.provider
        );

        // For signing game results (server-side verification)
        this.signingWallet = new ethers.Wallet(process.env.SIGNING_PRIVATE_KEY);
    }

    // Generate signature for game result verification
    async signGameResult(playerAddress, symbols, rarity, gameId) {
        const messageHash = ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(
                ['address', 'string', 'string', 'bytes32'],
                [playerAddress, symbols, rarity, gameId]
            )
        );
        
        return await this.signingWallet.signMessage(ethers.getBytes(messageHash));
    }

    // Upload to IPFS and return metadata
    async createNFTMetadata(gameResult, gameId) {
        const metadata = {
            name: gameResult.name,
            description: gameResult.description,
            image: `${process.env.BASE_URL}/api/nft-image/${gameId}`,
            attributes: [
                { trait_type: "Rarity", value: gameResult.rarity },
                { trait_type: "Symbols", value: gameResult.symbols.join('') },
                { trait_type: "Timestamp", value: new Date().toISOString() },
                { trait_type: "Game ID", value: gameId }
            ]
        };

        return await this.uploadToIPFS(metadata);
    }

    async uploadToIPFS(metadata) {
        try {
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
        } catch (error) {
            console.error('IPFS upload failed:', error);
            // Fallback to local metadata
            return `${process.env.BASE_URL}/api/metadata/${Date.now()}`;
        }
    }

    // Read-only blockchain queries
    async getPlayerStats(playerAddress) {
        try {
            const stats = await this.gameContract.getPlayerStats(playerAddress);
            const rarityStats = await this.nftContract.getRarityStats();
            
            return {
                playerSpins: stats.spins.toString(),
                lastSpin: stats.lastSpin.toString(),
                nftCount: stats.nfts.length,
                gameHistory: stats.gameHistory,
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

    async getGameResult(gameId) {
        try {
            return await this.gameContract.getGameResult(gameId);
        } catch (error) {
            console.error('Failed to get game result:', error);
            return null;
        }
    }

    async isGameIdUsed(gameId) {
        try {
            const result = await this.gameContract.getGameResult(gameId);
            return result.player !== ethers.ZeroAddress;
        } catch (error) {
            return false;
        }
    }
}

module.exports = { BlockchainService };
