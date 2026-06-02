// routes/tasks.js
// REST API for tasks — all DB calls use parameterised queries
// ($1, $2, ...) to prevent SQL injection.

const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

// Helper: map snake_case DB columns → camelCase for the frontend
function formatTask(row) {
  return {
    id:          row.id,
    title:       row.title,
    description: row.description,
    completed:   row.completed,
    priority:    row.priority,
    category:    row.category,
    dueDate:     row.due_date,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

// ─────────────────────────────────────────────────
// GET /api/tasks — list all tasks (with optional filters)
// ─────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { completed, priority, category } = req.query;
    const conditions = [];
    const values = [];

    if (completed !== undefined) {
      values.push(completed === "true");
      conditions.push(`completed = $${values.length}`);
    }
    if (priority) {
      values.push(priority);
      conditions.push(`priority = $${values.length}`);
    }
    if (category) {
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT * FROM tasks ${where} ORDER BY created_at DESC`,
      values
    );

    res.json({ success: true, count: rows.length, data: rows.map(formatTask) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────
// GET /api/tasks/:id — single task
// ─────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM tasks WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Task not found" });
    res.json({ success: true, data: formatTask(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────
// POST /api/tasks — create a task
// ─────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { title, description, priority = "medium", category = "General", dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, priority, category, due_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title.trim(), description || null, priority, category, dueDate || null]
    );

    res.status(201).json({ success: true, data: formatTask(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────
// PUT /api/tasks/:id — update a task
// ─────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const { title, description, completed, priority, category, dueDate } = req.body;

    const { rows } = await pool.query(
      `UPDATE tasks
       SET title=$1, description=$2, completed=$3, priority=$4, category=$5, due_date=$6
       WHERE id=$7
       RETURNING *`,
      [title, description || null, completed, priority, category, dueDate || null, req.params.id]
    );

    if (!rows.length) return res.status(404).json({ success: false, message: "Task not found" });
    res.json({ success: true, data: formatTask(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────
// DELETE /api/tasks/:id — delete a task
// ─────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("DELETE FROM tasks WHERE id=$1 RETURNING id", [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Task not found" });
    res.json({ success: true, message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────
// PATCH /api/tasks/:id/toggle — flip completed flag
// ─────────────────────────────────────────────────
router.patch("/:id/toggle", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE tasks SET completed = NOT completed WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: "Task not found" });
    res.json({ success: true, data: formatTask(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
