let mongoose = require("mongoose");

module.exports = function connectDb() {
  let uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is missing");
  }

  mongoose
    .connect(uri)
    .then(function () {
      console.log("MongoDB connected");
    })
    .catch(function (err) {
      console.log("MongoDB connection error:", err.message);
      process.exit(1);
    });
};
