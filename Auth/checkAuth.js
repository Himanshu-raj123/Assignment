const jwt = require('jsonwebtoken');

const checkAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.render('login',{err})
  }
  jwt.verify(token, "HEllODEVELOPER", (err, decodedToken) => {
    if (err) {
      res.clearCookie('jwt');
      return res.redirect('/common/login');
    }
    req.user = decodedToken;
    next();
  });
};

module.exports = checkAuth;
