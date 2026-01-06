function httpError(statusCode, message) {
  let err = new Error(message || "Error");
  err.statusCode = statusCode || 500;
  return err;
}

module.exports = httpError;
