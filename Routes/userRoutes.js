const express = require('express');
const User = require('../model/userModel');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    console.log("Authenticated User:", req.user); // Debugging

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized access" });
    }

    const user = await User.findById(req.user.userId).select("-password").lean();
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    res.json({
      status: "success",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture || null,
        bio: user.bio || "",
        reviewedAlbums: user.reviewedAlbums || [],
      },
    });
  } catch (error) {
    console.error("Profile Route Error:", error);
    res.status(500).json({ status: "error", message: "Error fetching user profile" });
  }
});

router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username })
      .select('-password') // Exclude password
      .populate({
        path: 'reviewedAlbums',
        select: 'title artist', // Include relevant fields from the Album model
      })
      .lean();

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    res.json({
      status: 'success',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture || null,
        bio: user.bio || '',
        reviewedAlbums: user.reviewedAlbums || [],
      },
    });
  } catch (error) {
    console.error('Profile Route Error:', error);
    res.status(500).json({ status: 'error', message: 'Error fetching user profile' });
  }
});

router.put('/update-bio', authMiddleware, async (req, res) => {
  const { bio } = req.body;
  const userId = req.user.id; // Ensure you're accessing `id` properly here

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.bio = bio;
    await user.save();

    res.status(200).json({
      message: 'Bio updated successfully',
      data: {
        username: user.username,
        email: user.email,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error('Error updating bio:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
