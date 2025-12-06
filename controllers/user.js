async function dashboardHandler(req,res){
   const user = req.user;
   res.render('userDashboard',{message:`Welcome to User Dashboard ${user.name}`});
}

module.exports={dashboardHandler};