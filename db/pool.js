const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost", 
  user: "zaley",
  database: "membership",
  password: "linux",
  port: 5432 
});

module.exports = pool