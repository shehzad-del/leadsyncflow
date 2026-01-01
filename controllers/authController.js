var bcrypt = require("bcryptjs");
var User = require("../models/User");
var BlacklistedToken = require("../models/BlacklistedToken");

var statusCodes = require("../utils/statusCodes");
var httpError = require("../utils/httpError");
var asyncHandler = require("../middlewares/asyncHandler");
var constants = require("../utils/constants");
var cloudinaryUtil = require("../utils/cloudinary");
var tokenService = require("../utils/tokenService");

function safeString(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function safeEmail(value) {
  return safeString(value).toLowerCase();
}

function safeLower(value) {
  return safeString(value).toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
}

function isAllowedCompanyEmail(email) {
  var domain = "@globaldigitsolutions.com";
  if (!email) return false;
  return String(email).toLowerCase().endsWith(domain);
}

function isInList(value, list) {
  if (!Array.isArray(list)) return false;
  return list.indexOf(value) !== -1;
}

function getSaltRounds() {
  var rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
  if (!rounds || isNaN(rounds)) return 10;
  if (rounds < 8) return 10;
  if (rounds > 14) return 12;
  return rounds;
}

async function uploadProfileImage(req) {
  if (!req.file || !req.file.buffer) {
    return { url: "", publicId: "" };
  }

  try {
    var uploaded = await cloudinaryUtil.uploadBuffer(req.file.buffer, "leadsyncflow_profiles");
    return {
      url: uploaded && uploaded.secure_url ? uploaded.secure_url : "",
      publicId: uploaded && uploaded.public_id ? uploaded.public_id : ""
    };
  } catch (e) {
    throw httpError(statusCodes.BAD_REQUEST, "Profile image upload failed");
  }
}

function validateSignupInput(body) {
  var data = {
    name: safeString(body.name),
    email: safeEmail(body.email),
    sex: safeLower(body.sex),
    department: safeString(body.department),
    password: body.password === undefined || body.password === null ? "" : String(body.password),
    confirmPassword: body.confirmPassword === undefined || body.confirmPassword === null ? "" : String(body.confirmPassword)
  };

  var sexOptions = constants && constants.sexOptions ? constants.sexOptions : null;
  var departments = constants && constants.departments ? constants.departments : null;

  if (!data.name || !data.email || !data.sex || !data.department || !data.password || !data.confirmPassword) {
    return { ok: false, message: "All fields are required" };
  }

  if (!isValidEmail(data.email)) {
    return { ok: false, message: "Invalid email" };
  }

  if (!isAllowedCompanyEmail(data.email)) {
    return { ok: false, message: "Only @globaldigitsolutions.com emails are allowed" };
  }

  if (!isInList(data.sex, sexOptions)) {
    return { ok: false, message: "Invalid sex value" };
  }

  if (!isInList(data.department, departments)) {
    return { ok: false, message: "Invalid department value" };
  }

  if (data.password.length < 6) {
    return { ok: false, message: "Password must be at least 6 characters" };
  }

  if (data.password !== data.confirmPassword) {
    return { ok: false, message: "Passwords do not match" };
  }

  return { ok: true, data: data };
}

function validateLoginInput(body) {
  var data = {
    email: safeEmail(body.email),
    password: body.password === undefined || body.password === null ? "" : String(body.password)
  };

  if (!data.email || !data.password) {
    return { ok: false, message: "Email and password are required" };
  }

  if (!isValidEmail(data.email)) {
    return { ok: false, message: "Invalid email" };
  }

  if (!isAllowedCompanyEmail(data.email)) {
    return { ok: false, message: "Only @globaldigitsolutions.com emails are allowed" };
  }

  return { ok: true, data: data };
}

var signup = asyncHandler(async function (req, res, next) {
  var validation = validateSignupInput(req.body);
  if (!validation.ok) return next(httpError(statusCodes.BAD_REQUEST, validation.message));

  var data = validation.data;

  var existing = await User.findOne({ email: data.email }).select("_id");
  if (existing) return next(httpError(statusCodes.CONFLICT, "Email already registered"));

  var profileImage = await uploadProfileImage(req);

  var saltRounds = getSaltRounds();
  var passwordHash = await bcrypt.hash(data.password, saltRounds);

  try {
    var user = await User.create({
      name: data.name,
      email: data.email,
      sex: data.sex,
      department: data.department,
      profileImage: profileImage,
      passwordHash: passwordHash
    });

    res.status(statusCodes.CREATED).json({
      success: true,
      message: "Signup successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        sex: user.sex,
        department: user.department,
        profileImage: user.profileImage && user.profileImage.url ? user.profileImage.url : ""
      }
    });
  } catch (err) {
    if (err && err.code === 11000) return next(httpError(statusCodes.CONFLICT, "Email already registered"));
    next(err);
  }
});

var login = asyncHandler(async function (req, res, next) {
  var validation = validateLoginInput(req.body);
  if (!validation.ok) return next(httpError(statusCodes.BAD_REQUEST, validation.message));

  var data = validation.data;

  var user = await User.findOne({ email: data.email }).select("name email sex department profileImage passwordHash");
  if (!user) return next(httpError(statusCodes.UNAUTHORIZED, "Invalid credentials"));

  var isMatch = await bcrypt.compare(data.password, user.passwordHash);
  if (!isMatch) return next(httpError(statusCodes.UNAUTHORIZED, "Invalid credentials"));

  // ✅ create token that expires in 12h (JWT_EXPIRES_IN)
  var token = tokenService.signAuthToken(user._id);

  res.status(statusCodes.OK).json({
    success: true,
    message: "Login successful",
    token: token,
    expiresIn: process.env.JWT_EXPIRES_IN || "12h",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      sex: user.sex,
      department: user.department,
      profileImage: user.profileImage && user.profileImage.url ? user.profileImage.url : ""
    }
  });
});

var logout = asyncHandler(async function (req, res, next) {
  // Frontend sends: Authorization: Bearer <token>
  var auth = req.headers.authorization || "";
  if (auth.indexOf("Bearer ") !== 0) {
    return next(httpError(statusCodes.BAD_REQUEST, "Token is required"));
  }


  var token = auth.slice(7).trim();
  if (!token) return next(httpError(statusCodes.BAD_REQUEST, "Token is required"));

  // decode token to get expiry for TTL collection
  var decoded = tokenService.decodeAuthToken(token);
  if (!decoded || !decoded.exp) {
    return next(httpError(statusCodes.BAD_REQUEST, "Invalid token"));
  }

  var expiresAt = new Date(decoded.exp * 1000);

  // store token in blacklist so it becomes invalid immediately
  try {
    await BlacklistedToken.create({ token: token, expiresAt: expiresAt });
  } catch (e) {
    // ignore duplicate blacklist insert
  }

  res.status(statusCodes.OK).json({
    success: true,
    message: "Logged out"
  });
});

module.exports = {
  signup: signup,
  login: login,
  logout: logout
};
