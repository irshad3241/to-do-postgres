// src/App.js — Main React component (Tier 1: Presentation Layer)
import React, { useState, useEffect, useCallback } from "react";
import { taskAPI } from "./api";
import "./App.css";

// ─── Sub-components ─────────────────────

function StatusBar({ status }) {
  if (!status) return null;
  return (
    <div className={`status-bar ${status.type}`}>
      {status.type === "error" ? "⚠️" : "✅"} {status.message}
    </div>
  );
}

function TaskForm({ onAdd }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "General",
    dueDate: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      await onAdd(form);
      setForm({ title: "", description: "", priority: "medium", category: "General", dueDate: "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h2 className="form-title">➕ New Task</h2>
      <input
        className="input"
        name="title"
        placeholder="Task title *"
        value={form.title}
        onChange={handleChange}
        required
      />
      <textarea
        className="input textarea"
        name="description"
        placeholder="Description (optional)"
        value={form.description}
        onChange={handleChange}
        rows={2}
      />
      <div className="form-row">
        <select className="input select" name="priority" value={form.priority} onChange={handleChange}>
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🔴 High</option>
        </select>
        <input
          className="input"
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
        />
        <input
          className="input"
          type="date"
          name="dueDate"
          value={form.dueDate}
          onChange={handleChange}
        />
      </div>
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add Task"}
      </button>
    </form>
  );
}

function TaskCard({ task, onToggle, onDelete, onEdit }) {
  const priorityColors = { low: "#22c55e", medium: "#eab308", high: "#ef4444" };
  const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

  return (
    <div className={`task-card ${task.completed ? "completed" : ""}`}
      style={{ borderLeft: `4px solid ${priorityColors[task.priority]}` }}>
      <div className="task-header">
        <label className="checkbox-wrapper">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task.id)}
          />
          <span className="task-title">{task.title}</span>
        </label>
        <div className="task-actions">
          <button className="btn-icon" onClick={() => onEdit(task)} title="Edit">✏️</button>
          <button className="btn-icon danger" onClick={() => onDelete(task.id)} title="Delete">🗑️</button>
        </div>
      </div>
      {task.description && <p className="task-desc">{task.description}</p>}
      <div className="task-meta">
        <span className="tag">{task.category}</span>
        <span className="tag priority-tag" style={{ color: priorityColors[task.priority] }}>
          {task.priority}
        </span>
        {dueDate && (
          <span className={`tag ${isOverdue ? "overdue" : ""}`}>
            📅 {dueDate} {isOverdue ? "— OVERDUE" : ""}
          </span>
        )}
        <span className="tag muted">
          {new Date(task.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

function EditModal({ task, onSave, onClose }) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    category: task.category || "General",
    dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
  });

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>✏️ Edit Task</h2>
        <input className="input" name="title" value={form.title} onChange={handleChange} placeholder="Title" />
        <textarea className="input textarea" name="description" value={form.description}
          onChange={handleChange} placeholder="Description" rows={3} />
        <div className="form-row">
          <select className="input select" name="priority" value={form.priority} onChange={handleChange}>
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High</option>
          </select>
          <input className="input" name="category" value={form.category} onChange={handleChange} placeholder="Category" />
          <input className="input" type="date" name="dueDate" value={form.dueDate} onChange={handleChange} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(task.id, form)}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const showStatus = (message, type = "success") => {
    setStatus({ message, type });
    setTimeout(() => setStatus(null), 3000);
  };

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await taskAPI.getAll();
      setTasks(res.data);
    } catch (err) {
      showStatus(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAdd = async (formData) => {
    try {
      const res = await taskAPI.create(formData);
      setTasks((prev) => [res.data, ...prev]);
      showStatus("Task created!");
    } catch (err) {
      showStatus(err.message, "error");
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await taskAPI.toggle(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? res.data : t)));
    } catch (err) {
      showStatus(err.message, "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await taskAPI.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      showStatus("Task deleted.");
    } catch (err) {
      showStatus(err.message, "error");
    }
  };

  const handleEdit = async (id, data) => {
    try {
      const res = await taskAPI.update(id, data);
      setTasks((prev) => prev.map((t) => (t.id === id ? res.data : t)));
      setEditingTask(null);
      showStatus("Task updated!");
    } catch (err) {
      showStatus(err.message, "error");
    }
  };

  // Client-side filtering
  const filtered = tasks.filter((t) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && !t.completed) ||
      (filter === "done" && t.completed) ||
      (filter === "high" && t.priority === "high");
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.completed).length,
    high: tasks.filter((t) => t.priority === "high" && !t.completed).length,
  };

  return (
    <div className="app">
      <StatusBar status={status} />

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">⬡</span>
            <div>
              <h1>TaskVault</h1>
              <p className="subtitle">Three-Tier App · React + Node + PostgreSQL</p>
            </div>
          </div>
          <div className="stats">
            <div className="stat"><span className="stat-num">{stats.total}</span><span>Total</span></div>
            <div className="stat"><span className="stat-num">{stats.done}</span><span>Done</span></div>
            <div className="stat urgent"><span className="stat-num">{stats.high}</span><span>Urgent</span></div>
          </div>
        </div>
      </header>

      <main className="main">
        {/* Architecture Note */}
        <div className="arch-banner">
          <span className="arch-tier tier1">🖥️ React (Port 3000)</span>
          <span className="arch-arrow">→ HTTP/JSON →</span>
          <span className="arch-tier tier2">⚙️ Express (Port 5000)</span>
          <span className="arch-arrow">→ Mongoose →</span>
          <span className="arch-tier tier3">🗄️ MongoDB (Port 27017)</span>
        </div>

        <TaskForm onAdd={handleAdd} />

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-tabs">
            {["all", "active", "done", "high"].map((f) => (
              <button key={f} className={`tab ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <input
            className="input search"
            placeholder="🔍 Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Task List */}
        <div className="task-list">
          {loading ? (
            <div className="empty-state">
              <div className="spinner" />
              <p>Connecting to MongoDB...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon">📭</p>
              <p>{tasks.length === 0 ? "No tasks yet. Add one above!" : "No matching tasks."}</p>
            </div>
          ) : (
            filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={setEditingTask}
              />
            ))
          )}
        </div>
      </main>

      {editingTask && (
        <EditModal
          task={editingTask}
          onSave={handleEdit}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}
