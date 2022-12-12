require("dotenv").config();
require("./config/database").connect();
// const bcrypt = require('bcrypt');
const cors = require('cors')
const jwt = require('jsonwebtoken')

const express = require("express");

const app = express();

app.use(express.json());
app.use(cors());

// Logic goes here

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

  }
})



app.get("/welcome", (req, res) => {
    res.status(200).send("Welcome 🙌 ");
  });

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
