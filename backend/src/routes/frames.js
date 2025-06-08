const express = require('express');
const { generateFrameImage } = require('../services/imageGen');
const { GameEngine } = require('../services/gameEngine');
const { recordGameOnChain } = require('../services/blockchain');
const router = express.Router();

const gameEngine = new GameEngine();

// Frame 1: Welcome
router.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${process.env.BASE_URL}/frames/welcome-image" />
        <meta property="fc:frame:button:1" content="🎰 SPIN NOW" />
        <meta property="fc:frame:post_url" content="${process.env.BASE_URL}/frames/spin" />
        <meta property="og:title" content="Luck Loop - Spin for NFTs!" />
        <meta property="og:description" content="Spin the slot machine and win unique NFTs!" />
    </head>
    <body>
        <h1>Luck Loop - Spin for NFTs!</h1>
    </body>
    </html>`;
    res.send(html);
});

// Welcome image
router.get('/welcome-image', async (req, res) => {
    try {
        const imageBuffer = await generateFrameImage({
            type: 'welcome',
            title: 'Luck Loop',
            subtitle: 'Spin the symbols and win a unique NFT!',
            symbols: ['🎲', '🎲', '🎲'],
            stats: 'Legendary: 1% | Epic: 5% | Rare: 15% | Common: 79%'
        });
        
        res.setHeader('Content-Type', 'image/png');
        res.send(imageBuffer);
    } catch (error) {
        console.error('Error generating welcome image:', error);
        res.status(500).send('Error generating image');
    }
});

// Frame 2: Spin action
router.post('/spin', async (req, res) => {
    try {
        const { untrustedData } = req.body;
        const userFid = untrustedData?.fid;
        
        if (!userFid) {
            return res.status(400).json({ error: 'Invalid user data' });
        }

        const gameId = `game_${userFid}_${Date.now()}`;
        const result = await gameEngine.spin();
        
        // Store game result temporarily
        await gameEngine.storeGameResult(gameId, {
            userFid,
            ...result,
            timestamp: Date.now()
        });

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${process.env.BASE_URL}/frames/result-image/${gameId}" />
            <meta property="fc:frame:button:1" content="${result.rarity === 'common' ? '🔄 Spin Again' : '🎨 Mint NFT'}" />
            <meta property="fc:frame:button:2" content="📊 My Stats" />
            <meta property="fc:frame:post_url" content="${process.env.BASE_URL}/frames/${result.rarity === 'common' ? 'spin' : 'mint'}/${gameId}" />
            <meta property="og:title" content="Luck Loop Result!" />
        </head>
        <body><h1>Your Result!</h1></body>
        </html>`;
        
        res.send(html);
    } catch (error) {
        console.error('Error processing spin:', error);
        res.status(500).json({ error: 'Spin failed' });
    }
});

// Result image
router.get('/result-image/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const gameResult = await gameEngine.getGameResult(gameId);
        
        if (!gameResult) {
            return res.status(404).send('Game not found');
        }

        const imageBuffer = await generateFrameImage({
            type: 'result',
            symbols: gameResult.symbols,
            rarity: gameResult.rarity,
            name: gameResult.name,
            description: gameResult.description
        });
        
        res.setHeader('Content-Type', 'image/png');
        res.send(imageBuffer);
    } catch (error) {
        console.error('Error generating result image:', error);
        res.status(500).send('Error generating image');
    }
});

// Frame 3: Mint NFT
router.post('/mint/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const { untrustedData } = req.body;
        const userAddress = untrustedData?.address;
        
        const gameResult = await gameEngine.getGameResult(gameId);
        
        if (!gameResult || !userAddress) {
            return res.status(400).json({ error: 'Invalid game or user data' });
        }

        // Record on blockchain
        const txHash = await recordGameOnChain(userAddress, gameResult);
        
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${process.env.BASE_URL}/frames/nft-image/${gameId}" />
            <meta property="fc:frame:button:1" content="🎰 Play Again" />
            <meta property="fc:frame:button:2" content="🚀 Share Win" />
            <meta property="fc:frame:post_url" content="${process.env.BASE_URL}/frames/" />
            <meta property="og:title" content="NFT Minted!" />
        </head>
        <body><h1>NFT Minted!</h1></body>
        </html>`;
        
        res.send(html);
    } catch (error) {
        console.error('Error minting NFT:', error);
        res.status(500).json({ error: 'Minting failed' });
    }
});

// NFT preview image
router.get('/nft-image/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const gameResult = await gameEngine.getGameResult(gameId);
        
        const imageBuffer = await generateFrameImage({
            type: 'nft',
            symbols: gameResult.symbols,
            rarity: gameResult.rarity,
            name: gameResult.name,
            description: gameResult.description,
            timestamp: new Date().toLocaleDateString()
        });
        
        res.setHeader('Content-Type', 'image/png');
        res.send(imageBuffer);
    } catch (error) {
        console.error('Error generating NFT image:', error);
        res.status(500).send('Error generating image');
    }
});

module.exports = router;
