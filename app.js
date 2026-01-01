let express = require("express");
let dotenv = require("dotenv");
let cors = require("cors");
let path = require("path");

// 1️⃣ Load env FIRST
let envResult = dotenv.config();
if (envResult.error) {
  console.error("❌ Failed to load .env file");
  process.exit(1);
}


// Optional hard-fail (recommended)
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error("❌ Cloudinary environment letiables are missing");
  process.exit(1);
}

// 3️⃣ Now load rest of app
let connectDb = require("./config/db");
let errorHandler = require("./middlewares/errorHandler");
let authRoutes = require("./routes/authRoutes");

connectDb();

let app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res) {
  res.send("LeadSyncFlow API running");
});

app.use("/api/auth", authRoutes);

app.use(errorHandler);

let port = process.env.PORT || 5000;
app.listen(port, function () {
  console.log("🚀 Server running on port " + port);
});
