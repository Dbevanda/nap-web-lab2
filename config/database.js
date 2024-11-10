const { Pool } = require("pg");

const pool = new Pool({
  //Local development
  user: "postgres",
  host: "localhost",
  database: "nap-web-lab2",
  password: "P8m4c7Al51!",
  port: 5432,
});

/*const pool = new Pool({
  connectionString:
    "postgresql://postgre:6WBtuXFdUptQtWLtPL5QoQOrjk3VhLgq@dpg-csnrfs23esus73ehd8g0-a.frankfurt-postgres.render.com/nap_web_lab2_db",
  ssl: {
    rejectUnauthorized: false,
  },
});*/

module.exports = pool;
