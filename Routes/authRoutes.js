const express = require('express');
const User = require('../model/userModel');
const jwt = require('jsonwebtoken');
const passport = require('passport');
require('../passport');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const pendingRegistrations = new Map();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    pendingRegistrations.set(email, {
      username,
      email,
      password,
      otp,
      otpExpires
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Registration",
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent successfully", email });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const pendingUser = pendingRegistrations.get(email);
    
    if (!pendingUser) {
      return res.status(400).json({ message: "No pending registration found" });
    }

    if (pendingUser.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > pendingUser.otpExpires) {
      pendingRegistrations.delete(email);
      return res.status(400).json({ message: "OTP expired" });
    }

    const user = await User.create({
      username: pendingUser.username,
      email: pendingUser.email,
      password: pendingUser.password
    });

    pendingRegistrations.delete(email);

    const token = user.generateAuthToken();

    res.status(201).json({
      message: "Registration successful",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    const pendingUser = pendingRegistrations.get(email);
    if (!pendingUser) {
      return res.status(400).json({ message: "No pending registration found" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    pendingUser.otp = otp;
    pendingUser.otpExpires = otpExpires;
    pendingRegistrations.set(email, pendingUser);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your New OTP for Registration",
      text: `Your new OTP is ${otp}. It expires in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "New OTP sent successfully", email });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = user.generateAuthToken();

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!user) return res.status(400).json({ message: "User not found" });

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    user.resetOtp = otp;
    user.resetOtpExpires = otpExpires;
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Password Reset",
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent successfully", email });
  } catch (error) {
    console.error("Error sending reset OTP:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!user.resetOtp || new Date() > user.resetOtpExpires || user.resetOtp !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
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
      email: req.user.email
    },
    token
  });
});

module.exports = router;