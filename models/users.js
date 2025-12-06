const mongoose = require('mongoose')
const email = require("../config/nodemailer")

const userSchema = new mongoose.Schema({
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
   },
   Phone:{
      type:String,
   },
   Assignments:{
      type: Array,
      default: []
   },
   Department:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "departments",
      required: true
   }
})

userSchema.post("save", async function(doc){
   // for mail sending - nodemailer / mailjet
   let ack = await email.sendMessage({email: doc.Email, password: doc.Password, role: doc.Role})
   console.log(ack)
})

const user = mongoose.model("users",userSchema)

module.exports = user;