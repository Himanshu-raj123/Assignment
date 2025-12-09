const express = require('express');
const router = express.Router();
const { dashboardHandler, assignmentsHandler, profileHandeller, getUploadAssignment, handleuploadAssignment } = require('../controllers/user');
const checkAuth = require('../Auth/checkAuth');
const upload = require('../config/multerConfig');


// Define user-related routes here
router.get('/dashboard', checkAuth, dashboardHandler);
router.get('/assignments', checkAuth, assignmentsHandler);
router.get('/profile', checkAuth, profileHandeller);
router.get('/uploadAssignment', checkAuth, getUploadAssignment);
router.post('/uploadAssignment',checkAuth,
  (req, res, next) => {
    upload.single('assignmentFile')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.render('user/uploadAssignment', {
            user: req.user,
            error: 'File size must be less than 700MB',
            message: ''
          });
        }

        return res.render('user/uploadAssignment', {
          user: req.user,
          error: err.message,
          message: ''
        });
      }
      console.log("No error till here!")
      next();
    });
  },
  handleuploadAssignment
);


module.exports = router;