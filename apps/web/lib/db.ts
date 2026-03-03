import { createDb, type Database } from "@bookingkit/db";

const globalForDb = globalThis as unknown as { db: Database | undefined };

function getDb(): Database {
  if (!globalForDb.db) {
    globalForDb.db = createDb(process.env.DATABASE_URL!);
  }
  return globalForDb.db;
}

export const db = getDb();
