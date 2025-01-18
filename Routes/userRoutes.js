const express = require('express');
const User = require('../model/userModel');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({ 
        status: 'error',
        message: 'User not found' 
      });
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
      }
    });
  } catch (error) {
    console.error('Profile Route Error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid user ID format' 
      });
    }
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching user profile' 
    });
  }
});

module.exports = router;
