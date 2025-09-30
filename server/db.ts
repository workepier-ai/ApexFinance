import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// For development without database, use mock object
const createPromiseProxy = (value: any) => {
  const promise = Promise.resolve(value);
  return new Proxy(promise, {
    get(target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return target[prop].bind(target);
      }
      // Return chainable methods
      return () => createPromiseProxy(value);
    }
  });
};

const mockDb = {
  select: () => ({
    from: () => ({
      where: () => createPromiseProxy([]),
      orderBy: () => ({
        limit: () => ({
          offset: () => createPromiseProxy([])
        })
      }),
      limit: () => createPromiseProxy([])
    })
  }),
  insert: () => ({
    values: () => ({
      returning: () => createPromiseProxy([{ id: 'mock-id', createdAt: new Date() }])
    })
  }),
  update: () => ({
    set: () => ({
      where: () => ({
        returning: () => createPromiseProxy([{ id: 'mock-id' }])
      })
    })
  }),
  delete: () => ({
    where: () => createPromiseProxy([])
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
