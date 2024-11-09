const session = require("express-session");

module.exports = session({
  secret: "randomly_generated_secret_key",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }, // Set to true if using HTTPS
});
