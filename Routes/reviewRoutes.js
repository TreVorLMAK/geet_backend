const express = require('express');
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

module.exports = router;
