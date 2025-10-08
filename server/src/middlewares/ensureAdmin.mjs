function ensureAdmin(req, res, next) {
  if (!req.isAuthenticated?.()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const allowedRoles = ['admin', 'recruiter', 'coordinator'];
  if (!allowedRoles.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  return next();
}

export default ensureAdmin;
