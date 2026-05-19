const { error } = require('console');
const Assignment = require('../models/assignment');
const fs = require('fs');
const path = require('path');
const users = require('../models/users');

// Helper function to build query based on role
async function getRoleBasedQuery(user) {
   // HODs get broad view of their department's assignments
   if (user.role === 'HOD') {
      const hodDetails = await users.findById(user.id);
      if(hodDetails && hodDetails.Department){
          const deptUsers = await users.find({ Department: hodDetails.Department }).select('_id');
          return { StudentId: { $in: deptUsers.map(s => s._id) } };
      }
      // Fallback
      return { Reviewer: user.name }; 
   } 
   // Professors only see what's directly assigned to them for review
   else if (user.role === 'Professor') {
      return { Reviewer: user.name };
   } 
   // Students only see their own assignments
   else {
      return { StudentId: user.id };
   }
}

async function calculateStatusCount(assignments) {
   const statusCount = {
      draft: 0,
      submitted: 0,
      reviewed: 0,
      approved: 0,
      rejected: 0
   };

   assignments.forEach(assignment => {
      let st = assignment.Status ? assignment.Status.toLowerCase() : '';
      if (statusCount.hasOwnProperty(st)) {
         statusCount[st]++;
      }
   });
   return statusCount;
}

async function dashboardHandler(req, res) {
   const user = req.user;
   const query = await getRoleBasedQuery(user);
   // Only limit display for speed, status count checks all
   const assignments = await Assignment.find(query).sort({ updatedAt: -1 }).limit(10);
   const allAssignments = await Assignment.find(query);
   const statusCount = await calculateStatusCount(allAssignments);
   
   res.render('user/userDashboard', { user: user, message: `Welcome to User Dashboard ${user.name}`, assignments: assignments, statusCount: statusCount });
}

async function getallAssignments(req, res) {
   const statusFilter = (req.query.status || '').toString().trim();
   const sortBy = (req.query.sort || req.query.sortBy || '').toString().trim();
   const searchQuery = (req.query.search || '').toString().trim();

   // Build query
   const query = await getRoleBasedQuery(req.user);

   const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
   if (statusFilter) {
      const escaped = escapeRegex(statusFilter).replace(/-/g, '\\s*');
      query.Status = { $regex: new RegExp('^' + escaped + '$', 'i') };
   }
   if (searchQuery) {
      query.Title = { $regex: escapeRegex(searchQuery), $options: 'i' };
   }

   let dbQuery = Assignment.find(query);
   if (sortBy === 'newest') dbQuery = dbQuery.sort({ SubmittedAt: -1, updatedAt: -1, createdAt: -1 });
   else if (sortBy === 'oldest') dbQuery = dbQuery.sort({ SubmittedAt: 1, updatedAt: 1, createdAt: 1 });
   else if (sortBy === 'title' || sortBy === 'Title') dbQuery = dbQuery.sort({ Title: 1 });
   else dbQuery = dbQuery.sort({ createdAt: -1 });

   const assignments = await dbQuery.exec();

   const allQuery = await getRoleBasedQuery(req.user);
   const allAssignments = await Assignment.find(allQuery);
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
      message: req.query.message || '',
      error: ''
   });
}

async function getThisAssignments(req, res) {
   const assignmentId = req.params.id;
   try {
      let query = await getRoleBasedQuery(req.user);
      // Limit search to the specific ID
      query._id = assignmentId;
      
      const assignment = await Assignment.findOne(query);
      if (!assignment) {
         return res.status(404).render('user/assignmentDetail', {
            user: req.user,
            assignment: null,
            error: 'Assignment not found or you lack permission to view it.',
            message: ''
         });
      }
      
      let hods = [];
      if (req.user.role === 'Professor') {
         hods = await users.find({ Role: 'HOD' });
      }

      res.render('user/assignmentDetail', {
         user: req.user,
         assignment: assignment,
         hods: hods,
         error: '',
         message: ''
      });
   } catch (err) {
      console.error(err);
      res.status(500).render('user/assignmentDetail', {
         user: req.user,
         assignment: null,
         error: 'Server error. Please try again later.',
         message: ''
      });
   }
}

async function getUploadAssignment(req, res) {
   res.render('user/uploadAssignment', { user: req.user, error: "", message: "" });
}

async function handleuploadAssignment(req, res) {
   try {
      const { title, description, category } = req.body;

      if (!title || !title.trim()) {
         return res.render('user/uploadAssignment', { user: req.user, error: "Title is required", message: "" });
      }
      if (!description || !description.trim()) {
         return res.render('user/uploadAssignment', { user: req.user, error: "Description is required", message: "" });
      }
      if (!category || !['Assignment', 'Thesis', 'Report'].includes(category)) {
         return res.render('user/uploadAssignment', { user: req.user, error: "Invalid category.", message: "" });
      }
      if (!req.file) {
         return res.render('user/uploadAssignment', { user: req.user, error: "File is required.", message: "" });
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
      return res.render('user/uploadAssignment', { user: req.user, error: "", message: `Assignment uploaded successfully!` });

   } catch (err) {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.render('user/uploadAssignment', { user: req.user, error: "Server error. Please try again.", message: "" });
   }
}

async function getSubmitAssignment(req, res) {
   const assignmentId = req.params.id;
   try {
      const assignment = await Assignment.findOne({ _id: assignmentId, StudentId: req.user.id });
      if (!assignment) {
         return res.status(404).render('user/assignmentDetail', { user: req.user, assignment: null, error: 'Not found', message: '' });
      }
      res.render('user/submitForm', { user: req.user, assignment: assignment, error: '', message: '', professors: await users.find({ Role: 'Professor' }) });
   } catch (err) {
      res.status(500).render('user/assignmentDetail', { user: req.user, assignment: null, error: 'Server error.', message: '' });
   }
}

async function handleSubmitAssignment(req, res) {
   const assignmentId = req.params.id;
   try {
      const assignment = await Assignment.findOne({ _id: assignmentId, StudentId: req.user.id });
      if (!assignment) {
         return res.status(404).render('user/assignmentDetail', { user: req.user, assignment: null, error: 'Not found', message: '' });
      }
      assignment.Status = 'submitted';
      assignment.SubmittedAt = new Date();

      const reviewer = await users.findById(req.body.reviewer);
      if (!reviewer || reviewer.Role !== 'Professor') {
         return res.render('user/submitForm', {
            user: req.user, assignment: assignment, error: 'Invalid reviewer.', message: '', professors: await users.find({ Role: 'Professor' })
         });
      }
      
      assignment.Reviewer = reviewer.Name;
      if (!reviewer.Assignments.includes(assignment._id)) {
         reviewer.Assignments.push(assignment._id);
      }

      await reviewer.save();
      await assignment.save();
      res.redirect('/user/assignments?message=Assignment+Submitted+for+Review');
   } catch (err) {
      res.status(500).render('user/assignmentDetail', { user: req.user, assignment: null, error: 'Server error.', message: '' });
   }
}

async function handleReviewAssignment(req, res) {
   const assignmentId = req.params.id;
   const { action, hodId, remarks } = req.body;
   
   try {
      const assignment = await Assignment.findOne({ _id: assignmentId, Reviewer: req.user.name });
      if (!assignment) {
         return res.status(404).send("Assignment not found or invalid permissions.");
      }
      
      if (remarks && remarks.trim()) {
         assignment.Remarks = (assignment.Remarks ? assignment.Remarks + '\n\n' : '') + `[${req.user.role} ${req.user.name}]: ` + remarks.trim();
      }

      if (req.user.role === 'Professor') {
         if (action === 'approve') {
             assignment.Status = 'approved';
         } else if (action === 'reject') {
             assignment.Status = 'rejected';
         }
      } else if (req.user.role === 'HOD') {
         if (action === 'approve') {
             assignment.Status = 'approved';
         } else if (action === 'reject') {
             assignment.Status = 'rejected';
         }
      }
      
      await assignment.save();
      res.redirect('/user/assignments?message=Review+submitted+successfully');
   } catch (err) {
      console.error('handleReviewAssignment error:', err);
      res.status(500).send("Server Error");
   }
}

async function profileHandeller(req, res) {
   const user = req.user;
   const query = await getRoleBasedQuery(user);
   const assignments = await Assignment.find(query);
   res.render('user/profile', { user: await users.findById(req.user.id).populate('Department'), assignments: assignments, sessionUser: user });
}

module.exports = { dashboardHandler, getallAssignments, profileHandeller, getUploadAssignment, handleuploadAssignment, getThisAssignments, handleSubmitAssignment, getSubmitAssignment, handleReviewAssignment };