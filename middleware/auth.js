const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Authentication middleware to verify JWT access token
 * Attaches user object to req.user if authentication succeeds
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.'
      });
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    req.user = {
      id: user.id,
      email: user.email
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
      error: error.message
    });
  }
};

/**
 * Middleware to verify refresh token
 * Used for refresh token endpoint
 * Attaches user object to req.user if authentication succeeds
 */
const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const { verifyRefreshToken: verifyToken } = require('../utils/jwt');
    const { RefreshToken: RefreshTokenModel } = require('../models');
    
    // Verify token signature
    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Check if token exists in database and is not revoked
    const tokenRecord = await RefreshTokenModel.findOne({
      where: {
        token: refreshToken,
        userId: decoded.userId,
        isRevoked: false
      }
    });

    if (!tokenRecord) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found or revoked'
      });
    }

    // Check if token is expired
    if (new Date() > new Date(tokenRecord.expiresAt)) {
      await tokenRecord.update({ isRevoked: true });
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired'
      });
    }

    // Verify user still exists
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = {
      id: user.id,
      email: user.email
    };
    req.refreshTokenRecord = tokenRecord;
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Refresh token verification error.',
      error: error.message
    });
  }
};

module.exports = { authenticate, verifyRefreshToken };

