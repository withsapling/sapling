import "dotenv/config";
import { MongoClient, Db } from "mongodb";

let client: MongoClient;
let db: Db;

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DATABASE_NAME = process.env.DATABASE_NAME || "sapling_auth";

export async function connectToMongoDB(): Promise<Db> {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DATABASE_NAME);
    
    // Create indexes for better performance
    await db.collection("users").createIndex({ googleId: 1 }, { unique: true, sparse: true });
    await db.collection("users").createIndex({ githubId: 1 }, { unique: true, sparse: true });
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("tokens").createIndex({ tokenHash: 1 }, { unique: true });
    await db.collection("tokens").createIndex({ userId: 1 });
    await db.collection("tokens").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  }
  
  return db;
}

export async function getDatabase(): Promise<Db> {
  if (!db) {
    return await connectToMongoDB();
  }
  return db;
}


