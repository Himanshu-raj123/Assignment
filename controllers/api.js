const admins = require('../models/admin');
const users = require('../models/users');
const departments = require('../models/department');
const Assignment = require('../models/assignment');
const bcrypt = require('bcryptjs');

// Signup API
exports.signup = async (req, res) => {
   const { name, email, password, department, role } = req.body;
   try {
      const hashedPassword = await bcrypt.hash(password, 12);
      if (role === 'Admin') {
         await admins.create({ Name: name, Email: email, Password: hashedPassword, Role: "Admin" });
      } else {
         const newUser = new users({ Name: name, Email: email, Password: hashedPassword, Role: role || "Student", Department: department });
         await newUser.save();
      }
      res.status(201).json({ success: true, message: "Signup successful" });
   } catch (err) {
      res.status(500).json({ success: false, message: err.code === 11000 ? "User already exists" : "Internal Server Error" });
   }
};

// Admin Dashboard API
exports.adminDashboard = async (req, res) => {
   try {
      const pending = await Assignment.countDocuments({ Status: 'submitted' });
      const approved = await Assignment.countDocuments({ Status: 'approved' });
      const rejected = await Assignment.countDocuments({ Status: 'rejected' });
      const recent = await Assignment.find().sort({ createdAt: -1 }).limit(10);
      
      res.json({ success: true, stats: { pending, approved, rejected }, recent });
   } catch (err) {
      res.status(500).json({ success: false, message: "Server Error" });
   }
};

// User Dashboard API
exports.userDashboard = async (req, res) => {
   try {
      const email = req.query.email;
      const user = await users.findOne({ Email: email }).populate('Department');
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      const assignments = await Assignment.find({ StudentId: user._id }).sort({ createdAt: -1 });
      res.json({ success: true, user, assignments });
   } catch (err) {
      res.status(500).json({ success: false, message: "Server Error" });
   }
};
