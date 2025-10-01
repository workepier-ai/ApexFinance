import 'dotenv/config';
import { db } from "../server/db";
import { settings, banks } from "@shared/schema";
import crypto from 'crypto';

/**
 * Migration Script: Base64 → AES-256-CBC Encryption
 *
 * This script converts existing Base64-encoded tokens to proper AES-256 encryption
 * Run once after upgrading encryption methods
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
const ALGORITHM = 'aes-256-cbc';

// Decode Base64 (old format)
function decodeBase64(encoded: string): string {
  return Buffer.from(encoded, 'base64').toString('utf-8');
}

// Encrypt with AES-256 (new format)
function encryptAES256(token: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

// Check if string is Base64 format (no colon separator)
function isBase64Format(str: string): boolean {
  return !str.includes(':');
}

async function migrateEncryption() {
  console.log('🔐 Starting encryption migration: Base64 → AES-256-CBC\n');

  let settingsMigrated = 0;
  let banksMigrated = 0;
  let errors = 0;

  try {
    // Migrate settings.valueEncrypted
    console.log('📋 Migrating settings...');
    const allSettings = await db.select().from(settings);

    for (const setting of allSettings) {
      if (setting.valueEncrypted && isBase64Format(setting.valueEncrypted)) {
        try {
          console.log(`  → Migrating setting: ${setting.key}`);

          // Decode Base64
          const plainToken = decodeBase64(setting.valueEncrypted);

          // Re-encrypt with AES-256
          const encryptedToken = encryptAES256(plainToken);

          // Update database
          const { eq } = await import('drizzle-orm');
          await db
            .update(settings)
            .set({
              valueEncrypted: encryptedToken,
              updatedAt: new Date()
            })
            .where(eq(settings.id, setting.id));

          console.log(`    ✓ Migrated: ${setting.key}`);
          settingsMigrated++;
        } catch (error) {
          console.error(`    ✗ Failed to migrate setting ${setting.key}:`, error);
          errors++;
        }
      } else if (setting.valueEncrypted) {
        console.log(`  ⏭️  Skipping ${setting.key} (already AES-256 format)`);
      }
    }

    // Migrate banks.apiToken
    console.log('\n🏦 Migrating banks...');
    const allBanks = await db.select().from(banks);

    for (const bank of allBanks) {
      if (bank.apiToken && isBase64Format(bank.apiToken)) {
        try {
          console.log(`  → Migrating bank: ${bank.name}`);

          // Decode Base64
          const plainToken = decodeBase64(bank.apiToken);

          // Re-encrypt with AES-256
          const encryptedToken = encryptAES256(plainToken);

          // Update database
          const { eq } = await import('drizzle-orm');
          await db
            .update(banks)
            .set({
              apiToken: encryptedToken,
              updatedAt: new Date()
            })
            .where(eq(banks.id, bank.id));

          console.log(`    ✓ Migrated: ${bank.name}`);
          banksMigrated++;
        } catch (error) {
          console.error(`    ✗ Failed to migrate bank ${bank.name}:`, error);
          errors++;
        }
      } else if (bank.apiToken) {
        console.log(`  ⏭️  Skipping ${bank.name} (already AES-256 format)`);
      }
    }

    // Summary
    console.log('\n✅ Migration Complete!');
    console.log(`   Settings migrated: ${settingsMigrated}`);
    console.log(`   Banks migrated: ${banksMigrated}`);
    console.log(`   Errors: ${errors}`);

    if (errors > 0) {
      console.log('\n⚠️  Some items failed to migrate. Check logs above.');
      process.exit(1);
    }

    console.log('\n🎉 All tokens successfully upgraded to AES-256 encryption!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateEncryption();
