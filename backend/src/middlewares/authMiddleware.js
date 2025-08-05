const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  // 1. Check for Authorization header
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      message: 'Not authorized. No token provided.' 
    });
  }

  // 2. Extract token
  const token = authHeader.split(' ')[1];
  
  // 3. Verify token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT Verification Error:', err.message);
      
      let message = 'Not authorized. Token failed.';
      if (err.name === 'TokenExpiredError') {
        message = 'Session expired. Please login again.';
      } else if (err.name === 'JsonWebTokenError') {
        message = 'Invalid token.';
      }
      
      return res.status(401).json({ 
        success: false,
        message 
      });
    }
    
    // 4. Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };
    
    next();
  });
};

module.exports = { protect };