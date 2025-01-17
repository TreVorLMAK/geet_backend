// models/Artist.js
const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mbid: { type: String, default: null }, 
  image: { type: String, default: '' }, // URL for the artist's image
  listeners: { type: Number }, // Number of listeners
  bio: { type: String }, // Short biography
});

module.exports = mongoose.model('Artist', artistSchema);
