const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
   Name:{
      type:String,
      required:true
   },
   Email:{
      type:String,
      required:true
   },
   Password:{
      type:String,
      required:true,
   },
   Role:{
      type:String,
      required:true,
   }
})

const admin = mongoose.model("admins",adminSchema)

module.exports = admin;