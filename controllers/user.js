const { error } = require('console');
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
async function getallAssignments(req, res) {
   const statusFilter = (req.query.status || '').toString().trim();
   const sortBy = (req.query.sort || req.query.sortBy || '').toString().trim();
   const searchQuery = (req.query.search || '').toString().trim();

   // Build query for filtered results (user-visible list)
   const query = { StudentId: req.user.id };

   // Helper to safely escape regex input
   const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

   if (statusFilter) {
      // allow filters like 'under-review' to match 'Under Review' in DB
      const escaped = escapeRegex(statusFilter).replace(/-/g, '\\s*');
      query.Status = { $regex: new RegExp('^' + escaped + '$', 'i') };
   }

   if (searchQuery) {
      query.Title = { $regex: escapeRegex(searchQuery), $options: 'i' };
   }

   // Prepare the mongoose query and apply sorting
   let dbQuery = Assignment.find(query);
   if (sortBy === 'newest') {
      dbQuery = dbQuery.sort({ SubmittedAt: -1, updatedAt: -1, createdAt: -1 });
   } else if (sortBy === 'oldest') {
      dbQuery = dbQuery.sort({ SubmittedAt: 1, updatedAt: 1, createdAt: 1 });
   } else if (sortBy === 'title' || sortBy === 'Title') {
      dbQuery = dbQuery.sort({ Title: 1 });
   } else {
      // default: most recently created first
      dbQuery = dbQuery.sort({ createdAt: -1 });
   }

   const assignments = await dbQuery.exec();

   // Counts for header should consider all assignments (unfiltered)
   const allAssignments = await Assignment.find({ StudentId: req.user.id });
   const totalAssignments = allAssignments.length;
   let draftCount = 0, approvedCount = 0;
   allAssignments.forEach(a => {
      if (a.Status && a.Status.toLowerCase() === 'draft') draftCount++;
      if (a.Status && a.Status.toLowerCase() === 'approved') approvedCount++;
   });

   res.render('user/allAssignments', {
      user: req.user,
      assignments: assignments,
      totalAssignments: totalAssignments,
      draftCount: draftCount,
      approvedCount: approvedCount,
      message: '',
      error: ''
   });
}
async function getThisAssignments(req, res) {
   const assignmentId = req.params.id;
   try {
      const assignment = await Assignment.findOne({ _id: assignmentId, StudentId: req.user.id });
      if (!assignment) {
         return res.status(404).render('user/assignmentDetail', {
            user: req.user,
            assignment: null,
            error: 'Assignment not found',
            message: ''
         });
      }
      res.render('user/assignmentDetail', {
         user: req.user,
         assignment: assignment,
         error: '',
         message: ''
      });
   } catch (err) {
      res.status(500).render('user/assignmentDetail', {
         user: req.user,
         assignment: null,
         error: 'Server error. Please try again later.',
         message: ''
      });
   }
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

module.exports = { dashboardHandler, getallAssignments, profileHandeller, getUploadAssignment, handleuploadAssignment,getThisAssignments };