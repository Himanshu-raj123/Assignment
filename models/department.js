const mongoose = require('mongoose')

const departmentSchema = new mongoose.Schema({
   Name:{
      type:String,
      required:true
   },
   Type:{
      type:String,
      required:true
   },
   Address:{
      type:String,
      required:true,
   },
})

const department = mongoose.model("departments",departmentSchema)

module.exports = department;