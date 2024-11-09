const express = require("express");
const bodyParser = require("body-parser");
const sessionConfig = require("./config/session");
const loginLimiter = require("./config/rateLimiter");
const pool = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const indexRoutes = require("./routes/index");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Configure session
app.use(sessionConfig);

// Route handlers
app.use("/", indexRoutes);
app.use("/", authRoutes(loginLimiter, pool));
app.use("/admin", adminRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
