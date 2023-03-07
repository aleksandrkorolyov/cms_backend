const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: { type: String, default: null },
  image: { type: String, default: null },
  content: {type: String, default: "default text value" },
});

module.exports = mongoose.model("post", postSchema);