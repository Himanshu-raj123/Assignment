const express = require('express');
const router = express.Router();
const { dashboardHandler, getallAssignments, profileHandeller, getUploadAssignment, handleuploadAssignment,getThisAssignments,handleSubmitAssignment,getSubmitAssignment} = require('../controllers/user');
const checkAuth = require('../Auth/checkAuth');
const upload = require('../config/multerConfig');


// Define user-related routes here
router.get('/dashboard', checkAuth, dashboardHandler);
router.get('/assignments', checkAuth, getallAssignments);
router.get('/assignment/:id', checkAuth, getThisAssignments);
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
router.get('/about',checkAuth,(req,res)=>{
   res.render('user/about',{user:req.user});
});
router.get('/contact',checkAuth,(req,res)=>{
   res.render('user/contact',{user:req.user});
});
router.get('/submitAssignment/:id',checkAuth,getSubmitAssignment);
router.post('/submitAssignment/:id',checkAuth,handleSubmitAssignment);

module.exports = router;