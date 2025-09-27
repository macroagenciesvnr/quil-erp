// server.js - Quil ERP Backend (MongoDB + Express)
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const { v4: uuidv4 } = require("uuid");

const {
  createItem,
  upsertItem,
  readItem,
  queryItems,
  deleteItem,
  incrementInvoice
} = require("./db");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());

// Health check (simple, doesn’t touch DB)
app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Generate CRUD routes
function crudRoutes(collection) {
  // List
  app.get(`/api/${collection}`, async (req, res) => {
    try {
      const tenantId = req.headers["x-tenant-id"];
      const items = await queryItems(collection, { tenantId });
      res.json(items);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Read one
  app.get(`/api/${collection}/:id`, async (req, res) => {
    try {
      const tenantId = req.headers["x-tenant-id"];
      const item = await readItem(collection, req.params.id);
      if (!item || item.tenantId !== tenantId) return res.status(404).send("Not found");
      res.json(item);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Create
  app.post(`/api/${collection}`, async (req, res) => {
    try {
      const tenantId = req.headers
