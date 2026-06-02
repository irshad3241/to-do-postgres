// server.js — Express entry point (Tier 2: Application Layer)
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db/pool");
const taskRoutes = require("./routes/tasks");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
}));
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ───────────────────────────────────────────
app.get("/health", async (req, res) => {
  let dbStatus = "disconnected";
  try {
    await pool.query("SELECT 1");
    dbStatus = "connected";
  } catch (_) {}
  res.json({ status: "ok", db: dbStatus, uptime: process.uptime() });
});

app.use("/api/tasks", taskRoutes);
app.use((req, res) => res.status(404).json({ success: false, message: "Not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ── Start ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 Endpoints: GET|POST /api/tasks  PUT|DELETE|PATCH /api/tasks/:id`);
  console.log(`   DB host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
});
