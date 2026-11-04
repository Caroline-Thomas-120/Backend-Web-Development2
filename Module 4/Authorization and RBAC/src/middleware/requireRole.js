function requireRole(...allowedRoles) {
  return function (req, res, next) {
    // Authentication check
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required',
        },
      });
    }

    // Authorization check
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action',
        },
      });
    }

    // User has the required role
    return next();
  };
}

module.exports = requireRole;
