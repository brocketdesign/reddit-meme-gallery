const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Reddit API endpoints
router.get('/reddit/:subreddit', async (req, res) => {
  const { subreddit } = req.params;
  const { sort = 'hot', limit = 50 } = req.query;

  try {
    const response = await fetch(`https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`);
    const data = await response.json();
    const posts = data.data?.children || [];

    // Filter for posts with media (images or videos)
    const mediaPosts = posts
      .map(post => post.data)
      .filter(post =>
        // Images: direct image, preview, or gallery
        post.post_hint === 'image' ||
        (post.preview && post.preview.images && post.preview.images.length > 0) ||
        (post.is_gallery && post.media_metadata) ||
        // Videos: Reddit-hosted or embedded
        post.is_video ||
        (post.media && (post.media.reddit_video || post.media.oembed))
      );

    console.log(`[Reddit] Fetched ${mediaPosts.length} media posts from r/${subreddit}`);
    res.json({ media: mediaPosts });
  } catch (error) {
    console.error(`[Reddit] Error fetching from r/${subreddit}:`, error);
    res.status(500).json({ error: 'Failed to fetch Reddit media posts' });
  }
});

// RedGif video handling endpoint
router.get('/redgifs/:id', async (req, res) => {
  const id = req.params.id;
  console.log(`[RedGifs] Processing request for ID: ${id}`);
  
  try {
    // Make request to RedGifs API
    const response = await fetch(`https://api.redgifs.com/v2/gifs/${id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`[RedGifs] API error for ${id}: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: 'Failed to fetch from RedGifs API' });
    }
    
    const data = await response.json();
    console.log(`[RedGifs] Successfully retrieved data for ID: ${id}`);
    
    return res.json(data);
  } catch (error) {
    console.error(`[RedGifs] Exception for ID ${id}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;
