const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  first_name: { type: String, default: null },
  last_name: { type: String, default: null },
  role: {type: String, default: "default backend value" },
  email: { type: String, unique: true },
  password: { type: String },
  token: { type: String },
});

module.exports = mongoose.model("user", userSchema);