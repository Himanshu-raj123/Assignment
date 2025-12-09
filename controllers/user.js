const Assignment = require('../models/assignment');
const fs = require('fs');
const path = require('path');

async function findAssignment(studentid){
   return await Assignment.find({ StudentId: studentid });
}

async function calculateStatusCount(assignments) {
   const statusCount = {
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0
   };

   assignments.forEach(assignment => {
      if (statusCount.hasOwnProperty(assignment.Status.toLowerCase())) {
         statusCount[assignment.Status]++;
      }
   });
   return statusCount;
}

async function dashboardHandler(req, res) {
   const user = req.user;
   const assignments = await findAssignment(user.id);
   const statusCount = await calculateStatusCount(assignments);
   res.render('user/userDashboard', { message: `Welcome to User Dashboard ${user.name}`, assignments: assignments, statusCount:statusCount});
}

async function assignmentsHandler(req, res) {
}

async function profileHandeller(req, res) {
   res.render('user/userProfile', { user: req.user });
}

async function getUploadAssignment(req, res) {
   res.render('user/uploadAssignment', { user: req.user, error: "", message: "" });
}

async function handleuploadAssignment(req, res) {
   try {
      const { title, description, category } = req.body;

      if (!title || !title.trim()) {
         return res.render('uploadAssignment', {
            user: req.user,
            error: "Title is required",
            message: ""
         });
      }
      if (!description || !description.trim()) {
         return res.render('uploadAssignment', {
            user: req.user,
            error: "Description is required",
            message: ""
         });
      }
      if (!category || !['Assignment', 'Thesis', 'Report'].includes(category)) {
         return res.render('uploadAssignment', {
            user: req.user,
            error: "Invalid category. Choose Assignment, Thesis, or Report.",
            message: ""
         });
      }
      if (!req.file) {
         return res.render('uploadAssignment', {
            user: req.user,
            error: "File is required. Please upload a PDF file.",
            message: ""
         });
      }

      const assignment = new Assignment({
         Title: title.trim(),
         Description: description.trim(),
         Category: category,
         FilePath: req.file.path,
         FileName: req.file.originalname,
         FileSize: req.file.size,
         Status: 'draft',
         StudentId: req.user.id,
         StudentEmail: req.user.email,
      });

      console.log(req.file)
      await assignment.save();
      return res.render('user/uploadAssignment', {
         user: req.user,
         error: "",
         message: `Assignment uploaded successfully!`
      });

   } catch (err) {
      console.error('Upload assignment error:', err);
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
         fs.unlinkSync(req.file.path);
      }
      return res.render('user/uploadAssignment', {
         user: req.user,
         error: "Server error. Please try again later.",
         message: ""
      });
   }
}

module.exports = { dashboardHandler, assignmentsHandler, profileHandeller, getUploadAssignment, handleuploadAssignment };