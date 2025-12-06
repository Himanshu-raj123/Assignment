const express = require('express');
const router = express.Router();
const User = require('../models/users');
const Admin = require('../models/admin')
const bcrypt = require('bcryptjs');
const checkLogin = require('../Auth/checkLogin');
const checkAuth = require('../Auth/checkAuth');
const jwt = require('jsonwebtoken');

router.get('/login',checkLogin, (req, res) => {
   res.render('login', { message: "", error: "" });
});

router.post('/login', async (req, res) => {
   const { email, role, password } = req.body;

   let user;
   if (role === "Admin") {
      user = await Admin.findOne({ Email: email });
   } else {
      user = await User.findOne({ Email: email});
   }

   if (!user) {
      return res.render('login', { message: "", error: "Invalid email or role." });
   }

   const isMatch = await bcrypt.compare(password, user.Password);
   if (!isMatch) {
      return res.render('login', { message: "", error: "Incorrect password." });
   }

   const token = jwt.sign({ id: user._id, role: role,name: user.Name}, "HEllODEVELOPER", { expiresIn: '1h' });

   res.cookie('jwt', token, { httpOnly: true, maxAge: 3600000 });
   return res.redirect(`/${role.toLowerCase()}/dashboard`);
});

module.exports = router;
