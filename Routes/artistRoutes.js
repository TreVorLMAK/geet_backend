const express = require('express');
const axios = require('axios');
const Artist = require('../model/artistModel'); 
require('dotenv').config(); 

const router = express.Router();

// Add a new artist by fetching details from the Last.fm API
router.post('/add', async (req, res) => {
  const { name, image, listeners, bio, mbid } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Artist name is required' });
  }

  // Add a check for mbid if required
  if (!mbid) {
    return res.status(400).json({ error: 'Artist mbid is required' });
  }

  try {
    const existingArtist = await Artist.findOne({ mbid });
    if (existingArtist) {
      return res.status(400).json({ error: 'Artist with this mbid already exists' });
    }

    const newArtist = new Artist({
      name,
      image: image || '',
      listeners: listeners || 0,
      bio: bio || 'Artist biography not available.',
      mbid,
    });

    await newArtist.save();

    res.status(201).json({
      message: 'Artist added successfully',
      artist: newArtist,
    });
  } catch (error) {
    console.error('Error fetching or saving artist data:', error.message);
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

// Fetch a specific artist by name
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
