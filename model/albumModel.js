const mongoose = require('mongoose');

// Album Schema
const albumSchema = new mongoose.Schema(
  {
    mbid: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    genre: { type: String, required: true },
    releaseYear: { type: Number, required: true },
    coverArt: { type: String },
    description: { type: String },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const Album = mongoose.model('Album', albumSchema);

module.exports = Album;
