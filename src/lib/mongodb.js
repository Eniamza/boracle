import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

const { MONGODB_URI, MONGODB_DB } = process.env;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

if (!MONGODB_DB) {
  throw new Error('Please define the MONGODB_DB environment variable');
}

// MongoDB native client for Auth.js adapter
let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the value
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
}

// Export a function that returns an already-connected client
export async function getMongoClient() {
  return clientPromise;
}

// Mongoose connection
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Connect to MongoDB with Mongoose
export async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      dbName: MONGODB_DB,
      // Allow commands to be queued before connection is established
      bufferCommands: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('Connected to MongoDB with Mongoose');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Handle graceful shutdown
if (process.env.NODE_ENV !== 'development') {
  process.on('SIGINT', async () => {
    if (cached.conn) {
      await mongoose.disconnect();
      console.log('Mongoose disconnected on app termination');
    }
    if (client) {
      await client.close();
      console.log('MongoDB client closed on app termination');
    }
    process.exit(0);
  });
}