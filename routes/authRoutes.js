const express = require("express");
const svgCaptcha = require("svg-captcha");
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "../config.json");

function loadConfig() {
  const data = fs.readFileSync(configPath);
  return JSON.parse(data);
}

function generateQuery(config, username, password) {
  if (config.sqlInjectionEnabled) {
    return `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  }
  return {
    text: "SELECT * FROM users WHERE username = $1 AND password = $2",
    values: [username, password],
  };
}

function renderResponse(res, message, type = "error", captcha = null) {
  res.render("login", { message, messageType: type, captcha });
}

function validateCaptcha(req, captchaInput) {
  return captchaInput && captchaInput === req.session.captcha;
}

module.exports = (loginLimiter, pool) => {
  const router = express.Router();
  const MAX_LOGIN_ATTEMPTS = 3;

  router.get("/login", (req, res) => {
    const config = loadConfig();
    const captcha = config.brokenAuthEnabled === false ? "/captcha" : null;
    renderResponse(res, null, "info", captcha);
  });

  router.get("/captcha", (req, res) => {
    const captcha = svgCaptcha.create();
    req.session.captcha = captcha.text;
    res.type("svg").status(200).send(captcha.data);
  });

  router.post("/login", loginLimiter, async (req, res) => {
    const { username, password, captcha } = req.body;
    const config = loadConfig();
    req.session.loginAttempts = req.session.loginAttempts || 0;

    if (config.brokenAuthEnabled) {
      try {
        const usernameQuery = `SELECT * FROM users WHERE username = '${username}'`;
        const usernameResult = await pool.query(usernameQuery);

        if (usernameResult.rows.length === 0) {
          return renderResponse(res, "Username not found. Please try again.");
        }

        const query = generateQuery(config, username, password);
        const result = await pool.query(query);

        if (result.rows.length > 0) {
          req.session.loginAttempts = 0;
          req.session.captcha = null;
          return renderResponse(res, "Login successful!", "success");
        }

        // Incorrect password for the valid username
        renderResponse(res, "Incorrect password. Please try again.");
      } catch (err) {
        console.error("Database error:", err);
        renderResponse(res, "An error occurred. Please try again later.");
      }
    } else {
      // CAPTCHA and login attempts enforcement
      if (req.session.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        return renderResponse(
          res,
          "Too many failed login attempts. Please try again later."
        );
      }

      if (!validateCaptcha(req, captcha)) {
        req.session.loginAttempts++;
        return renderResponse(
          res,
          "Incorrect CAPTCHA. Please try again.",
          "error",
          "/captcha"
        );
      }

      const query = generateQuery(config, username, password);

      try {
        const result = await pool.query(query);
        if (result.rows.length > 0) {
          req.session.loginAttempts = 0;
          req.session.captcha = null;
          return renderResponse(
            res,
            "Login successful!",
            "success",
            "/captcha"
          );
        }
        req.session.loginAttempts++;
        renderResponse(
          res,
          "Invalid login credentials. Please try again.",
          "error",
          "/captcha"
        );
      } catch (err) {
        console.error("Database error:", err);
        renderResponse(res, "An error occurred. Please try again later.");
      }
    }
  });

  return router;
};
