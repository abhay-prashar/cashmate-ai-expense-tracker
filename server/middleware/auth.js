const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // 1. Get token from the header
  const token = req.header('x-auth-token');

  // 2. Check if no token is present
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // 3. Verify the token if it exists
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Add the user from the token's payload to the request object
    // This makes the user's ID available in all our protected routes
    req.user = decoded.user;
    next(); // Move on to the next function (our route handler)
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};