const mongoose = require("mongoose");

function getUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Please define MONGODB_URI in the environment.");
  }
  return uri;
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
