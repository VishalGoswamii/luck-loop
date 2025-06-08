require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Blockchain
    RPC_URL: process.env.RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    GAME_CONTRACT_ADDRESS: process.env.GAME_CONTRACT_ADDRESS,
    NFT_CONTRACT_ADDRESS: process.env.NFT_CONTRACT_ADDRESS,
    
    // IPFS
    PINATA_JWT: process.env.PINATA_JWT,
    PINATA_API_KEY: process.env.PINATA_API_KEY,
    PINATA_SECRET_KEY: process.env.PINATA_SECRET_KEY,
    
    // Redis
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    
    // Game settings
    SPIN_COOLDOWN: parseInt(process.env.SPIN_COOLDOWN) || 3600, // 1 hour in seconds
    MAX_DAILY_SPINS: parseInt(process.env.MAX_DAILY_SPINS) || 5,
    
    // Rarity settings
    RARITY_WEIGHTS: {
        legendary: 1,
        epic: 5,
        rare: 15,
        common: 79
    }
};
