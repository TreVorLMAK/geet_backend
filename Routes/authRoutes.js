const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../model/userModel');
const jwt = require('jsonwebtoken');
const passport = require('passport');
require('../passport');

const router = express.Router();

// User registration route
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if the user already exists (case-insensitive email check)
    const existingUser = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Create a new user instance
    const newUser = new User({
      username,
      email,
      password,
    });

    console.log('User to be saved:', newUser);

    // Save the user to the database
    await newUser.save();

    // Generate JWT token
    const token = newUser.generateAuthToken();

    // Send the response with token and user data
    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
      token,
    });
  } catch (error) {
    console.error('Error during registration:', error); // Error logging
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// User login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login Attempt - Email:', email);
    console.log('Login Attempt - Password:', password);

    // Find user by email (case-insensitive)
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!user) {
      console.log('User not found');
      return res.status(400).json({ message: "Invalid email or password" });
    }

    console.log('Stored Hashed Password:', user.password);

    // Compare the provided password with the hashed password in the DB
    const isMatch = await bcrypt.compare(password.trim(), user.password.trim());
    console.log('Password Match:', isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Generate JWT token, including `username` in the payload
    const token = jwt.sign(
      { userId: user._id, username: user.username }, // Add username here
      process.env.JWT_SECRET,
      { expiresIn: '6d' }
    );

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback route
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    // Generate JWT and send response
    const token = jwt.sign(
      { userId: req.user._id, username: req.user.username },
      process.env.JWT_SECRET,
      { expiresIn: '6d' }
    );

    res.status(200).json({
      message: "Google login successful",
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
      },
      token,
    });
  }
);


module.exports = router;
