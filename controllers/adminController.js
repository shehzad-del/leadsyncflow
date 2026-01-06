let User = require("../models/User");
let constants = require("../utils/constants");
let statusCodes = require("../utils/statusCodes");
let httpError = require("../utils/httpError");
let asyncHandler = require("../middlewares/asyncHandler");

function isInList(value, list) {
  if (!Array.isArray(list)) return false;
  return list.indexOf(value) !== -1;
}

// GET pending requests
let getPendingRequests = asyncHandler(async function (req, res, next) {
  let items = await User.find({ status: constants.userStatus.PENDING })
    .select("name email department sex createdAt")
    .sort({ createdAt: -1 });

  res.status(statusCodes.OK).json({ success: true, requests: items });
});

// APPROVE with role dropdown
let approveRequest = asyncHandler(async function (req, res, next) {
  let userId = req.params.id;
  let role = req.body && req.body.role ? String(req.body.role).trim() : "";

  if (!role)
    return next(httpError(statusCodes.BAD_REQUEST, "Role is required"));
  if (!isInList(role, constants.roles))
    return next(httpError(statusCodes.BAD_REQUEST, "Invalid role"));

  let user = await User.findOne({
    _id: userId,
    status: constants.userStatus.PENDING,
  }).select("_id status");
  if (!user)
    return next(httpError(statusCodes.NOT_FOUND, "Pending request not found"));

  user.status = constants.userStatus.APPROVED;
  user.role = role;
  user.approvedBy = req.user.id;
  user.approvedAt = new Date();

  await user.save();

  res
    .status(statusCodes.OK)
    .json({
      success: true,
      message: "User approved",
      userId: userId,
      role: role,
    });
});

// REJECT = delete record immediately
let rejectRequest = asyncHandler(async function (req, res, next) {
  let userId = req.params.id;

  let user = await User.findOne({
    _id: userId,
    status: constants.userStatus.PENDING,
  }).select("_id");
  if (!user)
    return next(httpError(statusCodes.NOT_FOUND, "Pending request not found"));

  await User.deleteOne({ _id: userId });

  res
    .status(statusCodes.OK)
    .json({ success: true, message: "User rejected and deleted" });
});


module.exports = {
  getPendingRequests: getPendingRequests,
  approveRequest: approveRequest,
  rejectRequest: rejectRequest,

};
