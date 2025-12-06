const express = require('express');
const router = express.Router();
const {dashboardHandler} = require('../controllers/user');
const checkLogin = require('../Auth/checkLogin');
const checkAuth = require('../Auth/checkAuth');

// Define user-related routes here
router.get('/dashboard',checkAuth,dashboardHandler);

module.exports = router;