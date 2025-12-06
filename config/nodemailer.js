const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "hraj13085@gmail.com",
    pass: "fnyn qaol acrj epfc",
  },
});

module.exports.sendMessage = async ({email, password, role}) => {
   try{
      const info = await transporter.sendMail({
        from: 'hraj13085@gmail.com',
        to: email,
        subject: "Welcome to Assignment approval platform",
        text: `username: ${email}, password: ${password}, for role: ${role}`
      });
      return true
   }catch(e){
      return false
   }  
}