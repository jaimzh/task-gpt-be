import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);
let db;

export async function connectToDB() {
  try {
    await client.connect();
    db = client.db(); // Uses the database specified in the URI
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}

export function getDB() {
  if (!db) throw new Error("DB not connected");
  return db;
}
