const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

// Register custom fonts if available
try {
    registerFont(path.join(__dirname, '../assets/fonts/Inter-Bold.ttf'), { family: 'Inter-Bold' });
    registerFont(path.join(__dirname, '../assets/fonts/Inter-Regular.ttf'), { family: 'Inter' });
} catch (error) {
    console.log('Custom fonts not found, using system defaults');
}

async function generateFrameImage(options) {
    const canvas = createCanvas(1200, 630); // Standard Frame dimensions
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Add glassmorphism effect
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = 'white';
    ctx.fillRect(60, 60, 1080, 510);
    ctx.globalAlpha = 1;

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 60, 1080, 510);

    switch (options.type) {
        case 'welcome':
            await drawWelcomeFrame(ctx, options);
            break;
        case 'result':
            await drawResultFrame(ctx, options);
            break;
        case 'nft':
            await drawNFTFrame(ctx, options);
            break;
        default:
            await drawWelcomeFrame(ctx, options);
    }

    return canvas.toBuffer('image/png');
}

async function drawWelcomeFrame(ctx, options) {
    // Title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 72px Inter-Bold, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎰', 600, 150);
    
    ctx.font = 'bold 60px Inter-Bold, Arial';
    ctx.fillText('Luck Loop', 600, 230);
    
    ctx.font = '32px Inter, Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('Spin the symbols and win a unique NFT!', 600, 280);

    // Slot symbols
    const slots = ['🎲', '🎲', '🎲'];
    ctx.font = '80px Arial';
    slots.forEach((symbol, index) => {
        const x = 400 + (index * 120);
        const y = 380;
        
        // Slot background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(x - 50, y - 60, 100, 100);
        
        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 50, y - 60, 100, 100);
        
        // Symbol
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(symbol, x, y + 20);
    });

    // Stats
    if (options.stats) {
        ctx.font = '24px Inter, Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.textAlign = 'center';
        ctx.fillText(options.stats, 600, 520);
    }
}

async function drawResultFrame(ctx, options) {
    // Title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Inter-Bold, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 Your Result!', 600, 120);

    // Slot symbols
    ctx.font = '100px Arial';
    options.symbols.forEach((symbol, index) => {
        const x = 350 + (index * 150);
        const y = 250;
        
        // Slot background with rarity color
        const rarityColors = {
            legendary: 'rgba(255, 215, 0, 0.3)',
            epic: 'rgba(255, 107, 53, 0.3)',
            rare: 'rgba(155, 89, 182, 0.3)',
            common: 'rgba(149, 165, 166, 0.3)'
        };
        
        ctx.fillStyle = rarityColors[options.rarity] || rarityColors.common;
        ctx.fillRect(x - 65, y - 70, 130, 130);
        
        // Glowing border for rare+ items
        if (options.rarity !== 'common') {
            ctx.shadowColor = rarityColors[options.rarity];
            ctx.shadowBlur = 20;
            ctx.strokeStyle = rarityColors[options.rarity];
            ctx.lineWidth = 3;
            ctx.strokeRect(x - 65, y - 70, 130, 130);
            ctx.shadowBlur = 0;
        }
        
        // Symbol
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(symbol, x, y + 30);
    });

    // Rarity badge
    const rarityColors = {
        legendary: '#FFD700',
        epic: '#FF6B35', 
        rare: '#9B59B6',
        common: '#95A5A6'
    };
    
    ctx.fillStyle = rarityColors[options.rarity];
    ctx.font = 'bold 36px Inter-Bold, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(options.rarity.toUpperCase(), 600, 380);
    
    // NFT name
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Inter, Arial';
    ctx.fillText(options.name, 600, 430);
    
    // Description
    ctx.font = '24px Inter, Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(options.description, 600, 470);
}

async function drawNFTFrame(ctx, options) {
    // Title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Inter-Bold, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('✨ Your Lucky NFT!', 600, 120);

    // NFT Card Background
    const cardX = 400;
    const cardY = 180;
    const cardWidth = 400;
    const cardHeight = 300;
    
    // Card gradient based on rarity
    const rarityGradients = {
        legendary: ['#FFD700', '#FFA500'],
        epic: ['#FF6B35', '#FF8E8E'],
        rare: ['#9B59B6', '#C39BD3'],
        common: ['#95A5A6', '#BDC3C7']
    };
    
    const gradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardHeight);
    const colors = rarityGradients[options.rarity] || rarityGradients.common;
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
    
    // Card border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
    
    // Symbols on card
    ctx.font = '80px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(options.symbols.join(''), 600, 280);
    
    // NFT name on card
    ctx.font = 'bold 24px Inter, Arial';
    ctx.fillText(options.name, 600, 320);
    
    // Rarity badge
    ctx.font = 'bold 20px Inter, Arial';
    ctx.fillText(options.rarity.toUpperCase(), 600, 350);
    
    // Minted date
    ctx.font = '16px Inter, Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`Minted: ${options.timestamp}`, 600, 370);
    
    // Bottom text
    ctx.font = '28px Inter, Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('🎊 Congratulations! 🎊', 600, 540);
}

module.exports = { generateFrameImage };
