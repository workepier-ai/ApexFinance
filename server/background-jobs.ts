import { db } from "./db";
import {
  syncQueue,
  transactions,
  settings,
  deepSyncProgress,
  apiUsageTracker
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { UpBankApiClient } from "./UpBankApiClient";
import {
  trackApiCall,
  canMakeCall,
  checkCapacity,
  cleanupOldUsage,
  getUsageStats
} from "./api-rate-limiter";

// Crypto for token decryption
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

/**
 * Background Job 1: Queue Processor
 * Runs every 3 minutes to batch sync tag/category updates to UP Bank
 */
export async function processTagUpdateQueue(): Promise<void> {
  try {
    console.log('\n🔄 [Queue Processor] Starting...');

    // Check API capacity
    const hasCapacity = await checkCapacity(10); // Need at least 10 calls
    if (!hasCapacity) {
      console.log('⏸️  [Queue Processor] Insufficient API capacity, deferring');
      return;
    }

    // Get pending items from queue (limit to 50 per run)
    const pendingItems = await db
      .select()
      .from(syncQueue)
      .where(eq(syncQueue.status, 'pending'))
      .limit(50);

    if (pendingItems.length === 0) {
      console.log('✅ [Queue Processor] Queue is empty');
      return;
    }

    console.log(`📋 [Queue Processor] Found ${pendingItems.length} pending items`);

    // Get UP Bank token
    const userId = 'mock-user-id';
    const userSettings = await db.select()
      .from(settings)
      .where(eq(settings.userId, userId));

    let upBankToken = '';
    for (const setting of userSettings) {
      if (setting.key === 'up_bank_token' && setting.valueEncrypted) {
        upBankToken = decryptToken(setting.valueEncrypted);
        break;
      }
    }

    if (!upBankToken) {
      console.error('❌ [Queue Processor] No UP Bank token found');
      return;
    }

    const upBankClient = new UpBankApiClient(upBankToken);
    let processed = 0;
    let conflicts = 0;
    let errors = 0;

    // Process each item
    for (const item of pendingItems) {
      try {
        // Check if we still have capacity
        if (!(await canMakeCall(2))) { // Need 2 calls: fetch + update
          console.log('⏸️  [Queue Processor] API limit reached, stopping');
          break;
        }

        // Mark as processing
        await db
          .update(syncQueue)
          .set({ status: 'processing', updatedAt: new Date() })
          .where(eq(syncQueue.id, item.id));

        // CONFLICT DETECTION: Fetch fresh transaction from UP Bank
        console.log(`🔍 Checking ${item.upTransactionId} for conflicts...`);
        const freshTxn = await upBankClient.getTransaction(item.upTransactionId!);
        await trackApiCall();

        // Get fresh values from UP Bank
        const upBankCategory = freshTxn.data.relationships?.category?.data?.id || null;
        const upBankTags = freshTxn.data.relationships?.tags?.data?.map((t: any) => t.id).join(',') || '';
        const upBankUpdatedAt = new Date(freshTxn.data.attributes.updatedAt || freshTxn.data.attributes.createdAt);
        const queuedAt = new Date(item.createdAt);

        let hasConflict = false;

        // Check for conflict based on field
        if (item.field === 'category') {
          // If UP Bank category changed since we queued this update, it's a conflict
          if (upBankCategory !== item.oldValue && upBankUpdatedAt > queuedAt) {
            console.log(`⚠️  Category conflict: UP Bank has "${upBankCategory}", queue wants "${item.newValue}"`);
            hasConflict = true;
          }
        } else if (item.field === 'tags') {
          // If UP Bank tags changed since we queued this update, it's a conflict
          if (upBankTags !== item.oldValue && upBankUpdatedAt > queuedAt) {
            console.log(`⚠️  Tags conflict: UP Bank has "${upBankTags}", queue wants "${item.newValue}"`);
            hasConflict = true;
          }
        }

        if (hasConflict) {
          // Mark as conflict and skip
          await db
            .update(syncQueue)
            .set({
              status: 'conflict',
              error: 'UP Bank value changed since queued',
              updatedAt: new Date()
            })
            .where(eq(syncQueue.id, item.id));

          conflicts++;
          console.log(`⏭️  Skipped due to conflict`);
          continue;
        }

        // No conflict - safe to update UP Bank
        if (item.field === 'category') {
          if (item.newValue && item.newValue !== 'uncategorized') {
            await upBankClient.updateTransactionCategory(item.upTransactionId!, item.newValue);
            await trackApiCall();
            console.log(`✅ Updated category: ${item.upTransactionId} → ${item.newValue}`);
          }
        } else if (item.field === 'tags') {
          const newTags = item.newValue ? item.newValue.split(',').filter(Boolean) : [];
          const oldTags = item.oldValue ? item.oldValue.split(',').filter(Boolean) : [];
          await upBankClient.updateTransactionTags(item.upTransactionId!, newTags, oldTags);
          await trackApiCall();
          console.log(`✅ Updated tags: ${item.upTransactionId} → ${item.newValue}`);
        }

        // Mark as completed
        await db
          .update(syncQueue)
          .set({
            status: 'completed',
            updatedAt: new Date()
          })
          .where(eq(syncQueue.id, item.id));

        processed++;

      } catch (error) {
        console.error(`❌ Failed to process queue item ${item.id}:`, error);
        errors++;

        // Update error count
        await db
          .update(syncQueue)
          .set({
            status: 'failed',
            attempts: item.attempts + 1,
            lastAttempt: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error',
            scheduledFor: new Date(Date.now() + 15 * 60 * 1000), // Retry in 15 min
            updatedAt: new Date()
          })
          .where(eq(syncQueue.id, item.id));
      }
    }

    const stats = await getUsageStats();
    console.log(`✅ [Queue Processor] Complete: ${processed} processed, ${conflicts} conflicts, ${errors} errors`);
    console.log(`📊 API Usage: ${stats.callsUsed}/${stats.callsLimit} (${stats.percentUsed}%)`);

  } catch (error) {
    console.error('❌ [Queue Processor] Fatal error:', error);
  }
}

/**
 * Background Job 2: Hourly Transaction Checker
 * Runs every hour to check ALL transactions for updates from UP Bank
 */
export async function hourlyTransactionChecker(): Promise<void> {
  try {
    console.log('\n🕐 [Hourly Checker] Starting...');

    const userId = 'mock-user-id';

    // Get progress state
    let progress = await db
      .select()
      .from(deepSyncProgress)
      .where(eq(deepSyncProgress.userId, userId))
      .limit(1);

    // Create progress record if doesn't exist
    if (progress.length === 0) {
      await db.insert(deepSyncProgress).values({
        userId,
        status: 'idle',
        totalSynced: 0,
        currentBatch: 0
      });
      progress = await db
        .select()
        .from(deepSyncProgress)
        .where(eq(deepSyncProgress.userId, userId))
        .limit(1);
    }

    const currentProgress = progress[0];

    // Calculate available budget (max 500 calls/hour for this job)
    const stats = await getUsageStats();
    const maxBudget = 500;
    const available = Math.min(maxBudget, stats.remaining - 100); // Keep 100 buffer

    if (available < 10) {
      console.log(`⏸️  [Hourly Checker] Insufficient capacity: ${stats.remaining} calls remaining`);

      // Update status to paused
      await db
        .update(deepSyncProgress)
        .set({ status: 'paused', updatedAt: new Date() })
        .where(eq(deepSyncProgress.userId, userId));

      return;
    }

    console.log(`💰 [Hourly Checker] Budget: ${available} API calls available`);

    // Get UP Bank token
    const userSettings = await db.select()
      .from(settings)
      .where(eq(settings.userId, userId));

    let upBankToken = '';
    for (const setting of userSettings) {
      if (setting.key === 'up_bank_token' && setting.valueEncrypted) {
        upBankToken = decryptToken(setting.valueEncrypted);
        break;
      }
    }

    if (!upBankToken) {
      console.error('❌ [Hourly Checker] No UP Bank token found');
      return;
    }

    // Update status to running
    await db
      .update(deepSyncProgress)
      .set({
        status: 'running',
        startedAt: currentProgress.startedAt || new Date(),
        updatedAt: new Date()
      })
      .where(eq(deepSyncProgress.userId, userId));

    const upBankClient = new UpBankApiClient(upBankToken);
    let cursor = currentProgress.lastSyncedCursor;
    let batchesFetched = 0;
    let totalTransactions = 0;

    // Fetch in batches of 100
    while (batchesFetched < available && await canMakeCall()) {
      try {
        console.log(`📥 Fetching batch ${batchesFetched + 1}...`);

        const response = await upBankClient.getTransactions({
          pageSize: 100,
          pageAfter: cursor || undefined
        });
        await trackApiCall();

        const txns = response.data;
        console.log(`  → Got ${txns.length} transactions`);

        // Update or insert transactions
        for (const txn of txns) {
          const txnData = {
            upTransactionId: txn.id,
            accountId: txn.relationships?.account?.data?.id || null,
            amount: txn.attributes.amount.value,
            date: new Date(txn.attributes.createdAt),
            description: txn.attributes.description,
            category: txn.relationships?.category?.data?.id || null,
            tags: txn.relationships?.tags?.data?.map((t: any) => t.id).join(',') || '',
            type: txn.attributes.description.includes('Transfer') ? 'Transfer' : 'Purchase',
            status: txn.attributes.status as 'HELD' | 'SETTLED',
            rawData: txn,
            syncStatus: 'synced' as const,
            source: 'up_bank' as const,
            account: 'UP Bank',
            updatedAt: new Date()
          };

          // Check if exists
          const existing = await db
            .select()
            .from(transactions)
            .where(eq(transactions.upTransactionId, txn.id))
            .limit(1);

          if (existing.length > 0) {
            // Update existing
            await db
              .update(transactions)
              .set(txnData)
              .where(eq(transactions.upTransactionId, txn.id));
          } else {
            // Insert new
            await db.insert(transactions).values({
              ...txnData,
              userId: userId,
              createdAt: new Date()
            });
          }
        }

        totalTransactions += txns.length;
        batchesFetched++;

        // Save progress
        cursor = response.links?.next?.split('page[after]=')[1]?.split('&')[0] || null;
        const oldestDate = txns.length > 0 ? new Date(txns[txns.length - 1].attributes.createdAt) : null;

        await db
          .update(deepSyncProgress)
          .set({
            lastSyncedCursor: cursor,
            lastSyncedDate: oldestDate,
            currentBatch: batchesFetched,
            totalSynced: currentProgress.totalSynced + totalTransactions,
            updatedAt: new Date()
          })
          .where(eq(deepSyncProgress.userId, userId));

        // No more pages
        if (!cursor || txns.length < 100) {
          console.log('✅ [Hourly Checker] Reached end of transactions');

          await db
            .update(deepSyncProgress)
            .set({
              status: 'completed',
              completedAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(deepSyncProgress.userId, userId));

          break;
        }

      } catch (error) {
        console.error(`❌ Error fetching batch:`, error);

        await db
          .update(deepSyncProgress)
          .set({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            updatedAt: new Date()
          })
          .where(eq(deepSyncProgress.userId, userId));

        break;
      }
    }

    const finalStats = await getUsageStats();
    console.log(`✅ [Hourly Checker] Complete: ${totalTransactions} transactions in ${batchesFetched} batches`);
    console.log(`📊 API Usage: ${finalStats.callsUsed}/${finalStats.callsLimit} (${finalStats.percentUsed}%)`);

  } catch (error) {
    console.error('❌ [Hourly Checker] Fatal error:', error);
  }
}

/**
 * Background Job 3: Cleanup old records
 * Runs daily to clean up old API usage records
 */
export async function dailyCleanup(): Promise<void> {
  try {
    console.log('\n🧹 [Daily Cleanup] Starting...');
    await cleanupOldUsage();
    console.log('✅ [Daily Cleanup] Complete');
  } catch (error) {
    console.error('❌ [Daily Cleanup] Error:', error);
  }
}

/**
 * Manually trigger deep sync for historical data
 * @param timeRange - '3-months', '1-year', or 'all-time'
 */
export async function triggerDeepSync(timeRange: string): Promise<void> {
  try {
    console.log(`\n🚀 [Deep Sync] Manual trigger: ${timeRange}`);

    const userId = 'mock-user-id';

    // Calculate date range for filtering
    const now = new Date();
    let untilDate: Date | null = null;

    if (timeRange === '3-months') {
      untilDate = new Date(now);
      untilDate.setMonth(untilDate.getMonth() - 3);
      console.log(`📅 Syncing last 3 months (since ${untilDate.toISOString()})`);
    } else if (timeRange === '1-year') {
      untilDate = new Date(now);
      untilDate.setFullYear(untilDate.getFullYear() - 1);
      console.log(`📅 Syncing last year (since ${untilDate.toISOString()})`);
    } else {
      console.log(`📅 Syncing all time`);
    }

    // Check if deep sync already running
    const existing = await db
      .select()
      .from(deepSyncProgress)
      .where(eq(deepSyncProgress.userId, userId))
      .limit(1);

    if (existing.length > 0 && existing[0].status === 'running') {
      // Check if sync is stale (running for >10 minutes with no progress)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const isStale = existing[0].startedAt &&
                      existing[0].startedAt < tenMinutesAgo &&
                      existing[0].totalSynced === 0;

      if (isStale) {
        console.log('🔄 Detected stale deep sync (started >10min ago, no progress). Auto-resetting...');
        await db
          .update(deepSyncProgress)
          .set({
            status: 'idle',
            error: 'Auto-reset: stale sync detected',
            updatedAt: new Date()
          })
          .where(eq(deepSyncProgress.userId, userId));
      } else {
        console.log('⚠️ Deep sync already running, ignoring trigger');
        return;
      }
    }

    // Reset progress to start fresh
    if (existing.length > 0) {
      await db
        .update(deepSyncProgress)
        .set({
          status: 'running',
          lastSyncedCursor: null,
          lastSyncedDate: null,
          totalSynced: 0,
          currentBatch: 0,
          startedAt: new Date(),
          completedAt: null,
          error: null,
          updatedAt: new Date()
        })
        .where(eq(deepSyncProgress.userId, userId));
    } else {
      await db.insert(deepSyncProgress).values({
        userId,
        status: 'running',
        totalSynced: 0,
        currentBatch: 0,
        startedAt: new Date()
      });
    }

    console.log('✅ Deep sync initialized, hourly checker will process');

    // Trigger immediate hourly checker run
    setTimeout(() => {
      hourlyTransactionChecker();
    }, 1000);

  } catch (error) {
    console.error('❌ [Deep Sync] Trigger error:', error);
    throw error;
  }
}

/**
 * Start all background jobs
 */
export function startBackgroundJobs(): void {
  console.log('🚀 Starting background jobs...');

  // Job 1: Queue Processor - every 3 minutes
  setInterval(processTagUpdateQueue, 3 * 60 * 1000);
  console.log('  ✓ Queue Processor: every 3 minutes');

  // Job 2: Hourly Checker - every hour
  setInterval(hourlyTransactionChecker, 60 * 60 * 1000);
  console.log('  ✓ Hourly Transaction Checker: every hour');

  // Job 3: Daily Cleanup - every 24 hours
  setInterval(dailyCleanup, 24 * 60 * 60 * 1000);
  console.log('  ✓ Daily Cleanup: every 24 hours');

  // Run initial queue processor after 30 seconds
  setTimeout(processTagUpdateQueue, 30 * 1000);
  console.log('  ✓ Initial queue processor: in 30 seconds');

  console.log('✅ All background jobs started');
}
