require('dotenv').config();  
const express = require('express');
const mongoose = require('mongoose');
const Review = require('../model/reviewModel');
const Album = require('../model/albumModel');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../model/userModel')
const { ObjectId } = mongoose.Types;

const router = express.Router();

/**
 * CREATE Review API
 * POST /api/reviews
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { albumId, rating, reviewText } = req.body;
    const { userId, username } = req.user; // Extract username from req.user

    if (!albumId || !rating || !reviewText) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const fetch = await import('node-fetch').then(mod => mod.default);
    const apiKey = process.env.LASTFM_API_KEY;

    const albumDetails = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${apiKey}&mbid=${albumId}&format=json`
    ).then(response => response.json());

    if (!albumDetails.album) {
      return res.status(404).json({ message: 'Album not found on Last.fm' });
    }

    const newReview = new Review({
      album: albumId,
      user: userId,
      username, 
      rating,
      reviewText,
      artistName: albumDetails.album.artist,
      albumName: albumDetails.album.name,
    });

    await newReview.save();

    res.status(201).json({
      message: 'Review added successfully',
      review: newReview,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


/**
 * DELETE Review API
 * DELETE /api/reviews/:id
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.userId;

    // Validate reviewId format
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: 'Invalid review ID format' });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Ensure the review was created by the logged-in user
    if (review.user.toString() !== userId) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    // Delete the review
    await review.deleteOne();

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * EDIT Review API
 * PUT /api/reviews/:id
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { rating, reviewText } = req.body;
    const userId = req.user.userId;

    if (!rating || !reviewText) {
      return res.status(400).json({ message: 'Rating and reviewText are required' });
    }

    // Validate reviewId format
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: 'Invalid review ID format' });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Ensure the review was created by the logged-in user
    if (review.user.toString() !== userId) {
      return res.status(403).json({ message: 'You can only edit your own reviews' });
    }

    // Update the review
    review.rating = rating;
    review.reviewText = reviewText;
    await review.save();

    res.status(200).json({
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET Reviews for a specific album
 * GET /api/reviews/album/:mbid
 */
router.get('/album/:mbid', async (req, res) => {
  try {
    const mbid = req.params.mbid;  // Use mbid here instead of albumId

    if (!mbid) {
      return res.status(400).json({ message: 'Album MBID is required' });
    }

    // Find reviews for the album by mbid (MusicBrainz ID)
    const reviews = await Review.find({ album: mbid }).lean();

    if (!reviews || reviews.length === 0) {
      return res.status(404).json({ message: 'No reviews found for this album' });
    }

    res.status(200).json({ reviews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET Reviews by a specific user
 * GET /api/reviews/user
 */
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const reviews = await Review.find({ user: userId }).lean();

    if (!reviews || reviews.length === 0) {
      return res.status(404).json({ message: 'No reviews found for this user' });
    }

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

router.get('/user/:username', async (req, res) => {
  try {
    const username = req.params.username;

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Fetch user details by username
    const user = await User.findOne({ username }).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch reviews by the username
    const reviews = await Review.find({ username }).lean();

    res.status(200).json({
      user: {
        username: user.username,
        bio: user.bio || "This user has not added a bio yet.",
        profilePicture: user.profilePicture || "https://via.placeholder.com/150",
      },
      reviews,
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
