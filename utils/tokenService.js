var jwt = require("jsonwebtoken");

function signAuthToken(userId) {
  var secret = process.env.JWT_SECRET;
  var expiresIn = process.env.JWT_EXPIRES_IN || "12h";
  return jwt.sign({ id: userId }, secret, { expiresIn: expiresIn });
}

function verifyAuthToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function decodeAuthToken(token) {
  return jwt.decode(token);
}

module.exports = {
  signAuthToken: signAuthToken,
  verifyAuthToken: verifyAuthToken,
  decodeAuthToken: decodeAuthToken
};
