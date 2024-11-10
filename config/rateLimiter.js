const rateLimit = require("express-rate-limit");

module.exports = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  message:
    "Too many login attempts from this IP, please try again after 5 minutes",
  skipSuccessfulRequests: true,
});
