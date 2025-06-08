const crypto = require('crypto');
const redis = require('./redis');

class GameEngine {
    constructor() {
        this.symbols = ['🍒', '💎', '🔥', '💀'];
        this.comboRules = {
            '💎💎💎': { rarity: 'legendary', name: 'The Triple Gem', description: 'The ultimate symbol of fortune!' },
            '🔥🔥🔥': { rarity: 'epic', name: 'The Flame of Fortune', description: 'Your luck burns bright!' },
            '🍒🍒🍒': { rarity: 'rare', name: 'Fruit Jackpot', description: 'Sweet victory is yours!' },
            '💀💎💀': { rarity: 'rare', name: 'Skull Jewel', description: 'Beauty in darkness!' },
            '💀💀💀': { rarity: 'epic', name: 'Triple Death', description: 'Dangerously lucky!' },
            '💎💎🔥': { rarity: 'rare', name: 'Gem Fire', description: 'Sparkling flames!' },
            '🔥🔥💎': { rarity: 'rare', name: 'Fire Diamond', description: 'Blazing brilliance!' },
            '💎🔥💎': { rarity: 'rare', name: 'Diamond Fire', description: 'Precious flames!' },
            '🍒💎🍒': { rarity: 'rare', name: 'Cherry Gem', description: 'Sweet treasure!' },
            '🔥💀🔥': { rarity: 'rare', name: 'Death Fire', description: 'Dangerous beauty!' }
        };
        
        this.rarityWeights = {
            legendary: 1,
            epic: 5, 
            rare: 15,
            common: 79
        };
    }

    generateWeightedResult() {
        const rand = Math.random() * 100;
        
        if (rand < 1) {
            // Legendary - force specific combos
            const legendaryOptions = Object.keys(this.comboRules).filter(
                combo => this.comboRules[combo].rarity === 'legendary'
            );
            const chosen = legendaryOptions[Math.floor(Math.random() * legendaryOptions.length)];
            return chosen.split('');
        } else if (rand < 6) {
            // Epic - force epic combos
            const epicOptions = Object.keys(this.comboRules).filter(
                combo => this.comboRules[combo].rarity === 'epic'
            );
            const chosen = epicOptions[Math.floor(Math.random() * epicOptions.length)];
            return chosen.split('');
        } else if (rand < 21) {
            // Rare - force rare combos
            const rareOptions = Object.keys(this.comboRules).filter(
                combo => this.comboRules[combo].rarity === 'rare'
            );
            const chosen = rareOptions[Math.floor(Math.random() * rareOptions.length)];
            return chosen.split('');
        } else {
            // Common - random symbols
            return [
                this.symbols[Math.floor(Math.random() * this.symbols.length)],
                this.symbols[Math.floor(Math.random() * this.symbols.length)],
                this.symbols[Math.floor(Math.random() * this.symbols.length)]
            ];
        }
    }

    async spin() {
        const symbols = this.generateWeightedResult();
        const comboKey = symbols.join('');
        
        let result;
        if (this.comboRules[comboKey]) {
            result = { ...this.comboRules[comboKey] };
        } else {
            // Check for pairs
            const counts = {};
            symbols.forEach(symbol => {
                counts[symbol] = (counts[symbol] || 0) + 1;
            });
            
            const hasDouble = Object.values(counts).some(count => count >= 2);
            
            if (hasDouble) {
                result = { 
                    rarity: 'rare', 
                    name: 'Lucky Pair', 
                    description: 'Close to greatness!' 
                };
            } else {
                result = { 
                    rarity: 'common', 
                    name: 'Almost Lucky', 
                    description: 'Better luck next spin!' 
                };
            }
        }

        return {
            symbols,
            ...result,
            id: crypto.randomUUID()
        };
    }

    async storeGameResult(gameId, result) {
        await redis.setex(`game:${gameId}`, 3600, JSON.stringify(result)); // 1 hour expiry
    }

    async getGameResult(gameId) {
        const data = await redis.get(`game:${gameId}`);
        return data ? JSON.parse(data) : null;
    }

    async getPlayerStats(userFid) {
        const stats = await redis.get(`stats:${userFid}`);
        return stats ? JSON.parse(stats) : {
            totalSpins: 0,
            nftsWon: 0,
            lastSpin: null,
            rarityBreakdown: { legendary: 0, epic: 0, rare: 0, common: 0 }
        };
    }

    async updatePlayerStats(userFid, result) {
        const stats = await this.getPlayerStats(userFid);
        stats.totalSpins++;
        if (result.rarity !== 'common') {
            stats.nftsWon++;
        }
        stats.rarityBreakdown[result.rarity]++;
        stats.lastSpin = Date.now();
        
        await redis.setex(`stats:${userFid}`, 86400 * 30, JSON.stringify(stats)); // 30 days
    }
}

module.exports = { GameEngine };
