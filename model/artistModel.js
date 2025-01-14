// models/Artist.js
const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mbid: { type: String, unique: true }, // MusicBrainz ID, often used by Last.fm
  image: { type: String }, // URL for the artist's image
  listeners: { type: Number }, // Number of listeners
  playcount: { type: Number }, // Total playcount
  bio: { type: String }, // Short biography
});

module.exports = mongoose.model('Artist', artistSchema);
