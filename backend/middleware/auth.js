const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Token manquant ou invalide' });
  }

  const token = authHeader.split(' ')[1];
  if (!token || token.length < 10) {
    return res.status(401).json({ detail: 'Token invalide' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decoded.sub || !decoded.email) {
      return res.status(401).json({ detail: 'Token corrompu' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ detail: 'Session expiree, reconnectez-vous' });
    }
    return res.status(401).json({ detail: 'Token invalide' });
  }
}

module.exports = { authMiddleware };
