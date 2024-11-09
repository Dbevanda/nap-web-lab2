const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "../config.json");

// Helper functions to load and save configuration
function loadConfig() {
  const data = fs.readFileSync(configPath);
  return JSON.parse(data);
}

function saveConfig(newConfig) {
  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
}

// Render the admin page with the current configuration values
router.get("/", (req, res) => {
  const config = loadConfig();
  res.render("admin", {
    sqlInjectionEnabled: config.sqlInjectionEnabled,
    brokenAuthEnabled: config.brokenAuthEnabled,
  });
});

// Handle the POST request to toggle vulnerabilities
router.post("/toggle-vulnerabilities", (req, res) => {
  const config = loadConfig();
  config.sqlInjectionEnabled = req.body.sqlInjection === "on";
  config.brokenAuthEnabled = req.body.brokenAuth === "on";
  saveConfig(config);
  res.redirect("/");
});

module.exports = router;
