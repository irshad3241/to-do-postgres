// db/pool.js
// Creates a single shared PostgreSQL connection pool for the whole app.
// Using a pool (not a single client) is critical in production —
// it lets multiple requests use DB connections concurrently without
// opening a new TCP connection for every query.

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Pool settings (tune for your EC2 size)
  max: 10,                // max simultaneous connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,

  // For RDS in production, enable SSL:
  // ssl: { rejectUnauthorized: false }
  // (RDS uses a self-signed cert by default; set rejectUnauthorized: true
  //  and provide the RDS CA bundle for stricter security)
});

// Log when the pool successfully connects
pool.on("connect", () => {
  console.log("🔗 New PostgreSQL client connected");
});

pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err.message);
});

module.exports = pool;
