import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createMockUser() {
  try {
    const result = await pool.query(`
      INSERT INTO users (id, username, password)
      VALUES ('mock-user-id', 'dev-user', 'mock-password')
      ON CONFLICT (id) DO NOTHING
      RETURNING id, username;
    `);

    if (result.rows.length > 0) {
      console.log('✅ Mock user created:', result.rows[0]);
    } else {
      console.log('✅ Mock user already exists');
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Failed to create mock user:', error);
    process.exit(1);
  }
}

createMockUser();