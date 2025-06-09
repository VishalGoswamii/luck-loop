const express = require('express');
const { generateFrameImage } = require('../services/imageGen');
const { GameEngine } = require('../services/gameEngine');
const { BlockchainService } = require('../services/blockchain');
const router = express.Router();

const gameEngine = new GameEngine();
const blockchain = new BlockchainService();

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
        <p>Connect your wallet and pay gas to mint your wins!</p>
    </body>
    </html>`;
    res.send(html);
});

// Frame 2: Spin action
router.post('/spin', async (req, res) => {
    try {
        const { untrustedData } = req.body;
        const userFid = untrustedData?.fid;
        
        if (!userFid) {
            return res.status(400).json({ error: 'Invalid user data' });
        }

        // Generate game result
        const gameId = ethers.keccak256(ethers.toUtf8Bytes(`${userFid}_${Date.now()}`));
        const result = await gameEngine.spin();
        
        // Sign the result for verification
        const signature = await blockchain.signGameResult(
            '0x0000000000000000000000000000000000000000', // Placeholder, real address comes later
            result.symbols.join(''),
            result.rarity,
            gameId
        );

        // Store game result temporarily
        await gameEngine.storeGameResult(gameId, {
            userFid,
            ...result,
            signature,
            timestamp: Date.now()
        });

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${process.env.BASE_URL}/frames/result-image/${gameId}" />
            <meta property="fc:frame:button:1" content="${result.rarity === 'common' ? '🔄 Spin Again' : '💰 Mint NFT (You Pay Gas)'}" />
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

// Frame 3: Mint instructions (User pays gas)
router.post('/mint/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const gameResult = await gameEngine.getGameResult(gameId);
        
        if (!gameResult) {
            return res.status(400).json({ error: 'Game not found' });
        }

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${process.env.BASE_URL}/frames/mint-instructions/${gameId}" />
            <meta property="fc:frame:button:1" content="🌐 Open Mint Page" />
            <meta property="fc:frame:button:2" content="🎰 Play Again" />
            <meta property="fc:frame:button:1:action" content="link" />
            <meta property="fc:frame:button:1:target" content="${process.env.BASE_URL}/mint/${gameId}" />
            <meta property="fc:frame:post_url" content="${process.env.BASE_URL}/frames/" />
            <meta property="og:title" content="Ready to Mint!" />
        </head>
        <body><h1>Ready to Mint!</h1></body>
        </html>`;
        
        res.send(html);
    } catch (error) {
        console.error('Error showing mint instructions:', error);
        res.status(500).json({ error: 'Failed to show mint instructions' });
    }
});

// Mint instructions image
router.get('/mint-instructions/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const gameResult = await gameEngine.getGameResult(gameId);
        
        const imageBuffer = await generateFrameImage({
            type: 'mint-instructions',
            symbols: gameResult.symbols,
            rarity: gameResult.rarity,
            name: gameResult.name,
            description: 'Click "Open Mint Page" to connect your wallet and mint your NFT!'
        });
        
        res.setHeader('Content-Type', 'image/png');
        res.send(imageBuffer);
    } catch (error) {
        console.error('Error generating mint instructions image:', error);
        res.status(500).send('Error generating image');
    }
});

module.exports = router;
