const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    album: { type: String, required: true }, // Change ObjectId to String for UUID
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewText: { type: String },
    rating: { type: Number, min: 0, max: 5 },
  },
  { timestamps: true }
);

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
