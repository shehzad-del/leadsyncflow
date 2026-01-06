let express = require("express");
let router = express.Router();

let authController = require("../controllers/authController");

router.post("/signup", authController.signup); // JSON only
router.post("/login", authController.login);
router.post("/logout", authController.logout);

module.exports = router;
