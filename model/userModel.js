const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: false,
    },
    reviewedAlbums: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Album',
      },
    ],
    profilePicture: {
      type: String,
      default: 'default-profile-picture-url',
    },
    bio: {
      type: String,
      maxLength: 150,
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    resetOtp: { // Add this field for password reset
      type: String,
    },
    resetOtpExpires: { // Add this field for password reset expiration
      type: Date,
    },
  },
  { timestamps: true }
);


userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  console.log("Hashing password: ", this.password); // Log the password before hashing
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password for authentication
userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ id: this._id, username: this.username }, process.env.JWT_SECRET, { expiresIn: '6d' });
};

const User = mongoose.model('User', userSchema);
module.exports = User;
