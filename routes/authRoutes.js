var express = require("express");
var router = express.Router();

var upload = require("../middlewares/upload");
var checkEmailAvailable = require("../middlewares/checkEmailAvailable");
var authController = require("../controllers/authController");

router.post("/signup", checkEmailAvailable, authController.signup);

router.post("/login", authController.login);
router.post("/logout", authController.logout);

module.exports = router;
