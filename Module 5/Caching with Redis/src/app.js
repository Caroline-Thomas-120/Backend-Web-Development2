
'use strict';

// ─── GIVEN FILE — add Redis caching ─────────────────────────────

require('dotenv').config();

const express = require('express');
const db = require('./db');

// Import Redis cache functions
const { cacheGet, cacheSet, cacheDel } = require('./cache');

const app = express();
app.use(express.json());

const FEED_KEY = 'feed:trending';
const FEED_TTL = 60; // seconds

app.get('/health', (req, res) => res.json({ ok: true }));

// GET /feed — cache-aside with 60 seconds TTL
app.get('/feed', async (req, res) => {
  try {
    const t0 = Date.now();

    // 1. Check Redis cache
    const cachedPosts = await cacheGet(FEED_KEY);

    // 2. Cache HIT
    if (cachedPosts !== null) {
      const elapsed = Date.now() - t0;

      res.set('X-Cache', 'HIT');
      console.log(`[feed] HIT ${elapsed}ms`);

      return res.json(cachedPosts);
    }

    // 3. Cache MISS — get data from database
    const posts = await db.getTrendingPosts();

    // 4. Store posts in Redis for 60 seconds
    await cacheSet(FEED_KEY, posts, FEED_TTL);

    const elapsed = Date.now() - t0;

    res.set('X-Cache', 'MISS');
    console.log(`[feed] MISS ${elapsed}ms`);

    return res.json(posts);

  } catch (err) {
    console.error('[feed] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /posts — create a new post and invalidate cache
app.post('/posts', async (req, res) => {
  try {
    const post = await db.createPost(req.body);

    // Delete old cached feed after creating a post
    await cacheDel(FEED_KEY);

    res.status(201).json(post);

  } catch (err) {
    console.error('[posts] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
}

module.exports = { app };
