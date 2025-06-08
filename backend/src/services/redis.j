const redis = require('redis');

let client;

async function initializeRedis() {
    client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    client.on('error', (err) => {
        console.log('Redis Client Error', err);
    });

    await client.connect();
}

async function get(key) {
    return await client.get(key);
}

async function setex(key, seconds, value) {
    return await client.setEx(key, seconds, value);
}

async function del(key) {
    return await client.del(key);
}

module.exports = {
    initializeRedis,
    get,
    setex,
    del
};
