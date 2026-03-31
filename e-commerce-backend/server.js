require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require('./models/User')

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log("Mongodb connected!"))
    .catch(err => console.log(err));

app.get('/', (req, res) => {
    res.send("Server is running");
});

app.get('/api/users', async (req, res) => {
    const users = await User.find();
    res.json(users);
});

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`)
})
