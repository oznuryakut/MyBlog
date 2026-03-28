const isLoggedIn = (req, res, next) => {
  if (req.session.user) return next();
  res.redirect('/auth/login');
};

const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') return next();
  res.redirect('/');
};

const isGuest = (req, res, next) => {
  if (!req.session.user) return next();
  res.redirect('/');
};

module.exports = { isLoggedIn, isAdmin, isGuest };