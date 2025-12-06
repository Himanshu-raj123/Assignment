const jwt = require('jsonwebtoken');

function checkAuthorization(req, res, next) {
   const token = req.cookies.jwt;
   
   if (!token) {
      return next();
   }

   try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'HEllODEVELOPER');
      if(decoded.role !== 'Admin') {
         res.clearCookie('jwt');
         return res.status(401).redirect('/admin/login');
      }
      next(); // Allow to go to controller
   } catch (err) {
      res.clearCookie('jwt');
      return next();
   }
}

module.exports = checkAuthorization;
