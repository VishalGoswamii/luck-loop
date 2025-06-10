const express = require('express');
const { GameEngine } = require('../services/gameEngine');
const { ethers } = require('ethers'); // We only need this for hashing
const router = express.Router();

const gameEngine = new GameEngine();

router.post('/spin', async (req, res) => {
    try {
        const { untrustedData } = req.body;
        const userFid = untrustedData?.fid;
        if (!userFid) return res.status(400).json({ error: 'Invalid user data' });

        const gameId = ethers.id(`${userFid}_${Date.now()}`);
        const result = await gameEngine.spin();

        // Let's just store the result for a bit, no signature needed!
        await gameEngine.storeGameResult(gameId, {
            userFid,
            ...result,
            timestamp: Date.now()
        });

        const canMint = result.rarity !== 'common';
        const postUrl = `${process.env.BASE_URL}/frames/${canMint ? `mint/${gameId}` : 'spin'}`;
        const buttonText = canMint ? 'Mint NFT!' : 'Spin Again';

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${process.env.BASE_URL}/api/game/result-image/${gameId}" />
            <meta property="fc:frame:button:1" content="${buttonText}" />
            <meta property="fc:frame:post_url" content="${postUrl}" />
        </head>
        <body><h1>Your Result!</h1></body>
        </html>`;
        res.send(html);
    } catch (error) {
        console.error('Error processing spin:', error);
        res.status(500).json({ error: 'Spin failed' });
    }
});

// You'll want to make sure the other routes, like for the minting page,
// are still here from your original files.

module.exports = router;
