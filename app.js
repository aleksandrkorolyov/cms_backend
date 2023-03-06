require("dotenv").config();
require("./config/database").connect();
const bcrypt = require('bcrypt');
const cors = require('cors')
const jwt = require('jsonwebtoken')

const config = process.env;

const express = require("express");

const app = express();
const auth = require("./middleware/auth")
const version = require("./middleware/version")

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000'
}));

module.exports = app;

// importing user context
const User = require("./model/user");
const Post = require("./model/post");

const { findOneAndUpdate } = require("./model/user");

async function isAdmin(token) {

  const decoded = jwt.verify(token, config.TOKEN_KEY);
  const userMail = decoded.email;

  const currentUser = await User.findOne({ email: userMail });
  if(currentUser.role === 'admin') {
    return(true);
  } else {
    return(false);
  }
}

app.get("/get_user_role", version, async (req, res) => {
    try {
      const token = req.query.token;
      const isCurrentUserAdmin = await isAdmin(token);
      const response = {};
      response.isAdmin = isCurrentUserAdmin;
      res.status(200).json(response);
    } catch(err) {
      res.status(401).send('Not allowed');
    }
})

app.get("/users", auth, version, async (req, res) => {
  try {
    const user = await User.find();
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Headers', "*");
    res.status(200).json(user);
  } catch {
    console.error(res)
  }
})

app.get("/user_search", version, async (req, res) => {
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

app.get("/users_batch", auth, version, async (req, res) => {
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

app.get("/user/:id", auth, version, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    res.header('Access-Control-Allow-Headers', "*");
    res.status(200).json(user);
  } catch(err) {
    res.status(404).send('not found')
  }
})

app.get("/search_user_by_mail", version, async(req, res) => {
  try {
    const searchName = req.query.email;
    const user = await User.find({'email': searchName });
    res.header('Access-Control-Allow-Headers', "*");
    res.status(200).json(user);
  } catch(err) {
    res.status(404).send('not found')
  }
})

app.put("/user/:id/edit", auth, version, async (req, res) => {
  const { first_name, last_name, role, email, password } = req.body;

  const token = req.body.token || req.query.token || req.headers["x-access-token"];

  const isCurrentAdmin = await isAdmin(token)

    if(isCurrentAdmin !== true) {
      res.status(401).send('Not allowed');
      return;
    }

  const user_updated = User.findOneAndUpdate(
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

app.delete('/user/:id/delete', auth, version, async (req, res) => {
  try {

    const token = req.body.token || req.query.token || req.headers["x-access-token"];

    const isCurrentAdmin = await isAdmin(token)

    if(isCurrentAdmin !== true) {
      res.status(401).send('Not allowed');
      return;
    }

    User.deleteOne(
      {_id: req.params.id }
    ).then(result => {
      res.json('deleted')
    })
  } catch(err) {
    res.status(404).send('not found')
  }
})

app.post("/user/add", auth, version, async (req, res) => {
  try {
    const { first_name, last_name, role, email, password} = req.body;

    const token = req.body.token || req.query.token || req.headers["x-access-token"];

    encryptedPassword = await bcrypt.hash(password, 10);

    const isCurrentAdmin = await isAdmin(token);

    if(isCurrentAdmin !== true) {
      res.status(401).send('Not allowed');
      return;
    }

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
    res.status(500).send('Server error');
  }
})

app.post("/user/login", version, async (req, res) => {
  try {
    const {email, password} = req.body;

    // Validate user input
    if (!(email && password)) {
      res.status(400).send("All input is required");
    }

    // Validate if user exist in our database
    const user = await User.findOne({ email });

    if(user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        {user_id: user._id, email},
        process.env.TOKEN_KEY,
        {
          expiresIn: "0.5h",
        }
      )

      const us = isAdmin(token);

      // save user token
      user.token = token;
      res.status(200).json(user);
    } else {
      const error = {
      "code" : 401,
      "error message" : "Invalid credentials"
    }
      res.status(401).json(error);
    }
  } catch(err) {
    const error = {
      "code" : 500,
      "error message" : "Server error"
    }
    res.status(500).json(error);
  }
})

app.get("/get_posts", version, async (req, res) => {
  try{
    const posts = await Post.find();
    res.status(200).json(posts);
  } catch(err) {
    const error = {
      "code" : 500,
      "error message" : "Server error"
    }
    res.status(500).json(error);
  }
})

app.get("/get_post_count", version, async (req, res) => {
  try{
    const postCount = await Post.find().count();
    res.status(200).json(postCount);
  } catch(err) {
    const error = {
      "code" : 500,
      "error message" : "Server error"
    }
    res.status(500).json(error);
  }
})

    // This should be the last route else any after it won't work
    app.use("*", version, (req, res) => {
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
