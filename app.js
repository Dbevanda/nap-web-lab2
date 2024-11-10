const express = require("express");
const bodyParser = require("body-parser");
const sessionConfig = require("./config/session");
const loginLimiter = require("./config/rateLimiter");
const pool = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const indexRoutes = require("./routes/index");

async function initializeDatabase() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      password VARCHAR(50) NOT NULL
    );
  `;

  const insertAdminUsersQuery = `
    INSERT INTO users (username, password)
    VALUES
      ('admin', 'password123'),
      ('ddbbdd', 'password456'),
      ('3admin', '12345678'),
      ('admin_4', 'Password')
      ON CONFLICT DO NOTHING;
  `;

  try {
    await pool.query(createTableQuery);
    await pool.query(insertAdminUsersQuery);
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}

initializeDatabase();

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
