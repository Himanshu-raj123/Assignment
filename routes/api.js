const express = require('express');
const router = express.Router();
const apiController = require('../controllers/api');

router.post('/signup', apiController.signup);
router.get('/admin/dashboard', apiController.adminDashboard);
router.get('/user/dashboard', apiController.userDashboard);

module.exports = router;
