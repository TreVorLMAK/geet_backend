const express = require('express');
const Album = require('../model/albumModel');
const authMiddleware = require('../middleware/authMiddleware');
const axios = require('axios');

const { upload, multerUpload } = require('../middleware/multerConfig');


const router = express.Router();

// album fetch garney from Last.fm API
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

router.post('/add', authMiddleware, multerUpload.single('image'), async (req, res) => {
  try {
    const { title, artist, genre, releaseYear, description } = req.body;
    const image = req.file ? req.file.path : null;

    const createdBy = req.user && req.user.userId; // Using authenticated user ID

    console.log(createdBy);

    if (!title || !artist || !image || !genre || !releaseYear || !description) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    if (!createdBy) {
      return res.status(401).json({ message: "Unauthorized: createdBy is required" });
    }

    await Album.create({
      title,
      artist,
      genre,
      releaseYear,
      coverArt: image,
      description,
      createdBy,
    });

    res.status(200).json({
      message: "Album created successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


module.exports = router;
