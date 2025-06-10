const express = require('express');
const { GameEngine } = require('../services/gameEngine');
const { generateFrameImage } = require('../services/imageGen');
const router = express.Router();

const gameEngine = new GameEngine();

// This just sends the game result data to the frontend page.
router.get('/result/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const gameResult = await gameEngine.getGameResult(gameId);
        if (!gameResult) {
            return res.status(404).json({ error: 'Game not found' });
        }

        res.json({
            gameId,
            symbols: gameResult.symbols,
            rarity: gameResult.rarity,
            name: gameResult.name,
            description: gameResult.description,
            canMint: gameResult.rarity !== 'common',
            tokenURI: `https://your-api.com/metadata/${gameId}` // Just a placeholder!
        });
    } catch (error) {
        console.error('Error getting game result:', error);
        res.status(500).json({ error: 'Failed to get game result' });
    }
});

// This makes the cool image for the Farcaster frame.
router.get('/result-image/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const gameResult = await gameEngine.getGameResult(gameId);
        if (!gameResult) {
            return res.status(404).send('Game not found');
        }
        const imageBuffer = await generateFrameImage({ type: 'result', ...gameResult });
        res.setHeader('Content-Type', 'image/png');
        res.send(imageBuffer);
    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).send('Error generating image');
    }
});

module.exports = router;
