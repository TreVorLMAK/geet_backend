const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    album: { type: String, required: true }, // UUID or any identifier for the album
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    reviewText: { type: String },
    rating: { type: Number, min: 0, max: 5 },
    artistName: { type: String, required: true },  
    albumName: { type: String, required: true },   
  },
  { timestamps: true }
);

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
