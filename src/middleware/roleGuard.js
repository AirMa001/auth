const ResponseHelper = require("../utils/responseHelper");

module.exports = function roleGuard(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
      return ResponseHelper.error(res, "Insufficient permissions", null, 403);
    }
    next();
  };
};