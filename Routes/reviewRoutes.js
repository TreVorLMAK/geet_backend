require('dotenv').config();  
const express = require('express');
const mongoose = require('mongoose');
const Review = require('../model/reviewModel');
const Album = require('../model/albumModel');
const authMiddleware = require('../middleware/authMiddleware');
const { ObjectId } = mongoose.Types;

const router = express.Router();

/**
 * CREATE Review API
 * POST /api/reviews
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { albumId, rating, reviewText } = req.body;
    const userId = req.user.userId; // Get the user ID from the token

    console.log('Received:', { albumId, rating, reviewText, userId });

    if (!albumId || !rating || !reviewText) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const fetch = await import('node-fetch').then(mod => mod.default);

    // Fetch the album details from Last.fm API (using fetch)
    const apiKey = process.env.LASTFM_API_KEY; // Fetch the API key from .env
    const albumDetails = await fetch(`https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${apiKey}&mbid=${albumId}&format=json`)
      .then(response => response.json())
      .catch(error => {
        console.error('Error fetching album details:', error);
        throw new Error('Error fetching album details');
      });

    // Check if the album exists on Last.fm
    if (!albumDetails.album) {
      return res.status(404).json({ message: 'Album not found on Last.fm' });
    }

    // Create the review
    const newReview = new Review({
      album: albumId, // Directly use the UUID as a string
      user: userId,
      rating,
      reviewText,
    });

    await newReview.save();

    // Send the response
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

    // Remove the review from the album's reviews array (no change needed here)
    await Album.updateOne(
      { albumId: review.album }, // Use albumId instead of ObjectId here
      { $pull: { reviews: review._id } }
    );

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
 * GET /api/reviews/album/:albumId
 */
router.get('/album/:albumId', async (req, res) => {
  try {
    const albumId = req.params.albumId;

    if (!albumId) {
      return res.status(400).json({ message: 'Album ID is required' });
    }

    // Find the album using the UUID (as a string, no ObjectId conversion needed)
    const album = await Album.findOne({ albumId }).populate('reviews');

    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }

    res.status(200).json({ reviews: album.reviews });
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

module.exports = router;
