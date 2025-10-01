import { db } from "./db";
import { apiUsageTracker } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * API Rate Limiter for UP Bank API
 * Tracks API calls per hour and enforces limits
 * UP Bank limit: 1000 calls/hour
 */

const API_LIMIT = 1000;
const SAFETY_MARGIN = 50; // Reserve 50 calls for critical operations

/**
 * Get the current hour window timestamp (rounded to hour)
 * Example: 2025-10-02T03:45:00Z → 2025-10-02T03:00:00Z
 */
function getCurrentHourWindow(): Date {
  const now = new Date();
  now.setMinutes(0, 0, 0); // Round to hour
  return now;
}

/**
 * Track an API call (increment counter)
 * @param count Number of API calls to track (default: 1)
 */
export async function trackApiCall(count: number = 1): Promise<void> {
  const hourWindow = getCurrentHourWindow();

  try {
    // Get current usage for this hour
    const existing = await db
      .select()
      .from(apiUsageTracker)
      .where(eq(apiUsageTracker.hourWindow, hourWindow))
      .limit(1);

    if (existing.length > 0) {
      // Update existing record
      await db
        .update(apiUsageTracker)
        .set({
          callsUsed: existing[0].callsUsed + count,
          updatedAt: new Date()
        })
        .where(eq(apiUsageTracker.hourWindow, hourWindow));
    } else {
      // Create new record for this hour
      await db.insert(apiUsageTracker).values({
        hourWindow,
        callsUsed: count,
        callsLimit: API_LIMIT,
        lastReset: new Date()
      });
    }

    console.log(`📊 API Calls: ${existing.length > 0 ? existing[0].callsUsed + count : count}/${API_LIMIT} this hour`);
  } catch (error) {
    console.error('❌ Failed to track API call:', error);
    // Don't throw - tracking failures shouldn't break the app
  }
}

/**
 * Get remaining API calls for current hour
 * @returns Number of calls remaining
 */
export async function getRemainingCalls(): Promise<number> {
  const hourWindow = getCurrentHourWindow();

  try {
    const usage = await db
      .select()
      .from(apiUsageTracker)
      .where(eq(apiUsageTracker.hourWindow, hourWindow))
      .limit(1);

    if (usage.length === 0) {
      return API_LIMIT; // No usage yet this hour
    }

    return Math.max(0, API_LIMIT - usage[0].callsUsed);
  } catch (error) {
    console.error('❌ Failed to get remaining calls:', error);
    return 0; // Assume limit reached on error
  }
}

/**
 * Get current API usage stats
 * @returns Usage stats for current hour
 */
export async function getUsageStats(): Promise<{
  callsUsed: number;
  callsLimit: number;
  remaining: number;
  percentUsed: number;
}> {
  const hourWindow = getCurrentHourWindow();

  try {
    const usage = await db
      .select()
      .from(apiUsageTracker)
      .where(eq(apiUsageTracker.hourWindow, hourWindow))
      .limit(1);

    const callsUsed = usage.length > 0 ? usage[0].callsUsed : 0;
    const remaining = Math.max(0, API_LIMIT - callsUsed);
    const percentUsed = Math.round((callsUsed / API_LIMIT) * 100);

    return {
      callsUsed,
      callsLimit: API_LIMIT,
      remaining,
      percentUsed
    };
  } catch (error) {
    console.error('❌ Failed to get usage stats:', error);
    return {
      callsUsed: API_LIMIT,
      callsLimit: API_LIMIT,
      remaining: 0,
      percentUsed: 100
    };
  }
}

/**
 * Check if we can make API call(s)
 * @param count Number of calls to check (default: 1)
 * @returns true if we have capacity, false if near/at limit
 */
export async function canMakeCall(count: number = 1): Promise<boolean> {
  const remaining = await getRemainingCalls();
  return remaining >= (count + SAFETY_MARGIN);
}

/**
 * Check if we should prioritize critical operations only
 * @returns true if usage is high (>900 calls)
 */
export async function isHighUsage(): Promise<boolean> {
  const stats = await getUsageStats();
  return stats.callsUsed > 900;
}

/**
 * Wait for next hour if capacity not available
 * Used by background jobs that can defer
 * @param requiredCalls Number of calls needed
 * @returns true if we can proceed, false if should defer
 */
export async function checkCapacity(requiredCalls: number): Promise<boolean> {
  const remaining = await getRemainingCalls();

  if (remaining >= requiredCalls + SAFETY_MARGIN) {
    return true; // We have capacity
  }

  console.log(`⏸️  API capacity low: ${remaining} calls remaining, need ${requiredCalls}`);
  return false; // Defer operation
}

/**
 * Clean up old usage records (keep last 24 hours)
 * Run this periodically to prevent table bloat
 */
export async function cleanupOldUsage(): Promise<void> {
  try {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);

    await db
      .delete(apiUsageTracker)
      .where(eq(apiUsageTracker.hourWindow, cutoff));

    console.log('🧹 Cleaned up API usage records older than 24 hours');
  } catch (error) {
    console.error('❌ Failed to cleanup old usage:', error);
  }
}

/**
 * Reset usage counter for testing
 * WARNING: Only use in development/testing
 */
export async function resetUsage(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot reset usage in production');
  }

  const hourWindow = getCurrentHourWindow();

  await db
    .delete(apiUsageTracker)
    .where(eq(apiUsageTracker.hourWindow, hourWindow));

  console.log('🔄 API usage reset for testing');
}
