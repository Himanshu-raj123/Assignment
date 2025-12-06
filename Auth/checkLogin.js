const jwt = require('jsonwebtoken');

function checkLogin(req, res, next) {
  const token = req.cookies.jwt;
  if (!token)
    return next();
  try {
    const decoded = jwt.verify(token, "HEllODEVELOPER");
    req.user = decoded;
    return res.redirect(`/${decoded.role.toLowerCase()}/dashboard`);
  } catch (err) {
    res.clearCookie('jwt');
    return next();
  }
}

module.exports = checkLogin;
