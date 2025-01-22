const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'No authorization header found' });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.replace('Bearer ', '')
      : authHeader;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      console.log('Decoded Token:', decoded);
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

module.exports = authMiddleware;