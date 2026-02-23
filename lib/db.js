const mongoose = require("mongoose");
const { validateEnv } = require("./env");

function getUri() {
  validateEnv();
  return process.env.MONGODB_URI;
}

/**
 * Cached connection for serverless/dev (reuse in dev; connect once).
 * @see https://github.com/vercel/next.js/blob/canary/examples/with-mongodb-mongoose/lib/mongodb.js
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = { bufferCommands: false };
    cached.promise = mongoose.connect(getUri(), opts).then((mongoose) => mongoose);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

module.exports = { connectDB };
