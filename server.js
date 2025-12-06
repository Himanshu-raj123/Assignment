const express = require('express');
const app = express();
const port = 3000;

//Imported routes
const { connectMongoDB } = require('./connection');
const adminRouter = require('./routes/admin');
const commonRouter = require('./routes/common');
const userRouter  = require('./routes/user');

app.use(express.json());
app.use(require('cookie-parser')());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

//MIDDLEWARES
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

//CONNECTION TO MONGODB
connectMongoDB("mongodb://127.0.0.1:27017/AdminAssignment")
.then(()=>console.log("mongoDB connected"))
.catch(()=>console.log("Error in mongoDB connection"));

//ROUTES
app.get('/', (req, res) => {
  res.render('index');
});

app.use('/admin', adminRouter)
app.use('/common',commonRouter)
app.use('/user',userRouter)

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});