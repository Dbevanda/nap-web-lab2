const express = require("express");
const svgCaptcha = require("svg-captcha");
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "../config.json");

function loadConfig() {
  const data = fs.readFileSync(configPath);
  return JSON.parse(data);
}

module.exports = (loginLimiter, pool) => {
  const router = express.Router();

  const MAX_LOGIN_ATTEMPTS = 3;

  // Login page
  router.get("/login", (req, res) => {
    const config = loadConfig();
    const captcha = config.brokenAuthEnabled === false ? "/captcha" : null;
    res.render("login", { message: null, captcha });
  });

  // Generate CAPTCHA
  router.get("/captcha", (req, res) => {
    const captcha = svgCaptcha.create();
    req.session.captcha = captcha.text;
    res.type("svg");
    res.status(200).send(captcha.data);
  });

  // Login functionality
  router.post("/login", loginLimiter, async (req, res) => {
    const { username, password, captcha } = req.body;

    // Load the latest config settings
    const config = loadConfig();
    const brokenAuthEnabled = config.brokenAuthEnabled;

    if (!req.session.loginAttempts) {
      req.session.loginAttempts = 0;
    }

    if (!brokenAuthEnabled) {
      // Only check CAPTCHA if brokenAuthEnabled is false
      if (req.session.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        return res.render("login", {
          message: "Too many failed login attempts. Please try again later.",
          messageType: "error",
          captcha: null,
        });
      }

      if (!captcha || captcha !== req.session.captcha) {
        req.session.loginAttempts++;
        return res.render("login", {
          message: "Incorrect CAPTCHA. Please try again.",
          messageType: "error",
          captcha: "/captcha",
        });
      }
    }

    let query;
    if (config.sqlInjectionEnabled) {
      console.log("Executing vulnerable query");
      query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    } else {
      console.log("Executing parameterized query");
      query = {
        text: "SELECT * FROM users WHERE username = $1 AND password = $2",
        values: [username, password],
      };
    }

    try {
      const result = await pool.query(query);

      if (result.rows.length > 0) {
        req.session.loginAttempts = 0;
        return res.render("login", {
          message: "Login successful!",
          messageType: "success",
          captcha: null,
        });
      } else {
        req.session.loginAttempts++;
        const showCaptcha =
          req.session.loginAttempts >= MAX_LOGIN_ATTEMPTS - 1
            ? "/captcha"
            : null;
        return res.render("login", {
          message: "Invalid login credentials. Please try again.",
          messageType: "error",
          captcha: showCaptcha,
        });
      }
    } catch (err) {
      console.error("Database error:", err);
      res.render("login", {
        message: "An error occurred. Please try again later.",
        messageType: "error",
        captcha: null,
      });
    }
  });

  return router;
};
