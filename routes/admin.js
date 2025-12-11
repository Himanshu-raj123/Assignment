const express = require('express')
const path = require('path')
const router = express.Router();
const checkLogin =  require('../Auth/checkLogin')
const checkAuth = require('../Auth/checkAuth')
const checkAuthorization = require('../Auth/checkAuthorization')  
const {handleSignup,handleLogout,getSignup,getDashboard,getCreateDepartment,handleCreateDepartment,getDepartments,editDepartment,updateDepartment,deleteDepartment,getCreateUser,handleCreateUser,getUsers,checkUsersInDepartment,editUser,updateUser,deleteUser,getAbout,getContact} = require('../controllers/admin')

router.get('/signup',getSignup)

// router.get('/login',checkLogin,getLogin)
// router.post('/login',handleLogin)

router.post('/signup',handleSignup)

router.get('/dashboard', getDashboard)

router.get('/logout',checkAuth,handleLogout)

router.get('/about',checkAuth,getAbout)

router.get('/contact',checkAuth,getContact)

router.get('/createDepartment',checkAuthorization,getCreateDepartment)

router.post('/createDepartment',handleCreateDepartment)

router.get('/Departments/:curr',getDepartments)

router.get('/departments/edit/:id',editDepartment)

router.post('/departments/update/:id',updateDepartment)

router.get('/Departments/checkUsers/:deptId',checkAuthorization,checkUsersInDepartment)

router.get('/departments/delete/:id',checkAuthorization,deleteDepartment)

router.get('/createUser',checkAuthorization,getCreateUser)

router.post('/createUser',checkAuthorization,handleCreateUser)

router.get('/allUsers/:curr',checkAuthorization,getUsers)

router.get('/editUser/:id',checkAuthorization,editUser)

router.post('/updateUser/:id',checkAuthorization,updateUser)

router.get('/deleteUser/:id',checkAuthorization,deleteUser)
   

module.exports = router;