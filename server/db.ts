import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// For development without database, use mock object
const mockDb = {
  select: () => ({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve([]),
        orderBy: () => ({
          limit: () => ({
            offset: () => Promise.resolve([])
          })
        })
      }),
      orderBy: () => ({
        limit: () => ({
          offset: () => Promise.resolve([])
        })
      })
    })
  }),
  insert: () => ({
    values: () => ({
      returning: () => Promise.resolve([{ id: 'mock-id', createdAt: new Date() }])
    })
  }),
  update: () => ({
    set: () => ({
      where: () => Promise.resolve({ id: 'mock-id' })
    })
  })
};

// Use DATABASE_URL if available, otherwise use mock
let pool: Pool | null = null;
let db: any;

if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else {
  console.warn('DATABASE_URL not set, using mock database for development');
  pool = null;
  db = mockDb as any;
}

export { pool, db };
