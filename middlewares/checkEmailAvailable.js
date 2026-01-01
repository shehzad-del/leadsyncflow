let User = require('../models/User');
let statusCodes = require('../utils/statusCodes');
let httpError = require('../utils/httpError');
let asyncHandler = require('./asyncHandler');

function normalizeEmail(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim().toLowerCase();
}

let checkEmailAvailable = asyncHandler(async function (req, res, next) {
  let email = normalizeEmail(req.body.email);

  if (!email) {
    return next(httpError(statusCodes.BAD_REQUEST, 'Email is required'));
  }

  let existingUser = await User.findOne({ email: email }).select('_id');
  if (existingUser) {
    return next(httpError(statusCodes.CONFLICT, 'Email already registered'));
  }

  next();
});

module.exports = checkEmailAvailable;
