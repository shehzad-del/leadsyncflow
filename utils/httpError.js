function httpError(statusCode, message) {
  let err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

module.exports = httpError;
