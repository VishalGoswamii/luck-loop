const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const framesRouter = require('./routes/frames');
const gameRouter = require('./routes/game');
const { initializeRedis } = require('./services/redis');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/frames', framesRouter);
app.use('/api/game', gameRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

async function startServer() {
    try {
        await initializeRedis();
        console.log('Redis connected');
        
        app.listen(PORT, () => {
            console.log(`Luck Loop server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
