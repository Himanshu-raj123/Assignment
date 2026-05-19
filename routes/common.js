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
   try {
      const { email, role, password } = req.body;

      let user;
      if (role === "Admin") {
         user = await Admin.findOne({ Email: email });
      } else {
         user = await User.findOne({ Email: email});
         if (user && user.Role !== role) {
            return res.status(401).render('login', { error: `Account registered as ${user.Role}, but ${role} was selected.`, message: "" });
         }
      }

      if (!user) {
         return res.status(401).render('login', { error: "Invalid email or role.", message: "" });
      }

      const isMatch = await bcrypt.compare(password, user.Password);
      if (!isMatch) {
         return res.status(401).render('login', { error: "Incorrect password.", message: "" });
      }

      const actualRole = role === "Admin" ? "Admin" : user.Role;
      const token = jwt.sign({ id: user._id, email: user.Email, role: actualRole, name: user.Name}, "HEllODEVELOPER", { expiresIn: '1h' });

      res.cookie('jwt', token, { httpOnly: true, maxAge: 60*60*1000 });
      
      if (role === "Admin") {
         return res.redirect('/admin/dashboard');
      } else {
         return res.redirect('/user/dashboard');
      }
   } catch (error) {
      console.error(error);
      return res.status(500).render('login', { error: "Internal Server Error. Please try again.", message: "" });
   }
});

module.exports = router;
