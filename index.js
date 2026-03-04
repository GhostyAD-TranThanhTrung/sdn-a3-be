const express = require('express');
const cors = require('cors');
const app = express();
const quiz = require('./router/quizRouter');
const user = require('./router/userRouter');
const connectDB = require('./dbConnection')
const jwt = require('jsonwebtoken')

require('dotenv').config();

const port = process.env.PORT;
connectDB();

// Configure CORS to allow requests from frontend
app.use(cors({
  origin: 'http://localhost:5173', // Allow frontend origin
  credentials: true, // Allow credentials if needed
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/quizzes', quiz);
app.use('/users', user);

app.get('/', (req, res) => {
  res.send('Hello, the server is running');
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

module.exports = app;