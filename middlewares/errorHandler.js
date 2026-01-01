function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Server error';

  res.status(status).json({
    success: false,
    message: message
  });
}

module.exports = errorHandler;
