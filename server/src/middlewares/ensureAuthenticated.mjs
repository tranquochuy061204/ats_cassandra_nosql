function ensureAuthenticated(req, res, next) {
  console.log('req.user:', req.user);
  if (req.isAuthenticated?.()) return next();

  return res.status(401).json({ error: 'Unauthorized' });
}
export default ensureAuthenticated;
