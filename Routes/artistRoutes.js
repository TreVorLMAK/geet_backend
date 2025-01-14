const express = require('express');
const axios = require('axios');
const Artist = require('../model/artistModel'); 
require('dotenv').config(); 

const router = express.Router();

// Add a new artist by fetching details from the Last.fm API
router.post('/add', async (req, res) => {
  const { artistName } = req.body;

  if (!artistName) {
    return res.status(400).json({ error: 'Artist name is required' });
  }

  try {
    const API_KEY = process.env.LASTFM_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: 'Missing Last.fm API key' });
    }

    // Fetch artist details from the Last.fm API
    const response = await axios.get(
      `http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(
        artistName
      )}&api_key=${API_KEY}&format=json`
    );

    const data = response.data.artist;

    if (!data) {
      return res.status(404).json({ error: 'Artist not found on Last.fm' });
    }

    // Check if the artist already exists in the database
    const existingArtist = await Artist.findOne({ name: data.name });
    if (existingArtist) {
      return res.status(400).json({ error: 'Artist already exists in the database' });
    }

    // Create a new artist document
    const newArtist = new Artist({
      name: data.name,
      mbid: data.mbid || '',
      image: data.image?.[2]?.['#text'] || '', // Use medium-sized image
      listeners: parseInt(data.stats.listeners) || 0,
      playcount: parseInt(data.stats.playcount) || 0,
      bio: data.bio?.summary || '',
    });

    // Save the artist to the database
    await newArtist.save();

    res.status(201).json({
      message: 'Artist added successfully',
      artist: newArtist,
    });
  } catch (error) {
    console.error('Error fetching or saving artist data:', error.message);

    if (error.response) {
      // Handle API errors
      return res
        .status(error.response.status)
        .json({ error: error.response.data.message || 'Failed to fetch artist data from Last.fm' });
    }

    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});
// Fetch all artists
router.get('/', async (req, res) => {
    try {
      const artists = await Artist.find(); // Fetch all artists from the database
      res.status(200).json(artists);
    } catch (error) {
      console.error('Error fetching artists:', error.message);
      res.status(500).json({ error: 'Failed to fetch artists' });
    }
  });

  router.get('/:artistName', async (req, res) => {
    const { artistName } = req.params;
  
    try {
      const artist = await Artist.findOne({ name: artistName });
  
      if (!artist) {
        return res.status(404).json({ error: 'Artist not found' });
      }
  
      res.status(200).json(artist);
    } catch (error) {
      console.error('Error fetching artist details:', error.message);
      res.status(500).json({ error: 'Failed to fetch artist details' });
    }
  });

module.exports = router;
