// db.js - MongoDB Atlas connector
const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "quilERP";

let client;
let db;

async function connectDB() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);

    // Ensure required collections exist
    const collections = ["items","customers","invoices","purchases","receipts","daybook","meta"];
    const existing = await db.listCollections().toArray();
    const existingNames = existing.map(c => c.name);
    for (const c of collections) {
      if (!existingNames.includes(c)) {
        await db.createCollection(c);
      }
    }
  }
  return db;
}

async function createItem(coll, obj) {
  const database = await connectDB();
  const result = await database.collection(coll).insertOne(obj);
  return { id: result.insertedId, ...obj };
}

async function upsertItem(coll, obj) {
  const database = await connectDB();
  await database.collection(coll).updateOne(
    { _id: new ObjectId(obj.id) },
    { $set: obj },
    { upsert: true }
  );
  return obj;
}

async function readItem(coll, id) {
  const database = await connectDB();
  return database.collection(coll).findOne({ _id: new ObjectId(id) });
}

async function queryItems(coll, filter = {}) {
  const database = await connectDB();
  return database.collection(coll).find(filter).toArray();
}

async function deleteItem(coll, id) {
  const database = await connectDB();
  const result = await database.collection(coll).deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

// Invoice counter
async function incrementInvoice(prefix = "INV-", pad = 6) {
  const database = await connectDB();
  const result = await database.collection("meta").findOneAndUpdate(
    { _id: "invoiceCounter" },
    { $inc: { value: 1 }, $set: { updatedAt: new Date().toISOString() } },
    { upsert: true, returnDocument: "after" }
  );
  const raw = result.value.value;
  let s = raw.toString();
  while (s.length < pad) s = "0" + s;
  return { raw, number: prefix + s };
}

module.exports = {
  createItem,
  upsertItem,
  readItem,
  queryItems,
  deleteItem,
  incrementInvoice
};
