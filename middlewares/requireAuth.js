var statusCodes = require("../utils/statusCodes");
var httpError = require("../utils/httpError");
var tokenService = require("../utils/tokenService");
var BlacklistedToken = require("../models/BlacklistedToken");

function getBearerToken(req) {
  var header = req.headers.authorization || "";
  if (header.indexOf("Bearer ") !== 0) return "";
  return header.slice(7).trim();
}

module.exports = function requireAuth(req, res, next) {
  var token = getBearerToken(req);
  if (!token) return next(httpError(statusCodes.UNAUTHORIZED, "Not authenticated"));

  BlacklistedToken.findOne({ token: token })
    .select("_id")
    .then(function (found) {
      if (found) return next(httpError(statusCodes.UNAUTHORIZED, "Session expired, please login again"));

      try {
        var decoded = tokenService.verifyAuthToken(token);
        req.user = { id: decoded.id };
        req.token = token;
        next();
      } catch (e) {
        return next(httpError(statusCodes.UNAUTHORIZED, "Session expired, please login again"));
      }
    })
    .catch(function (err) {
      next(err);
    });
};
