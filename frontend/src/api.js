// src/api.js — service layer (unchanged interface, backend now uses PostgreSQL)
import axios from "axios";

// In dev: package.json "proxy" forwards /api → http://localhost:5000
// In prod: set REACT_APP_API_URL to your EC2 public URL or ALB DNS
const BASE_URL = process.env.REACT_APP_API_URL || "/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.message || err.message || "Something went wrong";
    return Promise.reject(new Error(msg));
  }
);

export const taskAPI = {
  getAll:  (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/tasks${params ? `?${params}` : ""}`);
  },
  getById: (id)           => api.get(`/tasks/${id}`),
  create:  (data)         => api.post("/tasks", data),
  update:  (id, data)     => api.put(`/tasks/${id}`, data),
  delete:  (id)           => api.delete(`/tasks/${id}`),
  toggle:  (id)           => api.patch(`/tasks/${id}/toggle`),
};
