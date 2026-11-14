'use strict';

const Redis = require('ioredis');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
};

const redis = new Redis(connection);

redis.on('error', (error) => {
  console.error('Redis connection error:', error.message);
});

async function cacheGet(key) {
  try {
    const data = await redis.get(key);

    if (data === null) {
      return null;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

async function cacheSet(key, data, ttlSeconds) {
  try {
    await redis.set(
      key,
      JSON.stringify(data),
      'EX',
      ttlSeconds
    );
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

async function cacheDel(key) {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

module.exports = { cacheGet, cacheSet, cacheDel };
