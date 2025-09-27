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

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Generic CRUD routes generator
function crudRoutes(collection) {
  // List
  app.get(`/api/${collection}`, async (req, res) => {
    try {
      const tenantId = req.headers["x-tenant-id"];
      const items = await queryItems(collection, { tenantId });
      res.json(items);
    } catch (err) {
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
      res.status(500).json({ error: err.message });
    }
  });

  // Create
  app.post(`/api/${collection}`, async (req, res) => {
    try {
      const tenantId = req.headers["x-tenant-id"];
      const obj = { id: uuidv4(), tenantId, ...req.body };
      const created = await createItem(collection, obj);
      res.json(created);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update
  app.put(`/api/${collection}/:id`, async (req, res) => {
    try {
      const tenantId = req.headers["x-tenant-id"];
      const obj = { id: req.params.id, tenantId, ...req.body };
      const updated = await upsertItem(collection, obj);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete
  app.delete(`/api/${collection}/:id`, async (req, res) => {
    try {
      const tenantId = req.headers["x-tenant-id"];
      const ok = await deleteItem(collection, req.params.id, tenantId);
      if (!ok) return res.status(404).send("Not found");
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

// Register collections
["items", "customers", "invoices", "purchases", "receipts", "daybook"].forEach(crudRoutes);

// Invoice counter
app.post("/api/meta/increment-invoice", async (req, res) => {
  try {
    const { prefix = "INV-", pad = 6 } = req.body || {};
    const result = await incrementInvoice(prefix, pad);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Quil ERP backend running on port ${PORT}`));
