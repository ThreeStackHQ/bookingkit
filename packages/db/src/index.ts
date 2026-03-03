import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export * from './schema';

function createDb(url: string) {
  const client = postgres(url, { max: 1 });
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;

const globalForDb = globalThis as unknown as { _db: Database | undefined };
export const db = globalForDb._db ?? createDb(process.env.DATABASE_URL!);
if (process.env.NODE_ENV !== 'production') globalForDb._db = db;
