const express = require('express');
const { GameEngine } = require('../services/gameEngine');
const { BlockchainService } = require('../services/blockchain');
const router = express.Router();

const gameEngine = new GameEngine();
const blockchain = new BlockchainService();

// Get game result for minting
router.get('/result/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const gameResult = await gameEngine.getGameResult(gameId);
        
        if (!gameResult) {
            return res.status(404).json({ error: 'Game not found' });
        }

        // Create IPFS metadata
        const tokenURI = await blockchain.createNFTMetadata(gameResult, gameId);

        res.json({
            gameId,
            symbols: gameResult.symbols,
            rarity: gameResult.rarity,
            name: gameResult.name,
            description: gameResult.description,
            tokenURI,
            signature: gameResult.signature,
            canMint: gameResult.rarity !== 'common'
        });
    } catch (error) {
        console.error('Error getting game result:', error);
        res.status(500).json({ error: 'Failed to get game result' });
    }
});

// Store game result on blockchain (called by authorized backend)
router.post('/store-result', async (req, res) => {
    try {
        const { playerAddress, gameId } = req.body;
        
        // Get stored game result
        const gameResult = await gameEngine.getGameResult(gameId);
        if (!gameResult) {
            return res.status(404).json({ error: 'Game not found' });
        }

        // Re-sign with actual player address
        const signature = await blockchain.signGameResult(
            playerAddress,
            gameResult.symbols.join(''),
            gameResult.rarity,
            gameId
        );

        res.json({
            success: true,
            gameId,
            signature,
            contractAddress: process.env.GAME_CONTRACT_ADDRESS,
            nftContractAddress: process.env.NFT_CONTRACT_ADDRESS
        });
    } catch (error) {
        console.error('Error storing game result:', error);
        res.status(500).json({ error: 'Failed to store game result' });
    }
});

// Get player statistics
router.get('/stats/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const stats = await blockchain.getPlayerStats(address);
        
        res.json(stats || {
            playerSpins: '0',
            lastSpin: '0',
            nftCount: 0,
            gameHistory: [],
            globalStats: { legendary: '0', epic: '0', rare: '0', common: '0' }
        });
    } catch (error) {
        console.error('Error getting player stats:', error);
        res.status(500).json({ error: 'Failed to get player stats' });
    }
});

// Check if player can spin
router.get('/can-spin/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const canSpin = await blockchain.canPlayerSpin(address);
        
        res.json({ canSpin });
    } catch (error) {
        console.error('Error checking spin eligibility:', error);
        res.status(500).json({ error: 'Failed to check spin eligibility' });
    }
});

module.exports = router;
