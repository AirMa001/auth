function sendResponse(res, status, message, data = null) {
  res.json({
    status,
    message,
    data,
  });
}

function success(res, message, data = null, statusCode = 200) {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
}

function error(res, message, data = null, statusCode = 400) {
  return res.status(statusCode).json({
    status: 'error',
    message,
    data,
  });
}

function validationError(res, errors, statusCode = 422) {
  return res.status(statusCode).json({ status: 'fail', errors });
}

module.exports = { sendResponse, success, error, validationError };
