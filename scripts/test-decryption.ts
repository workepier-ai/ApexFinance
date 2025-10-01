import 'dotenv/config';
import { db } from "../server/db";
import { settings } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
const ALGORITHM = 'aes-256-cbc';

function decryptToken(encryptedToken: string): string {
  try {
    const parts = encryptedToken.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt token');
  }
}

async function testDecryption() {
  console.log('🔐 Testing AES-256 decryption...\n');

  try {
    const userId = 'mock-user-id';
    const userSettings = await db.select()
      .from(settings)
      .where(eq(settings.userId, userId));

    let upBankToken = '';
    for (const setting of userSettings) {
      if (setting.key === 'up_bank_token' && setting.valueEncrypted) {
        console.log(`📋 Found setting: ${setting.key}`);
        console.log(`📦 Encrypted value (first 50 chars): ${setting.valueEncrypted.substring(0, 50)}...`);
        console.log(`🔍 Format check: ${setting.valueEncrypted.includes(':') ? '✓ AES-256 format (has :)' : '✗ Base64 format (no :)'}`);

        console.log('\n🔓 Attempting decryption...');
        upBankToken = decryptToken(setting.valueEncrypted);
        console.log(`✅ Decryption successful!`);
        console.log(`🔑 Decrypted token (first 20 chars): ${upBankToken.substring(0, 20)}...`);
        console.log(`📏 Token length: ${upBankToken.length} characters`);
        break;
      }
    }

    if (!upBankToken) {
      console.log('❌ No UP Bank token found in settings');
      process.exit(1);
    }

    console.log('\n✅ Decryption test passed! Token can be decrypted successfully.');
    console.log('🎉 Background jobs will be able to read the encrypted token.');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Decryption test failed:', error);
    process.exit(1);
  }
}

testDecryption();
