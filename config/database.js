const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "nap-web-lab2",
  password: "P8m4c7Al51!",
  port: 5432,
});

module.exports = pool;
