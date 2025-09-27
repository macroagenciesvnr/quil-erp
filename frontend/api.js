// api.js - frontend helper for calling backend APIs

const API_BASE = "https://erp-zut4.onrender.com/api"; 
// 👆 replace with your Render backend URL if different

async function apiRequest(endpoint, method = "GET", body = null, tenantId = "client1") {
  const headers = {
    "Content-Type": "application/json",
    "x-tenant-id": tenantId   // ensures multi-tenant isolation
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Example usage in your UI:
// apiRequest("/items", "GET").then(console.log).catch(console.error);
