const express = require('express');
const mongoose = require('mongoose');
const Review = require('../model/reviewModel');
const Album = require('../model/albumModel');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * CREATE Review API
 * POST /api/reviews
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { albumId, rating, comment } = req.body;

    if (!albumId || !rating || !comment) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate albumId format
    if (!mongoose.Types.ObjectId.isValid(albumId)) {
      return res.status(400).json({ message: 'Invalid album ID format' });
    }

    // Check if album exists
    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }

    // Create a new review
    const newReview = new Review({
      album: albumId,
      rating,
      comment,
      createdBy: req.user.userId,
    });

    await newReview.save();

    // Add the review to the album
    album.reviews.push(newReview._id);
    await album.save();

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

    // Validate reviewId format
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: 'Invalid review ID format' });
    }

    // Find the review
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the logged-in user created the review
    if (review.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    // Remove the review from the album
    await Album.updateOne(
      { _id: review.album },
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
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }

    // Validate reviewId format
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: 'Invalid review ID format' });
    }

    // Find the review
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the logged-in user created the review
    if (review.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only edit your own reviews' });
    }

    // Update the review
    review.rating = rating;
    review.comment = comment;
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

    // Ensure albumId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(albumId)) {
      return res.status(400).json({ message: 'Invalid album ID format' });
    }

    const album = await Album.findById(albumId).populate('reviews');

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
    const userId = req.user.id; // Get the user ID from the token

    const reviews = await Review.find({ userId }).lean();
    
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
