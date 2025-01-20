const express = require('express');
const Album = require('../model/albumModel');
const authMiddleware = require('../middleware/authMiddleware');
const axios = require('axios');
const mongoose = require('mongoose')

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

  if (!mongoose.Types.ObjectId.isValid(albumId)) {
    return res.status(400).json({ message: 'Invalid album ID' });
  }

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

router.get('/details/:artist/:album', async (req, res) => {
  const artist = req.params.artist;
  const album = req.params.album;
  const apiKey = process.env.LASTFM_API_KEY;
  const url = `http://ws.audioscrobbler.com/2.0/?method=album.getinfo&artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}&api_key=${apiKey}&format=json`;

  try {
    const response = await axios.get(url);

    // Handle error from Last.fm or if album details are missing
    if (response.data.error || !response.data.album) {
      return res.status(404).json({ message: response.data.message || 'Album not found.' });
    }

    // Extract album details including ID, name, bio, track list, and cover art
    const albumData = response.data.album;
    // console.log(albumData)
    const albumDetails = {
      id: albumData.mbid,  
      name: albumData.name,
      bio: albumData.wiki ? albumData.wiki.content : 'No bio available',
      tracks: albumData.tracks.track.map(track => ({
        name: track.name,
        url: track.url
      })),
      coverArt: albumData.image ? albumData.image[3]['#text'] : null,
    };

    // Send the extracted details as a response
    res.status(200).json(albumDetails);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch album details', error: error.message });
  }
});



module.exports = router;
