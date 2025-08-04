import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, tokens } from "./schema.js";
import pg from "pg";

// Use pg driver.
const { Pool } = pg;

// Instantiate Drizzle client with pg driver and schema.
export const db = drizzle({
    client: new Pool({
      connectionString: process.env.DATABASE_URL,
    }),
    schema: { users, tokens },
  });


