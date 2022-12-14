require("dotenv").config();
require("./config/database").connect();
// const bcrypt = require('bcrypt');
const cors = require('cors')
const jwt = require('jsonwebtoken')

const express = require("express");

const app = express();

app.use(express.json());
app.use(cors());

module.exports = app;

// importing user context
const User = require("./model/user");
const { findOneAndUpdate } = require("./model/user");
// const auth = require("./middleware/auth");

app.get("/users", async (req, res) => {
  try {
    const user = await User.find();
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Headers', "*");
    res.status(200).json(user);
  } catch {
    console.error(res)
  }
})

app.get("/user_search", async (req, res) => {
  try{
    const search_name = req.query.search_name;
    const user = await User.find({'first_name': { $regex: search_name} });

    const response = {};
    response.user = user;
    response.totalPages = 1;

    res.status(200).json(response);
  } catch {

  }
})

app.get("/users_batch", async (req, res) => {
  try {

    // Fetching sorting variables from query
    const sortField = (req.query.sort_field) ? req.query.sort_field : '_id';
    const sortDirect = (req.query.sort_direct) ? req.query.sort_direct : '1';
    const sortCond = {};
    sortCond[sortField] = parseInt(sortDirect);

    const user = await User.find({})
    .sort(sortCond)
    .limit(req.query.count)
    .skip((req.query.current_page -1) * req.query.count)
    ;

    const allUsers = await User.find();

    const response = {};
    response.user = user;

    response.totalPages = (allUsers.length % req.query.count > 0) ? 
    (Math.floor(allUsers.length / req.query.count) + 1) :
    (Math.floor(allUsers.length / req.query.count)) ;

    res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Headers', "*");
    res.status(200).json(response);
  } catch {
    console.error(res)
  }
})

app.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    res.header('Access-Control-Allow-Headers', "*");
    res.status(200).json(user);
  } catch(err) {
    console.log(err)
  }
})

app.get("/search_user_by_mail", async(req, res) => {
  try {
    const searchName = req.query.email;
    const user = await User.find({'email': searchName });
    res.header('Access-Control-Allow-Headers', "*");
    res.status(200).json(user);
  } catch(err) {
    console.log(err)
  }
})

app.put("/user/:id/edit", (req, res) => {
  const { first_name, last_name, role, email, password } = req.body;
  const user_updaed = User.findOneAndUpdate(
    { _id : req.params.id},
    { 
      $set: {
        first_name,
        last_name,
        role,
        email,
        password,
      }
    },
      {
        upsert: true
      }
  ).then(result => {
    res.json('success')
  })
})

app.delete('/user/:id/delete', (req, res) => {
  try {
    User.deleteOne(
      {_id: req.params.id }
    ).then(result => {
      res.json('deleted')
    })
  } catch(err) {
    console.log(err)
  }
})

app.post("/user/add", async (req, res) => {
  try {
    const { first_name, last_name, role, email, password } = req.body;

    // encryptedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      first_name,
      last_name,
      role,
      email: email.toLowerCase(),
      password,
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
