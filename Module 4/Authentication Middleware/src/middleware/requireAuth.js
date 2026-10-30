const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization ?? '';
  const match = authHeader.match(/^Bearer ([^\s]+)$/i);
  const token = match ? match[1] : null;

  if (token === null) {
    return res.status(401).json({
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required'
      }
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });

    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required'
      }
    });
  }
};