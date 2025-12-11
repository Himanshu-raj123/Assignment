const { get } = require('mongoose')
const admins = require('../models/admin')
const users = require('../models/users')
const departments = require('../models/department')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { all, search } = require('../routes/admin')
const user = require('../models/users')

async function AdminDashboardStatsCount() {
   const departmentCount = await departments.countDocuments();
   const userRoleCounts = await users.aggregate([
      {
         $group: {
            _id: "$Role",
            count: { $sum: 1 }
         }
      }
   ]);

   const roleCounts = {
      students: userRoleCounts.find(r => r._id === "Student")?.count || 0,
      professors: userRoleCounts.find(r => r._id === "Professor")?.count || 0,
      hods: userRoleCounts.find(r => r._id === "HOD")?.count || 0
   };

   return {
      departments: departmentCount,
      ...roleCounts
   };
}
async function getSignup(req, res) {
   res.render('signup', { error: "", message: "" })
}
async function handleSignup(req, res) {
   const { name, email, password } = req.body;

   if (!name || !email || !password) {
      return res.render('signup', { error: "All fields are required", message: "" });
   }

   try {
      const hashedPassword = await bcrypt.hash(password, 12);
      await admins.create({ Name: name, Email: email, Password: hashedPassword, Role: "Admin" });
      res.status(201).render('login', { error: "", message: "Signup successful, please login" });
   }

   catch (err) {
      if (err.code === 11000) {
         // Duplicate key error
         res.status(409).render('signup', { error: "User already exists", message: "" });
      } else {
         res.status(500).render('signup', { error: "Internal Server Error", message: "" });
      }
   }
}
async function handleLogout(req, res) {
   res.clearCookie('jwt');
   res.redirect("/common/login");
}
async function getAbout(req, res) {
   res.render('admin/about', { user: req.user });
}
async function getContact(req, res) {
   res.render('admin/contact', { user: req.user });
}
async function getDashboard(req, res) {
   res.render('admin/admindashboard',{
      error: "",
      message: "Welcome to Admin Dashboard",
      data: await AdminDashboardStatsCount(),
   })
}
async function getCreateDepartment(req, res) {
   res.render('admin/createDepartment', { error: "", message: "" })
}
async function handleCreateDepartment(req, res) {
   const { Name, Type, Address } = req.body;

   if (!Name || !Type || !Address) {
      return res.render('admin/createDepartment', { error: "All fields are required", message: "" });
   }

   const existDepartment = await departments.findOne({ Name: Name });
   if (existDepartment) {
      return res.render('admin/createDepartment', { error: "Department with this name already exists", message: "" })
   }

   try {
      await departments.create({ Name, Type, Address })
      return res.render('admin/admindashboard', { error: "", message: "Department created successfully", data: await AdminDashboardStatsCount() });
   } catch (err) {
      return res.render('admin/createDepartment', { error: "Server Error", message: "Please Try Again" });
   }
}
async function editDepartment(req, res) {
   try {
      const deptId = req.params.id;
      const dept = await departments.findById(deptId);
      if (!dept) {
         return res.render('admin/AllDepartment', { departments: [], error: "Department Not Found", message: "", curr: 1 })
      }
      res.render('admin/editDepartment', { department: dept, error: "", message: "" });
   } catch (err) {
      res.render('admin/AllDepartment', { departments: [], error: "Server Error", message: "", curr: 1 })
   }
}
async function updateDepartment(req, res) {
   try {
      const deptId = req.params.id;
      const { Name, Type, Address } = req.body;
      if (!Name || !Type || !Address) {
         const dept = await departments.findById(deptId);
         return res.render('admin/editDepartment', { department: dept, error: "All fields are required", message: "" });
      }
      await departments.findByIdAndUpdate(deptId, { Name, Type, Address });
      res.redirect('/admin/Departments/1');
   } catch (err) {
      const dept = await departments.findById(req.params.id);
      res.render('admin/editDepartment', { department: dept, error: "Server Error", message: "Please Try Again" });
   }
}
async function checkUsersInDepartment(req, res) {
   try {
      const deptId = req.params.deptId;
      const usersInDept = await users.find({ Department: deptId });
      res.json({ exists: usersInDept.length > 0 });
   } catch (err) {
      res.status(500).json({ exists: false });
   }
}
async function deleteDepartment(req, res) {
   try {
      const deptId = req.params.id;
      const dept = await departments.findById(deptId);
      if (!dept) {
         return res.render('admin/AllDepartment', { departments: [], error: "Department Not Found", message: "", curr: 1 })
      }

      await departments.findByIdAndDelete(deptId)
      res.redirect('/admin/Departments/1');
   } catch (err) {

   }
}
async function getCreateUser(req, res) {
   res.render('admin/createUser', { departments: await departments.find({}) || [], error: "", message: "" })
}
async function handleCreateUser(req, res) {
   try {
      const { Name, Email, Password, Phone, Role, Department } = req.body;
      if (!Name || !Email || !Password || !Phone || !Role || !Department || Department === "--No Option--" || Role === "--No Option--") {
         return res.render('admin/createUser', { departments: await departments.find({}) || [], error: "All fields are required", message: "" })
      }

      const existingUser = await users.findOne({ Email: Email });

      if (existingUser) {
         return res.render('admin/createUser', { departments: await departments.find({}) || [], error: "User with this email already exists", message: "" })
      }
      const newUser = new users({ Name, Email, Password: await bcrypt.hash(Password, 10), Phone, Role, Department });
      await newUser.save();

      res.render('admin/createUser', { departments: await departments.find({}) || [], error: "", message: "User created successfully" })

   } catch (err) {
      res.render('admin/createUser', { departments: await departments.find({}) || [], error: "Internal Server Error", message: "" })
   }
}
async function getDepartments(req, res) {
   try {
      let curr = parseInt(req.params.curr) || 1;

      const search = req.query.search ? req.query.search.trim() : "";
      const filter = req.query.filter ? req.query.filter.trim() : "";

      const limit = 10;

      let pipeline = [];

      if (search !== "" && filter !== "") {
         pipeline.push({
            $match: { [filter]: { $regex: search, $options: "i" } }
         });
      }

      pipeline.push({ $sort: { Name: 1 } });

      let length;
      const countPipe = [...pipeline];

      countPipe.push({ $count: "count" });

      const result = await departments.aggregate(countPipe);
      length = result[0] ? result[0].count : 0;

      const totalPages = Math.ceil(length / limit) || 1;

      if (curr < 1) curr = 1;
      if (curr > totalPages) curr = totalPages;

      const skip = (curr - 1) * limit;

      pipeline.push(
         { $skip: skip },
         { $limit: limit }
      );

      const allDepartments = await departments.aggregate(pipeline);

      res.render("admin/AllDepartment", {
         departments: allDepartments,
         error: allDepartments.length === 0 ? "No Departments Found" : "",
         message: "",
         curr,
         search,
         filter
      });

   } catch (err) {
         res.render("admin/AllDepartment", {
         departments: [],
         error: "Server Error",
         message: "",
         curr: 1,
         search: "",
         filter: ""
      });
   }
}
async function getUsers(req, res) {
   try {
      let curr = parseInt(req.params.curr) || 1;
      const search = req.query.search ? req.query.search.trim() : "";
      const filter = req.query.filter ? req.query.filter.trim() : "";
      // accept flash-style messages via query params
      const flashMessage = req.query.message ? req.query.message : "";
      const flashError = req.query.error ? req.query.error : "";

      const limit = 10;

      let pipeline = [];
      if (search !== "" && filter !== "") {
         pipeline.push({
            $match: { [filter]: { $regex: search, $options: "i" } }
         });
      }
      pipeline.push({ $sort: { Name: 1 } });

      let length;
      const countPipe = [...pipeline];
      countPipe.push({ $count: "count" });

      const result = await users.aggregate(countPipe);
      length = result[0] ? result[0].count : 0;

      const totalPages = Math.ceil(length / limit) || 1;

      if (curr < 1) curr = 1;
      if (curr > totalPages) curr = totalPages;

      const skip = (curr - 1) * limit;

      pipeline.push(
         { $skip: skip },
         { $limit: limit }
      );

      const allUsers = await users.aggregate(pipeline);

      res.render("admin/AllUsers", {
         users: allUsers,
         // prefer explicit flash error, otherwise show "No Users Found" when list empty
         error: flashError || (allUsers.length === 0 ? "No Users Found" : ""),
         message: flashMessage,
         curr,
         search,
         filter
      });

   } catch (err) {
         res.render("admin/AllUsers", {
         users: [],
         error: "Server Error",
         message: "",
         curr: 1,
         search: "",
         filter: ""
      });
   }
}
async function editUser(req, res) {
   try {
      const userId = req.params.id;
      const user = await users.findById(userId).populate('Department');

      return res.render('admin/editUser',
         {
            user: user,
            error: "",
            message: ""
         }
      )
   } catch (err) {
      return res.redirect('/admin/dashboard');
   }
}
async function updateUser(req, res) {
   try {
      const userId = req.params.id;
      const { Name, Email, Phone, Role } = req.body;

      if (!Name || !Email || !Phone || !Role || !Role) {
         const user = await users.findById(userId).populate('Department');
         return res.render('admin/editUser',
            {
               user: user,
               error: "All fields are required",
               message: ""
            }
         );
      }
      await users.findByIdAndUpdate(userId, { Name, Email, Phone, Role });
      res.redirect('/admin/allUsers/1');
   } catch (err) {
      const user = await users.findById(userId).populate('Department');
      return res.render('admin/editUser',
         {
            user: user,
            error: "All fields are required",
            message: ""
         }
      );
   }
}
async function deleteUser(req, res) {
   try {
      const userId = req.params.id;
      const user = await users.findById(userId);
      if (!user) {
         return res.redirect('/admin/allUsers/1');
      }

      // check for pending assignments for students
      const role = user.Role ? String(user.Role).toLowerCase() : "";
      const assignments = user.Assignments;

      if (role === 'student' && Array.isArray(assignments) && assignments.length > 0) {
         // redirect back to users list with an error message
         const curr = req.params.curr || 1;
         const msg = encodeURIComponent('Student has pending submissions. Cannot delete user.');
         return res.redirect(`/admin/allUsers/${curr}?error=${msg}`);
      }

      await users.findByIdAndDelete(userId);
      const curr = req.params.curr || 1;
      const msg = encodeURIComponent('User deleted successfully');
      return res.redirect(`/admin/allUsers/${curr}?message=${msg}`);
   } catch (err) {
      return res.redirect('/admin/allUsers/1');
   }
}

module.exports = {
   handleSignup, handleLogout,
   getSignup, getDashboard, getCreateDepartment, handleCreateDepartment,
   getDepartments, editDepartment, updateDepartment, deleteDepartment, getCreateUser, handleCreateUser, getUsers, checkUsersInDepartment, editUser, updateUser, deleteUser,getContact,getAbout,
   // filteredSearch,
} 