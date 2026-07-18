const path = require("path");
const projectRoot = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(projectRoot, ".env") });

const mongoose = require("mongoose");

async function check() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI in .env");
    process.exit(1);
  }

  // Database name is the path in the URI: mongodb://host:27017/DB_NAME
  const dbName = uri.split("/").pop().split("?")[0] || "test";
  console.log("Connection string (hidden):", uri.replace(/:[^:@]+@/, ":***@").replace(/\/[^/?]+/, "/" + dbName));
  console.log("Database name from URI:", dbName || "(default: test)");
  console.log("");

  try {
    await mongoose.connect(uri);
    const conn = mongoose.connection;
    const db = conn.db;
    const names = await db.listCollections().toArray();

    if (names.length === 0) {
      console.log("No collections in this database yet. Run: npm run seed");
    } else {
      console.log("Collections:");
      for (const { name } of names) {
        const count = await db.collection(name).countDocuments();
        console.log("  -", name, ":", count, "documents");
      }
    }
  } catch (err) {
    console.error("Connection failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

check();
