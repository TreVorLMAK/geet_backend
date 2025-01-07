const express = require('express');
const Album = require('../model/albumModel');
const authMiddleware = require('../middleware/authMiddleware');
const axios = require('axios');

const router = express.Router();

// Fetch albums from Last.fm API
router.get('/fetch/:artist', async (req, res) => {
  const artist = req.params.artist;
  const apiKey = process.env.LASTFM_API_KEY;
  const url = `http://ws.audioscrobbler.com/2.0/?method=artist.gettopalbums&artist=${artist}&api_key=${apiKey}&format=json`;

  try {
    const response = await axios.get(url);
    const albums = response.data.topalbums.album;

    res.status(200).json({ albums });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch albums' });
  }
});

// Create an album route with review and rating
router.post('/:id/review', authMiddleware, async (req, res) => {
  const albumId = req.params.id;
  const { reviewText, rating } = req.body;

  const userId = req.user.id;

  if (rating < 0 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 0 and 5' });
  }

  const album = await Album.findById(albumId);
  if (!album) {
    return res.status(404).json({ message: 'Album not found' });
  }

  album.reviews.push({ user: userId, reviewText, rating });

  const totalRatings = album.reviews.length;
  const sumRatings = album.reviews.reduce((sum, review) => sum + review.rating, 0);
  album.averageRating = sumRatings / totalRatings;

  await album.save();

  res.status(200).json({ message: 'Review added successfully' });
});

module.exports = router;
