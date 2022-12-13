require("dotenv").config();
require("./config/database").connect();
const bcrypt = require('bcrypt');
const cors = require('cors')
const jwt = require('jsonwebtoken')

const express = require("express");

const app = express();

app.use(express.json());
app.use(cors());

module.exports = app;

// importing user context
const User = require("./model/user");
// const auth = require("./middleware/auth");

app.post("/users", async (req, res) => {
  try {
    const user = await User.find();
    res.header('Access-Control-Allow-Headers', "*");
    res.status(200).json(user);
  } catch {
    console.error(res)
  }
})

app.post("/user/add", async (req, res) => {
  try {
    const { first_name, last_name, role, email, password } = req.body;

    encryptedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      first_name,
      last_name,
      role,
      email: email.toLowerCase(),
      password: encryptedPassword,
    })
    res.header('Access-Control-Allow-Headers', "*");
    res.status(201).json(user);
  } catch(err) {
    console.log(err)
  }
})

    // This should be the last route else any after it won't work
    app.use("*", (req, res) => {
    res.status(404).json({
      success: "false",
      message: "Page not found",
      error: {
        statusCode: 404,
        message: "You reached a route that is not defined on this server",
      },
    });
  });
  
  module.exports = app;
