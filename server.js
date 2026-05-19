const express = require('express');
const cors = require('cors');
const app = express();

const Assignment = require('./models/assignment');
const path = require('path');
const port = 3000;
const dotenv = require('dotenv');
dotenv.config();

//Imported routes
const { connectMongoDB } = require('./connection');
const adminRouter = require('./routes/admin');
const commonRouter = require('./routes/common');
const userRouter = require('./routes/user');
const apiRouter = require('./routes/api');

//MIDDLEWARES
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(require('cookie-parser')());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

//CONNECTION TO MONGODB
const url = process.env.MONGODB_URI || "mongodb+srv://himanshu1242be23:Atlas_5002@cluster0.g4ydm.mongodb.net/ChatWith";
connectMongoDB(url)
  .then(() => console.log("mongoDB connected"))
  .catch((err) => console.log("Error in mongoDB connection:", err));

//ROUTES
app.get('/', (req, res) => {
  res.render('index');
});

app.use('/admin', adminRouter)
app.use('/common', commonRouter)
app.use('/user', userRouter)
app.use('/api', apiRouter)

app.get("/download/:id", async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).send("File not found");
  const filePath = assignment.FilePath;
  res.download(filePath);  // THIS triggers download
});

const PORT = process.env.PORT || port;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});