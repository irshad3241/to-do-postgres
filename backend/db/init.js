// db/init.js
// Run this ONCE to create the tasks table in PostgreSQL.
// Command: node db/init.js
//
// In production (RDS), you'd typically use a migration tool like
// Flyway or node-pg-migrate for schema versioning — but this
// simple script is perfect for learning.

require("dotenv").config();
const pool = require("./pool");

const createTable = `
  CREATE TABLE IF NOT EXISTS tasks (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(200)  NOT NULL,
    description TEXT,
    completed   BOOLEAN       NOT NULL DEFAULT false,
    priority    VARCHAR(10)   NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low', 'medium', 'high')),
    category    VARCHAR(100)  NOT NULL DEFAULT 'General',
    due_date    DATE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
  );

  -- Auto-update updated_at on every row change
  CREATE OR REPLACE FUNCTION update_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS set_updated_at ON tasks;
  CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`;

async function init() {
  const client = await pool.connect();
  try {
    console.log("🔧 Running database initialization...");
    await client.query(createTable);
    console.log("✅ Table 'tasks' is ready");

    // Seed a sample task so the UI isn't empty on first load
    await client.query(`
      INSERT INTO tasks (title, description, priority, category)
      VALUES ('Deploy this app to AWS!', 'Follow the README step by step', 'high', 'Learning')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log("🌱 Seeded sample task");
  } catch (err) {
    console.error("❌ Init failed:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

init();
