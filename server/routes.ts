import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import {
  settings,
  banks,
  transactions,
  autotagRules,
  webhookEvents,
  webhookSyncState,
  syncQueue,
  apiLogs,
  apiUsageTracker,
  deepSyncProgress
} from "@shared/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { UpBankApiClient } from './UpBankApiClient';
import { trackApiCall, canMakeCall, getUsageStats } from './api-rate-limiter';

// Configure multer for image uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, JPG, PNG) and PDF files are allowed'));
    }
  }
});

// In-memory bill storage for testing
let bills: any[] = [];
let billIdCounter = 1;

export async function registerRoutes(app: Express): Promise<Server> {
  // Bills API endpoints

  // Upload image for OCR processing
  app.post('/api/bills/upload-image', upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }

      // Simulate OCR processing with mock data
      const mockOCRResults = [
        {
          billName: 'Netflix Subscription',
          amount: '15.99',
          company: 'Netflix',
          category: 'entertainment'
        },
        {
          billName: 'Electricity Bill',
          amount: '180.50',
          company: 'Synergy',
          category: 'utilities'
        },
        {
          billName: 'Phone Plan',
          amount: '89.00',
          company: 'Telstra',
          category: 'telecom'
        }
      ];

      // Return a random mock result
      const result = mockOCRResults[Math.floor(Math.random() * mockOCRResults.length)];

      res.json({
        success: true,
        data: result,
        message: 'OCR processing completed successfully'
      });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ error: 'Image processing failed' });
    }
  });

  // Save quick entry
  app.post('/api/bills/quick-entry', (req, res) => {
    try {
      const { billName, notes, amount } = req.body;

      const quickEntry = {
        id: billIdCounter++,
        billName: billName || '',
        notes: notes || '',
        amount: amount || '',
        type: 'quick-entry',
        status: 'pending-processing',
        createdAt: new Date().toISOString()
      };

      bills.push(quickEntry);

      res.json({
        success: true,
        data: quickEntry,
        message: 'Quick entry saved successfully'
      });
    } catch (error) {
      console.error('Quick entry error:', error);
      res.status(500).json({ error: 'Failed to save quick entry' });
    }
  });

  // Save detailed bill entry
  app.post('/api/bills/detailed-entry', (req, res) => {
    try {
      const billData = req.body;

      const detailedBill = {
        id: billIdCounter++,
        ...billData,
        type: 'detailed-entry',
        status: 'active',
        createdAt: new Date().toISOString()
      };

      bills.push(detailedBill);

      res.json({
        success: true,
        data: detailedBill,
        message: 'Bill saved successfully'
      });
    } catch (error) {
      console.error('Detailed entry error:', error);
      res.status(500).json({ error: 'Failed to save bill' });
    }
  });

  // Get all bills
  app.get('/api/bills', (req, res) => {
    try {
      res.json({
        success: true,
        data: bills,
        count: bills.length
      });
    } catch (error) {
      console.error('Get bills error:', error);
      res.status(500).json({ error: 'Failed to retrieve bills' });
    }
  });

  // Update bill
  app.put('/api/bills/:id', (req, res) => {
    try {
      const billId = parseInt(req.params.id);
      const updateData = req.body;

      const billIndex = bills.findIndex(bill => bill.id === billId);
      if (billIndex === -1) {
        return res.status(404).json({ error: 'Bill not found' });
      }

      bills[billIndex] = {
        ...bills[billIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        data: bills[billIndex],
        message: 'Bill updated successfully'
      });
    } catch (error) {
      console.error('Update bill error:', error);
      res.status(500).json({ error: 'Failed to update bill' });
    }
  });

  // Delete bill
  app.delete('/api/bills/:id', (req, res) => {
    try {
      const billId = parseInt(req.params.id);

      const billIndex = bills.findIndex(bill => bill.id === billId);
      if (billIndex === -1) {
        return res.status(404).json({ error: 'Bill not found' });
      }

      const deletedBill = bills.splice(billIndex, 1)[0];

      res.json({
        success: true,
        data: deletedBill,
        message: 'Bill deleted successfully'
      });
    } catch (error) {
      console.error('Delete bill error:', error);
      res.status(500).json({ error: 'Failed to delete bill' });
    }
  });

  // ========================================
  // UP BANKING API INTEGRATION ENDPOINTS
  // ========================================

  // Settings API endpoints
  app.get('/api/settings', async (req, res) => {
    try {
      // Mock user ID - in real app, get from auth
      const userId = 'mock-user-id';

      const userSettings = await db.select()
        .from(settings)
        .where(eq(settings.userId, userId));

      // Convert database settings to API format
      const apiSettings = {
        upBankToken: '',
        webhookSecret: '',
        autoSync: false,
        syncInterval: 15,
        autoTagEnabled: false,
        transferDetection: true,
      };

      // Handle both real DB results and mock DB results
      const settingsArray = Array.isArray(userSettings) ? userSettings : [];

      for (const setting of settingsArray) {
        switch (setting.key) {
          case 'up_bank_token':
            // Decrypt the token for use
            apiSettings.upBankToken = setting.valueEncrypted ? decryptToken(setting.valueEncrypted) : '';
            break;
          case 'webhook_secret':
            apiSettings.webhookSecret = setting.valueEncrypted ? decryptToken(setting.valueEncrypted) : '';
            break;
          case 'auto_sync':
            apiSettings.autoSync = setting.valueText === 'true';
            break;
          case 'sync_interval':
            apiSettings.syncInterval = parseInt(setting.valueText || '15');
            break;
          case 'auto_tag_enabled':
            apiSettings.autoTagEnabled = setting.valueText === 'true';
            break;
          case 'transfer_detection':
            apiSettings.transferDetection = setting.valueText === 'true';
            break;
        }
      }

      res.json({
        success: true,
        data: {
          apiSettings,
          lastSync: null // TODO: Get from sync logs
        }
      });
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ error: 'Failed to retrieve settings' });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      // Mock user ID - in real app, get from auth
      const userId = 'mock-user-id';
      const { apiSettings } = req.body;

      // Save each setting to database
      const settingsToSave = [
        {
          key: 'auto_sync',
          valueText: apiSettings.autoSync.toString(),
          valueEncrypted: null
        },
        {
          key: 'sync_interval',
          valueText: apiSettings.syncInterval.toString(),
          valueEncrypted: null
        },
        {
          key: 'auto_tag_enabled',
          valueText: apiSettings.autoTagEnabled.toString(),
          valueEncrypted: null
        },
        {
          key: 'transfer_detection',
          valueText: apiSettings.transferDetection.toString(),
          valueEncrypted: null
        }
      ];

      // Add encrypted settings if provided
      if (apiSettings.upBankToken && apiSettings.upBankToken !== '***ENCRYPTED***') {
        settingsToSave.push({
          key: 'up_bank_token',
          valueText: null,
          valueEncrypted: encryptToken(apiSettings.upBankToken) // TODO: Implement encryption
        });
      }

      if (apiSettings.webhookSecret) {
        settingsToSave.push({
          key: 'webhook_secret',
          valueText: null,
          valueEncrypted: encryptToken(apiSettings.webhookSecret) // TODO: Implement encryption
        });
      }

      // Upsert settings - check if setting exists first
      for (const setting of settingsToSave) {
        const existingSetting = await db.select()
          .from(settings)
          .where(and(
            eq(settings.userId, userId),
            eq(settings.key, setting.key)
          ))
          .limit(1);

        if (existingSetting.length > 0) {
          // Update existing setting
          await db.update(settings)
            .set({
              valueText: setting.valueText,
              valueEncrypted: setting.valueEncrypted,
              updatedAt: new Date()
            })
            .where(and(
              eq(settings.userId, userId),
              eq(settings.key, setting.key)
            ));
        } else {
          // Insert new setting
          await db.insert(settings).values({
            userId,
            key: setting.key,
            valueText: setting.valueText,
            valueEncrypted: setting.valueEncrypted,
            updatedAt: new Date()
          });
        }
      }

      res.json({
        success: true,
        message: 'Settings saved successfully'
      });
    } catch (error) {
      console.error('Save settings error:', error);
      res.status(500).json({ error: 'Failed to save settings' });
    }
  });

  // Banks API endpoints
  app.get('/api/banks', async (req, res) => {
    try {
      const userId = 'mock-user-id';
      const userBanks = await db.select()
        .from(banks)
        .where(eq(banks.userId, userId))
        .orderBy(desc(banks.createdAt));

      res.json({
        success: true,
        data: userBanks
      });
    } catch (error) {
      console.error('Failed to fetch banks:', error);
      res.status(500).json({ error: 'Failed to fetch banks' });
    }
  });

  app.post('/api/banks', async (req, res) => {
    try {
      const userId = 'mock-user-id';
      const { name, bankType, apiToken, enabled } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Bank name is required' });
      }

      const newBank = await db.insert(banks).values({
        userId,
        name,
        bankType: bankType || 'other',
        apiToken: apiToken ? encryptToken(apiToken) : null,
        enabled: enabled !== undefined ? enabled : true,
      }).returning();

      res.json({
        success: true,
        data: newBank[0]
      });
    } catch (error) {
      console.error('Failed to create bank:', error);
      res.status(500).json({ error: 'Failed to create bank' });
    }
  });

  app.put('/api/banks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, bankType, apiToken, enabled } = req.body;
      const userId = 'mock-user-id';

      const updateData: any = {
        updatedAt: new Date()
      };

      if (name !== undefined) updateData.name = name;
      if (bankType !== undefined) updateData.bankType = bankType;
      if (apiToken !== undefined && apiToken !== '***ENCRYPTED***') {
        updateData.apiToken = encryptToken(apiToken);
      }
      if (enabled !== undefined) updateData.enabled = enabled;

      const updated = await db.update(banks)
        .set(updateData)
        .where(and(eq(banks.id, id), eq(banks.userId, userId)))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: 'Bank not found' });
      }

      res.json({
        success: true,
        data: updated[0]
      });
    } catch (error) {
      console.error('Failed to update bank:', error);
      res.status(500).json({ error: 'Failed to update bank' });
    }
  });

  app.delete('/api/banks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = 'mock-user-id';

      const deleted = await db.delete(banks)
        .where(and(eq(banks.id, id), eq(banks.userId, userId)))
        .returning();

      if (deleted.length === 0) {
        return res.status(404).json({ error: 'Bank not found' });
      }

      res.json({
        success: true,
        message: 'Bank deleted successfully'
      });
    } catch (error) {
      console.error('Failed to delete bank:', error);
      res.status(500).json({ error: 'Failed to delete bank' });
    }
  });

  // Sync endpoints
  app.post('/api/sync/pull', async (req, res) => {
    try {
      // Mock sync operation
      // In real implementation, this would:
      // 1. Get UP Bank token from settings
      // 2. Initialize UP Bank API client
      // 3. Pull latest transactions
      // 4. Process and store in database
      // 5. Apply auto-tag rules if enabled

      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      res.json({
        success: true,
        data: {
          transactionsPulled: 25,
          newTransactions: 3,
          processingTime: 2000
        },
        message: 'Sync completed successfully'
      });
    } catch (error) {
      console.error('Sync pull error:', error);
      res.status(500).json({ error: 'Sync failed' });
    }
  });

  app.post('/api/sync/push/:id', async (req, res) => {
    try {
      const transactionId = req.params.id;
      const { category, tags } = req.body;

      // Mock push operation
      // In real implementation, this would:
      // 1. Get UP Bank token from settings
      // 2. Update transaction in UP Bank
      // 3. Update sync status in database

      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

      res.json({
        success: true,
        message: 'Transaction synced to UP Bank'
      });
    } catch (error) {
      console.error('Sync push error:', error);
      res.status(500).json({ error: 'Push sync failed' });
    }
  });

  // Transaction endpoints
  // Smart sync - only fetch new transactions since last sync
  app.post('/api/transactions/sync', async (req, res) => {
    try {
      const userId = 'mock-user-id';

      // Get UP Bank token and last sync time
      const userSettings = await db.select()
        .from(settings)
        .where(eq(settings.userId, userId));

      const settingsMap: any = {};
      for (const setting of userSettings) {
        if (setting.key === 'up_bank_token' && setting.valueEncrypted) {
          settingsMap.upBankToken = decryptToken(setting.valueEncrypted);
        } else if (setting.key === 'last_transaction_sync' && setting.valueText) {
          settingsMap.lastSync = setting.valueText;
        }
      }

      if (!settingsMap.upBankToken) {
        return res.status(400).json({ error: 'UP Bank token not configured' });
      }

      // Initialize UP Bank API client
      const upBankClient = new UpBankApiClient(settingsMap.upBankToken);

      // Fetch accounts to build account names mapping
      const accountsResponse = await upBankClient.getAccounts();
      const accountsMap = new Map<string, { name: string; type: string }>();

      for (const acc of accountsResponse.data) {
        const accountType = acc.attributes.accountType;
        let emoji = '🏦'; // default

        if (accountType === 'SAVER') {
          emoji = '💰';
        } else if (accountType === 'TRANSACTIONAL') {
          emoji = '🏦';
        }

        accountsMap.set(acc.id, {
          name: `Up-${emoji} ${acc.attributes.displayName}`,
          type: accountType
        });
      }

      // Get webhook sync state (with graceful fallback if table doesn't exist)
      let syncState: any = null;
      try {
        const syncStateResult = await db.select()
          .from(webhookSyncState)
          .where(eq(webhookSyncState.userId, userId))
          .limit(1);
        syncState = syncStateResult[0];
      } catch (error) {
        console.warn('⚠️ webhook_sync_state table not found, will use full sync:', error);
        syncState = null; // Will trigger full sync strategy
      }

      let transactionsToSync: string[] = []; // UP Bank transaction IDs
      let syncStrategy = 'full'; // 'smart', 'fallback-7days', or 'full'

      // Try smart sync with webhook logs
      if (syncState?.webhookId && syncState?.lastProcessedTimestamp) {
        try {
          console.log('🧠 Attempting smart sync via webhook logs...');

          // Get webhook logs since last processed timestamp
          const webhookLogsResponse = await upBankClient.getWebhookLogs(
            syncState.webhookId,
            { pageSize: 100 }
          );

          // Find failed deliveries
          const failedDeliveries = webhookLogsResponse.data.filter((log: any) => {
            const deliveryStatus = log.attributes.deliveryStatus;
            const createdAt = new Date(log.attributes.createdAt);
            const lastProcessed = new Date(syncState.lastProcessedTimestamp);

            return (
              deliveryStatus !== 'DELIVERED' &&
              createdAt > lastProcessed
            );
          });

          console.log(`📊 Found ${failedDeliveries.length} failed webhook deliveries`);

          // Extract transaction IDs from failed deliveries
          for (const delivery of failedDeliveries) {
            const txnId = delivery.relationships?.webhookEvent?.data?.relationships?.transaction?.data?.id;
            if (txnId && !transactionsToSync.includes(txnId)) {
              transactionsToSync.push(txnId);
            }
          }

          if (transactionsToSync.length > 0) {
            syncStrategy = 'smart';
            console.log(`✅ Smart sync: Will fetch ${transactionsToSync.length} specific transactions`);
          } else {
            syncStrategy = 'fallback-7days';
            console.log('✅ No failed webhooks, will do 7-day sync for safety');
          }

        } catch (webhookError) {
          console.warn('⚠️ Webhook log check failed, falling back to 7-day sync:', webhookError);
          syncStrategy = 'fallback-7days';
        }
      } else {
        // No webhook configured yet or first sync
        console.log('📝 No webhook state found, doing full sync');
        syncStrategy = 'full';
      }

      // Fetch transactions based on strategy
      let allNewTransactions: any[] = [];
      let nextPageUrl: string | null = null;
      let newCount = 0;
      let updatedCount = 0;

      if (syncStrategy === 'smart') {
        // Fetch only specific transactions that had failed webhooks
        console.log(`🎯 Fetching ${transactionsToSync.length} specific transactions...`);
        for (const txnId of transactionsToSync) {
          try {
            const txnResponse = await upBankClient.getTransaction(txnId);
            allNewTransactions.push(txnResponse.data);
          } catch (err) {
            console.error(`Failed to fetch transaction ${txnId}:`, err);
          }
        }

        // Also fetch truly NEW transactions since last sync
        const response = await upBankClient.getTransactions({
          pageSize: 100,
          since: settingsMap.lastSync
        });
        allNewTransactions.push(...response.data);

      } else if (syncStrategy === 'fallback-7days') {
        // Fetch last 7 days of transactions as safety net
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const response = await upBankClient.getTransactions({
          pageSize: 100,
          since: sevenDaysAgo.toISOString()
        });
        allNewTransactions = response.data;

      } else {
        // Full sync - fetch ALL transactions (first time or fallback)
        do {
          const response = await upBankClient.getTransactions({
            pageSize: 100
          });

          allNewTransactions.push(...response.data);
          nextPageUrl = response.links?.next || null;

          // Safety: don't fetch more than 500 transactions in one sync
          if (allNewTransactions.length >= 500) break;
        } while (nextPageUrl);
      }

      // Process all fetched transactions
      console.log(`📦 Processing ${allNewTransactions.length} transactions...`);

      for (const txn of allNewTransactions) {
          try {
            // Skip if transaction doesn't have required fields
            if (!txn.attributes || !txn.attributes.amount) {
              console.warn('Skipping transaction with missing attributes:', txn.id);
              continue;
            }

            // Check if transaction already exists
            const existing = await db.select()
              .from(transactions)
              .where(eq(transactions.upTransactionId, txn.id))
              .limit(1);

            const accountId = txn.relationships?.account?.data?.id || null;
            const accountInfo = accountId ? accountsMap.get(accountId) : null;

            const transactionData = {
              upTransactionId: txn.id,
              accountId: accountId,
              amount: txn.attributes.amount.valueInBaseUnits / 100,
              date: new Date(txn.attributes.createdAt),
              description: txn.attributes.description || txn.attributes.rawText || 'No description',
              category: txn.relationships?.category?.data?.id || 'uncategorized',
              tags: txn.relationships?.tags?.data?.map((t: any) => t.id).join(',') || '',
              type: txn.attributes.amount.valueInBaseUnits > 0 ? 'credit' : 'debit',
              status: txn.attributes.status || 'SETTLED',
              rawData: txn,
              syncStatus: 'synced',
              source: 'up_bank',
              account: accountInfo?.name || 'UP Bank',
              updatedAt: new Date()
            };

            if (existing.length > 0) {
              // Update existing
              await db.update(transactions)
                .set(transactionData)
                .where(eq(transactions.upTransactionId, txn.id));
              updatedCount++;
            } else {
              // Insert new
              await db.insert(transactions).values({
                ...transactionData,
                createdAt: new Date()
              });
              newCount++;
            }
          } catch (txnError) {
            console.error('Error processing transaction:', txn.id, txnError);
            // Continue with next transaction
          }
        }

      // Update webhook sync state (graceful fallback if table doesn't exist)
      const now = new Date();
      const nowISO = now.toISOString();

      if (syncState) {
        try {
          await db.update(webhookSyncState)
            .set({
              lastProcessedTimestamp: now,
              lastSmartSync: syncStrategy === 'smart' ? now : syncState.lastSmartSync,
              lastFullSync: syncStrategy === 'full' ? now : syncState.lastFullSync,
              updatedAt: now
            })
            .where(eq(webhookSyncState.userId, userId));
        } catch (error) {
          console.warn('⚠️ Could not update webhook_sync_state:', error);
          // Continue anyway - not critical for sync to succeed
        }
      }

      // Update last sync timestamp
      const lastSyncSetting = await db.select()
        .from(settings)
        .where(and(
          eq(settings.userId, userId),
          eq(settings.key, 'last_transaction_sync')
        ))
        .limit(1);

      if (lastSyncSetting.length > 0) {
        await db.update(settings)
          .set({ valueText: nowISO, updatedAt: now })
          .where(and(
            eq(settings.userId, userId),
            eq(settings.key, 'last_transaction_sync')
          ));
      } else {
        await db.insert(settings).values({
          userId,
          key: 'last_transaction_sync',
          valueText: nowISO,
          valueEncrypted: null,
          updatedAt: now
        });
      }

      res.json({
        success: true,
        data: {
          newTransactions: newCount,
          updatedTransactions: updatedCount,
          totalFetched: allNewTransactions.length,
          lastSync: nowISO,
          syncStrategy: syncStrategy
        },
        message: `Synced ${newCount} new and ${updatedCount} updated transactions (strategy: ${syncStrategy})`
      });
    } catch (error) {
      console.error('Transaction sync error:', error);
      res.status(500).json({
        error: 'Sync failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get transactions with filters
  app.get('/api/transactions', async (req, res) => {
    try {
      const {
        dateFrom,
        dateTo,
        amountMin,
        amountMax,
        merchant,
        category,
        tags,
        account,
        limit = 50,
        offset = 0
      } = req.query;

      let query = db.select().from(transactions);

      // Apply filters
      const conditions: any[] = [];

      if (dateFrom) {
        conditions.push(gte(transactions.date, new Date(dateFrom as string)));
      }
      if (dateTo) {
        conditions.push(lte(transactions.date, new Date(dateTo as string)));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const results = await query
        .orderBy(desc(transactions.date))
        .limit(Number(limit))
        .offset(Number(offset));

      // Apply client-side filters for text-based searches
      let filtered = results;

      if (merchant) {
        const searchTerm = (merchant as string).toLowerCase();
        filtered = filtered.filter(t =>
          t.description.toLowerCase().includes(searchTerm)
        );
      }

      if (category) {
        filtered = filtered.filter(t => t.category === category);
      }

      if (tags) {
        const tagArray = (tags as string).split(',');
        filtered = filtered.filter(t =>
          tagArray.some(tag => t.tags?.includes(tag))
        );
      }

      if (account) {
        filtered = filtered.filter(t => t.account === account);
      }

      if (amountMin !== undefined) {
        filtered = filtered.filter(t => Number(t.amount) >= Number(amountMin));
      }

      if (amountMax !== undefined) {
        filtered = filtered.filter(t => Number(t.amount) <= Number(amountMax));
      }

      res.json({
        success: true,
        data: filtered,
        total: filtered.length
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  // Page load sync - lightweight sync for 100 newest transactions
  app.post('/api/transactions/sync-page-load', async (req, res) => {
    try {
      console.log('\n📄 [Page Load Sync] Starting...');

      const userId = 'mock-user-id';

      // Check API capacity
      if (!(await canMakeCall(1))) {
        console.log('⏸️  [Page Load Sync] API limit reached, using local data');
        return res.json({
          success: true,
          message: 'API limit reached, using cached data',
          synced: 0
        });
      }

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
        return res.status(400).json({
          success: false,
          error: 'UP Bank token not configured'
        });
      }

      const upBankClient = new UpBankApiClient(upBankToken);

      // Fetch only 100 newest transactions (1 API call)
      console.log('📥 Fetching 100 newest transactions...');
      const response = await upBankClient.getTransactions({
        pageSize: 100
      });
      await trackApiCall();

      const txns = response.data;
      let newCount = 0;
      let updatedCount = 0;

      // Get account names
      const accountsResponse = await upBankClient.getAccounts();
      await trackApiCall();

      const accountsMap = new Map<string, { name: string; type: string }>();
      for (const acc of accountsResponse.data) {
        const accountType = acc.attributes.accountType;
        let emoji = '🏦';
        if (accountType === 'SAVER') emoji = '💰';
        else if (accountType === 'TRANSACTIONAL') emoji = '🏦';

        accountsMap.set(acc.id, {
          name: `Up-${emoji} ${acc.attributes.displayName}`,
          type: accountType
        });
      }

      // Update or insert each transaction
      for (const txn of txns) {
        const accountInfo = accountsMap.get(txn.relationships?.account?.data?.id);

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
          account: accountInfo?.name || 'UP Bank',
          updatedAt: new Date()
        };

        // Check if exists
        const existing = await db
          .select()
          .from(transactions)
          .where(eq(transactions.upTransactionId, txn.id))
          .limit(1);

        if (existing.length > 0) {
          // Update
          await db
            .update(transactions)
            .set(txnData)
            .where(eq(transactions.upTransactionId, txn.id));
          updatedCount++;
        } else {
          // Insert
          await db.insert(transactions).values({
            ...txnData,
            userId: userId,
            createdAt: new Date()
          });
          newCount++;
        }
      }

      const stats = await getUsageStats();
      console.log(`✅ [Page Load Sync] Complete: ${newCount} new, ${updatedCount} updated`);
      console.log(`📊 API Usage: ${stats.callsUsed}/${stats.callsLimit} (${stats.percentUsed}%)`);

      res.json({
        success: true,
        message: 'Page load sync complete',
        synced: txns.length,
        new: newCount,
        updated: updatedCount,
        apiUsage: stats
      });

    } catch (error) {
      console.error('❌ [Page Load Sync] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Page load sync failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Create manual transaction
  app.post('/api/transactions', async (req, res) => {
    try {
      const {
        amount,
        date,
        description,
        category,
        tags,
        account,
        bankId,
        notes
      } = req.body;

      const newTransaction = await db.insert(transactions).values({
        amount: String(amount),
        date: new Date(date),
        description: description || 'Manual transaction',
        category: category || 'uncategorized',
        tags: tags || '',
        type: amount > 0 ? 'credit' : 'debit',
        status: 'SETTLED',
        source: 'manual',
        account: account || 'Manual',
        bankId: bankId || null,
        syncStatus: 'synced',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      res.json({
        success: true,
        data: newTransaction[0],
        message: 'Transaction created successfully'
      });
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  });

  // Update transaction (tags/category)
  app.put('/api/transactions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { category, tags } = req.body;
      const userId = 'mock-user-id';

      // Get the transaction to check if it's from UP Bank
      const existingTxn = await db.select()
        .from(transactions)
        .where(eq(transactions.id, id))
        .limit(1);

      if (existingTxn.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const transaction = existingTxn[0];
      const updateData: any = {
        updatedAt: new Date()
      };

      if (category !== undefined) updateData.category = category;
      if (tags !== undefined) updateData.tags = tags;

      // Update local database immediately (instant UI update)
      const updated = await db.update(transactions)
        .set(updateData)
        .where(eq(transactions.id, id))
        .returning();

      // If this is an UP Bank transaction, queue the sync instead of immediate API call
      if (transaction.upTransactionId) {
        console.log(`📝 Queueing sync for transaction ${id} to UP Bank`);

        // Add category update to queue
        if (category !== undefined && category !== transaction.category) {
          await db.insert(syncQueue).values({
            transactionId: id,
            upTransactionId: transaction.upTransactionId,
            field: 'category',
            oldValue: transaction.category || null,
            newValue: category,
            priority: 3, // Normal priority
            status: 'pending'
          });
          console.log(`  ✓ Category queued: ${transaction.category} → ${category}`);
        }

        // Add tags update to queue
        if (tags !== undefined && tags !== transaction.tags) {
          await db.insert(syncQueue).values({
            transactionId: id,
            upTransactionId: transaction.upTransactionId,
            field: 'tags',
            oldValue: transaction.tags || null,
            newValue: tags,
            priority: 3, // Normal priority
            status: 'pending'
          });
          console.log(`  ✓ Tags queued: ${transaction.tags} → ${tags}`);
        }

        console.log(`✅ Transaction ${id} updated locally and queued for sync`);
      }

      res.json({
        success: true,
        data: updated[0],
        message: 'Transaction updated successfully'
      });
    } catch (error) {
      console.error('Update transaction error:', error);
      res.status(500).json({ error: 'Failed to update transaction' });
    }
  });

  // Delete manual transaction
  app.delete('/api/transactions/:id', async (req, res) => {
    try {
      const { id } = req.params;

      // Only allow deleting manual transactions
      const txn = await db.select()
        .from(transactions)
        .where(eq(transactions.id, id))
        .limit(1);

      if (txn.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      if (txn[0].source !== 'manual') {
        return res.status(400).json({
          error: 'Cannot delete UP Bank transactions. Please delete from UP Bank app.'
        });
      }

      await db.delete(transactions).where(eq(transactions.id, id));

      res.json({
        success: true,
        message: 'Transaction deleted successfully'
      });
    } catch (error) {
      console.error('Delete transaction error:', error);
      res.status(500).json({ error: 'Failed to delete transaction' });
    }
  });

  // Import CSV transactions
  app.post('/api/transactions/import-csv', async (req, res) => {
    try {
      const { transactions: csvTransactions, mapping } = req.body;

      if (!csvTransactions || !Array.isArray(csvTransactions)) {
        return res.status(400).json({ error: 'Invalid CSV data' });
      }

      const imported = [];
      const errors = [];

      console.log(`📥 CSV Import: Processing ${csvTransactions.length} rows...`);

      for (let i = 0; i < csvTransactions.length; i++) {
        const row = csvTransactions[i];
        try {
          console.log(`\n📝 Processing row ${i + 1}:`, JSON.stringify(row).substring(0, 200));

          // Map CSV columns to transaction fields
          // Handle both single amount field OR separate debit/credit columns
          let amount = 0;
          if (row.amount !== undefined && row.amount !== '') {
            // Single amount field from frontend
            const parsedAmount = parseFloat(String(row.amount).trim() || '0');
            amount = isNaN(parsedAmount) ? 0 : parsedAmount;
            console.log(`  💰 Single amount: ${row.amount} → ${amount}`);
          } else {
            // Check for mapped debit/credit columns or direct column names
            const debitStr = String(row.debitAmount || row[mapping.debitAmount] || row['Debit Amount'] || '').trim();
            const creditStr = String(row.creditAmount || row[mapping.creditAmount] || row['Credit Amount'] || '').trim();

            const debitAmount = debitStr ? parseFloat(debitStr) : 0;
            const creditAmount = creditStr ? parseFloat(creditStr) : 0;

            console.log(`  💰 Debit: "${debitStr}" → ${debitAmount}, Credit: "${creditStr}" → ${creditAmount}`);

            // Credit is positive, Debit is negative
            amount = creditAmount - debitAmount;
            console.log(`  💰 Final amount: ${amount}`);
          }

          // Validate amount
          if (isNaN(amount)) {
            throw new Error(`Invalid amount calculated: ${amount}`);
          }

          // Parse date - handle DD/MM/YYYY format
          let date: Date;
          const dateStr = String(row.date || row[mapping.date] || row.Date || '').trim();
          console.log(`  📅 Date string: "${dateStr}"`);

          if (!dateStr) {
            throw new Error('Date is required');
          }

          if (dateStr.includes('/')) {
            // Handle DD/MM/YYYY format
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              const day = parseInt(parts[0]);
              const month = parseInt(parts[1]) - 1; // 0-indexed
              const year = parseInt(parts[2]);
              date = new Date(year, month, day);
              console.log(`  📅 Parsed date: ${date.toISOString()}`);
            } else {
              date = new Date(dateStr);
            }
          } else {
            date = new Date(dateStr);
          }

          // Validate date
          if (isNaN(date.getTime())) {
            throw new Error(`Invalid date: ${dateStr}`);
          }

          const description = String(row.description || row[mapping.merchant] || row[mapping.description] || row.Narrative || row.Merchant || 'Imported').trim();
          const category = String(row.category || row[mapping.category] || row.Category || 'uncategorized').trim();
          const tags = String(row.tags || row[mapping.tags] || row.Tags || '').trim();
          const account = String(row.account || 'Imported').trim();
          const bankId = row.bankId || null;

          console.log(`  ✅ Inserting: ${description} | ${amount} | ${date.toISOString().split('T')[0]}`);

          const newTxn = await db.insert(transactions).values({
            amount: String(amount),
            date,
            description,
            category,
            tags,
            type: amount > 0 ? 'credit' : 'debit',
            status: 'SETTLED',
            source: 'import',
            account,
            bankId,
            syncStatus: 'synced',
            createdAt: new Date(),
            updatedAt: new Date()
          }).returning();

          imported.push(newTxn[0]);
          console.log(`  ✅ Row ${i + 1} imported successfully`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error(`  ❌ Row ${i + 1} FAILED: ${errorMsg}`);
          errors.push({
            rowNumber: i + 1,
            row,
            error: errorMsg
          });
        }
      }

      console.log(`\n✅ Import complete: ${imported.length} imported, ${errors.length} errors`);

      res.json({
        success: true,
        data: {
          imported: imported.length,
          errors: errors.length,
          errorDetails: errors
        },
        message: `Imported ${imported.length} transactions with ${errors.length} errors`
      });
    } catch (error) {
      console.error('CSV import error:', error);
      res.status(500).json({ error: 'Failed to import CSV' });
    }
  });

  // Get UP Bank categories
  app.get('/api/up-bank/categories', async (req, res) => {
    try {
      const userId = 'mock-user-id';

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
        return res.status(400).json({ error: 'UP Bank token not configured' });
      }

      const upBankClient = new UpBankApiClient(upBankToken);
      const categories = await upBankClient.getCategories();

      res.json({
        success: true,
        data: categories.data
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Get UP Bank tags
  app.get('/api/up-bank/tags', async (req, res) => {
    try {
      const userId = 'mock-user-id';

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
        return res.status(400).json({ error: 'UP Bank token not configured' });
      }

      const upBankClient = new UpBankApiClient(upBankToken);
      const tags = await upBankClient.getTags();

      res.json({
        success: true,
        data: tags.data
      });
    } catch (error) {
      console.error('Get tags error:', error);
      res.status(500).json({ error: 'Failed to fetch tags' });
    }
  });

  // Get UP Bank accounts
  app.get('/api/up-bank/accounts', async (req, res) => {
    try {
      const userId = 'mock-user-id';

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
        return res.status(400).json({ error: 'UP Bank token not configured' });
      }

      const upBankClient = new UpBankApiClient(upBankToken);
      const accounts = await upBankClient.getAccounts();

      res.json({
        success: true,
        data: accounts.data
      });
    } catch (error) {
      console.error('Get accounts error:', error);
      res.status(500).json({ error: 'Failed to fetch accounts' });
    }
  });

  // Webhook endpoint for UP Bank
  app.post('/api/webhooks/up-bank', async (req, res) => {
    try {
      // Verify webhook signature (if configured)
      const signature = req.headers['x-up-authenticity-signature'] as string;

      // TODO: Verify signature with webhook secret

      // Store webhook event
      const eventData = req.body;

      await db.insert(webhookEvents).values({
        eventType: eventData.data.attributes.eventType,
        upTransactionId: eventData.data.relationships?.transaction?.data?.id,
        payload: eventData,
        receivedAt: new Date()
      });

      // Process webhook asynchronously
      processWebhookEvent(eventData);

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Webhook Management Endpoints

  // Get webhook status
  app.get('/api/webhooks/status', async (req, res) => {
    try {
      const userId = 'mock-user-id';

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
        return res.json({
          success: true,
          data: { configured: false, message: 'UP Bank token not configured' }
        });
      }

      // Check webhook sync state
      const syncStateResult = await db.select()
        .from(webhookSyncState)
        .where(eq(webhookSyncState.userId, userId))
        .limit(1);

      if (syncStateResult.length === 0) {
        return res.json({
          success: true,
          data: { configured: false, message: 'No webhook configured' }
        });
      }

      const syncState = syncStateResult[0];

      // Fetch webhook details from UP Bank
      const upBankClient = new UpBankApiClient(upBankToken);
      const webhooksResponse = await upBankClient.listWebhooks();

      const webhook = webhooksResponse.data.find((wh: any) => wh.id === syncState.webhookId);

      res.json({
        success: true,
        data: {
          configured: true,
          webhookId: syncState.webhookId,
          webhookUrl: webhook?.attributes?.url || null,
          lastProcessed: syncState.lastProcessedTimestamp,
          lastSmartSync: syncState.lastSmartSync,
          lastFullSync: syncState.lastFullSync
        }
      });
    } catch (error) {
      console.error('Get webhook status error:', error);
      res.status(500).json({ error: 'Failed to get webhook status' });
    }
  });

  // Setup webhook
  app.post('/api/webhooks/setup', async (req, res) => {
    console.log('🔧 Webhook setup endpoint hit');
    console.log('📨 Request body:', JSON.stringify(req.body));

    try {
      const userId = 'mock-user-id';
      const { webhookUrl } = req.body;

      console.log(`📍 Step 1: Validating webhookUrl: ${webhookUrl}`);
      if (!webhookUrl) {
        console.log('❌ Webhook URL is missing');
        return res.status(400).json({
          success: false,
          error: 'Webhook URL is required'
        });
      }

      console.log('📍 Step 2: Fetching UP Bank token from settings');
      // Get UP Bank token
      const userSettings = await db.select()
        .from(settings)
        .where(eq(settings.userId, userId));

      console.log(`📍 Found ${userSettings.length} settings entries`);

      let upBankToken = '';
      for (const setting of userSettings) {
        if (setting.key === 'up_bank_token' && setting.valueEncrypted) {
          upBankToken = decryptToken(setting.valueEncrypted);
          console.log(`📍 Step 3: UP Bank token found and decrypted (length: ${upBankToken.length})`);
          break;
        }
      }

      if (!upBankToken) {
        console.log('❌ UP Bank token not configured');
        return res.status(400).json({
          success: false,
          error: 'UP Bank token not configured'
        });
      }

      console.log(`📍 Step 4: Creating webhook in UP Bank with URL: ${webhookUrl}`);
      // Create webhook in UP Bank
      const upBankClient = new UpBankApiClient(upBankToken);
      const webhookResponse = await upBankClient.createWebhook(
        webhookUrl,
        'ApexFinance - Transaction sync webhook'
      );

      console.log('📍 Step 5: Webhook created in UP Bank:', JSON.stringify(webhookResponse));
      const webhookId = webhookResponse.data.id;
      console.log(`✅ Webhook ID: ${webhookId}`);

      console.log('📍 Step 6: Storing webhook sync state in database');
      // Store webhook sync state
      const existing = await db.select()
        .from(webhookSyncState)
        .where(eq(webhookSyncState.userId, userId))
        .limit(1);

      if (existing.length > 0) {
        console.log('📍 Updating existing webhook sync state');
        // Update existing
        await db.update(webhookSyncState)
          .set({
            webhookId,
            lastProcessedTimestamp: new Date(),
            updatedAt: new Date()
          })
          .where(eq(webhookSyncState.userId, userId));
      } else {
        console.log('📍 Creating new webhook sync state');
        // Insert new
        await db.insert(webhookSyncState).values({
          userId,
          webhookId,
          lastProcessedTimestamp: new Date(),
          updatedAt: new Date()
        });
      }

      console.log(`✅ Webhook setup complete: ${webhookId}`);

      res.json({
        success: true,
        data: {
          webhookId,
          webhookUrl,
          message: 'Webhook configured successfully'
        }
      });
    } catch (error) {
      console.error('❌ Setup webhook error:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({
        success: false,
        error: 'Failed to setup webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Test webhook (ping)
  app.post('/api/webhooks/test', async (req, res) => {
    try {
      const userId = 'mock-user-id';

      // Get webhook ID from sync state
      const syncStateResult = await db.select()
        .from(webhookSyncState)
        .where(eq(webhookSyncState.userId, userId))
        .limit(1);

      if (syncStateResult.length === 0) {
        return res.status(404).json({ error: 'No webhook configured' });
      }

      const webhookId = syncStateResult[0].webhookId;

      if (!webhookId) {
        return res.status(404).json({ error: 'Webhook ID not found' });
      }

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
        return res.status(400).json({ error: 'UP Bank token not configured' });
      }

      // Ping webhook
      const upBankClient = new UpBankApiClient(upBankToken);
      await upBankClient.pingWebhook(webhookId);

      console.log(`✅ Webhook pinged: ${webhookId}`);

      res.json({
        success: true,
        message: 'Webhook ping sent successfully. Check your webhook endpoint logs.'
      });
    } catch (error) {
      console.error('Test webhook error:', error);
      res.status(500).json({
        error: 'Failed to test webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete webhook
  app.delete('/api/webhooks', async (req, res) => {
    try {
      const userId = 'mock-user-id';

      // Get webhook ID from sync state
      const syncStateResult = await db.select()
        .from(webhookSyncState)
        .where(eq(webhookSyncState.userId, userId))
        .limit(1);

      if (syncStateResult.length === 0) {
        return res.status(404).json({ error: 'No webhook configured' });
      }

      const webhookId = syncStateResult[0].webhookId;

      if (!webhookId) {
        return res.status(404).json({ error: 'Webhook ID not found' });
      }

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
        return res.status(400).json({ error: 'UP Bank token not configured' });
      }

      // Delete webhook from UP Bank
      const upBankClient = new UpBankApiClient(upBankToken);
      await upBankClient.deleteWebhook(webhookId);

      // Delete webhook sync state
      await db.delete(webhookSyncState)
        .where(eq(webhookSyncState.userId, userId));

      console.log(`✅ Webhook deleted: ${webhookId}`);

      res.json({
        success: true,
        message: 'Webhook deleted successfully'
      });
    } catch (error) {
      console.error('Delete webhook error:', error);
      res.status(500).json({
        error: 'Failed to delete webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get webhook delivery logs
  app.get('/api/webhooks/logs', async (req, res) => {
    try {
      const userId = 'mock-user-id';
      const { limit = 20 } = req.query;

      // Get webhook ID from sync state
      const syncStateResult = await db.select()
        .from(webhookSyncState)
        .where(eq(webhookSyncState.userId, userId))
        .limit(1);

      if (syncStateResult.length === 0) {
        return res.json({
          success: true,
          data: []
        });
      }

      const webhookId = syncStateResult[0].webhookId;

      if (!webhookId) {
        return res.json({
          success: true,
          data: []
        });
      }

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
        return res.status(400).json({ error: 'UP Bank token not configured' });
      }

      // Fetch webhook logs from UP Bank
      const upBankClient = new UpBankApiClient(upBankToken);
      const logsResponse = await upBankClient.getWebhookLogs(webhookId, {
        pageSize: parseInt(limit as string)
      });

      res.json({
        success: true,
        data: logsResponse.data
      });
    } catch (error) {
      console.error('Get webhook logs error:', error);
      res.status(500).json({
        error: 'Failed to get webhook logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Sync status endpoint - returns API usage, queue stats, deep sync progress
  app.get('/api/sync/status', async (req, res) => {
    try {
      const userId = 'mock-user-id';

      // Get API usage stats
      const apiStats = await getUsageStats();

      // Get queue stats
      const queueStats = await db.select()
        .from(syncQueue)
        .where(eq(syncQueue.status, 'pending'));

      const processingQueue = await db.select()
        .from(syncQueue)
        .where(eq(syncQueue.status, 'processing'));

      const failedQueue = await db.select()
        .from(syncQueue)
        .where(eq(syncQueue.status, 'failed'));

      // Get deep sync progress
      const deepSyncData = await db.select()
        .from(deepSyncProgress)
        .where(eq(deepSyncProgress.userId, userId))
        .limit(1);

      const deepSync = deepSyncData.length > 0 ? deepSyncData[0] : {
        status: 'idle',
        totalSynced: 0,
        currentBatch: 0,
        lastSyncedDate: null
      };

      // Calculate progress percentage
      let progress = 0;
      if (deepSync.status === 'running' && deepSync.totalSynced > 0) {
        // Rough estimate: assume 10,000 total transactions
        progress = Math.min(100, Math.round((deepSync.totalSynced / 10000) * 100));
      } else if (deepSync.status === 'completed') {
        progress = 100;
      }

      // Get last sync timestamp
      const lastSyncSetting = await db.select()
        .from(settings)
        .where(and(
          eq(settings.userId, userId),
          eq(settings.key, 'last_transaction_sync')
        ))
        .limit(1);

      const lastSync = lastSyncSetting.length > 0 ? lastSyncSetting[0].valueText : null;

      res.json({
        success: true,
        data: {
          apiUsage: {
            callsUsed: apiStats.callsUsed,
            callsLimit: apiStats.callsLimit,
            remaining: apiStats.remaining,
            percentUsed: apiStats.percentUsed
          },
          queue: {
            pending: queueStats.length,
            processing: processingQueue.length,
            failed: failedQueue.length
          },
          deepSync: {
            status: deepSync.status,
            progress,
            totalSynced: deepSync.totalSynced,
            currentBatch: deepSync.currentBatch,
            lastSyncedDate: deepSync.lastSyncedDate
          },
          lastSync
        }
      });
    } catch (error) {
      console.error('❌ Get sync status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get sync status'
      });
    }
  });

  // Deep sync trigger endpoint
  app.post('/api/sync/deep-sync', async (req, res) => {
    try {
      const { timeRange } = req.body;

      if (!['3-months', '1-year', 'all-time'].includes(timeRange)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid time range. Must be: 3-months, 1-year, or all-time'
        });
      }

      console.log(`🚀 Triggering deep sync: ${timeRange}`);

      // Import and trigger deep sync
      const { triggerDeepSync } = await import('./background-jobs');
      await triggerDeepSync(timeRange);

      res.json({
        success: true,
        message: `Deep sync started for ${timeRange}`,
        timeRange
      });
    } catch (error) {
      console.error('❌ Trigger deep sync error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to trigger deep sync',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Reset stuck deep sync endpoint
  app.post('/api/sync/reset', async (req, res) => {
    try {
      const userId = 'mock-user-id';

      console.log('🔄 Manual reset of deep sync status');

      // Get current progress
      const existing = await db.select()
        .from(deepSyncProgress)
        .where(eq(deepSyncProgress.userId, userId))
        .limit(1);

      if (existing.length === 0) {
        return res.json({
          success: true,
          message: 'No deep sync record found'
        });
      }

      const current = existing[0];
      const wasStuck = current.status === 'running' && current.totalSynced === 0;

      // Reset to idle
      await db
        .update(deepSyncProgress)
        .set({
          status: 'idle',
          error: wasStuck ? 'Manually reset by user' : null,
          updatedAt: new Date()
        })
        .where(eq(deepSyncProgress.userId, userId));

      console.log(`✅ Deep sync status reset to idle (was: ${current.status})`);

      res.json({
        success: true,
        message: 'Deep sync reset successfully',
        previousStatus: current.status,
        wasStuck
      });
    } catch (error) {
      console.error('❌ Reset deep sync error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset deep sync',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Auto-tag rules endpoints
  app.get('/api/autotag/rules', async (req, res) => {
    try {
      // Mock user ID - in real app, get from auth
      const userId = 'mock-user-id';

      const rules = await db.select()
        .from(autotagRules)
        .where(eq(autotagRules.userId, userId))
        .orderBy(desc(autotagRules.createdAt));

      res.json({
        success: true,
        data: rules
      });
    } catch (error) {
      console.error('Get autotag rules error:', error);
      res.status(500).json({ error: 'Failed to retrieve auto-tag rules' });
    }
  });

  app.post('/api/autotag/rules', async (req, res) => {
    try {
      // Mock user ID - in real app, get from auth
      const userId = 'mock-user-id';
      const ruleData = req.body;

      const newRule = await db.insert(autotagRules).values({
        userId,
        name: ruleData.name,
        status: ruleData.status || 'active',
        searchCriteria: ruleData.searchCriteria,
        applyCriteria: ruleData.applyCriteria,
        performanceData: ruleData.performanceData || {}
      }).returning();

      res.json({
        success: true,
        data: newRule[0],
        message: 'Auto-tag rule created successfully'
      });
    } catch (error) {
      console.error('Create autotag rule error:', error);
      res.status(500).json({ error: 'Failed to create auto-tag rule' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

// Helper functions - AES-256-CBC Encryption
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
const ALGORITHM = 'aes-256-cbc';

function encryptToken(token: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt token');
  }
}

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

async function processWebhookEvent(eventData: any) {
  try {
    const eventType = eventData.data.attributes.eventType;
    const transactionId = eventData.data.relationships?.transaction?.data?.id;

    console.log(`🔔 Processing webhook event: ${eventType} for transaction ${transactionId}`);

    // Only process transaction-related events
    if (!transactionId || eventType === 'PING') {
      console.log('⏭️  Skipping non-transaction event');
      return;
    }

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
      console.error('❌ No UP Bank token found, cannot process webhook');
      return;
    }

    // Fetch fresh transaction data from UP Bank
    const upBankClient = new UpBankApiClient(upBankToken);
    const txnResponse = await upBankClient.getTransaction(transactionId);
    const txn = txnResponse.data;

    console.log(`📥 Fetched transaction ${transactionId} from UP Bank`);

    // Fetch accounts mapping for proper account names
    const accountsResponse = await upBankClient.getAccounts();
    const accountsMap = new Map<string, { name: string; type: string }>();

    for (const acc of accountsResponse.data) {
      const accountType = acc.attributes.accountType;
      let emoji = '🏦';
      if (accountType === 'SAVER') {
        emoji = '💰';
      } else if (accountType === 'TRANSACTIONAL') {
        emoji = '🏦';
      }

      accountsMap.set(acc.id, {
        name: `Up-${emoji} ${acc.attributes.displayName}`,
        type: accountType
      });
    }

    // Check if transaction exists in local DB
    const existing = await db.select()
      .from(transactions)
      .where(eq(transactions.upTransactionId, transactionId))
      .limit(1);

    const accountId = txn.relationships?.account?.data?.id || null;
    const accountInfo = accountId ? accountsMap.get(accountId) : null;

    const transactionData = {
      upTransactionId: txn.id,
      accountId: accountId,
      amount: txn.attributes.amount.valueInBaseUnits / 100,
      date: new Date(txn.attributes.createdAt),
      description: txn.attributes.description || txn.attributes.rawText || 'No description',
      category: txn.relationships?.category?.data?.id || 'uncategorized',
      tags: txn.relationships?.tags?.data?.map((t: any) => t.id).join(',') || '',
      type: txn.attributes.amount.valueInBaseUnits > 0 ? 'credit' : 'debit',
      status: txn.attributes.status || 'SETTLED',
      rawData: txn,
      syncStatus: 'synced',
      source: 'up_bank',
      account: accountInfo?.name || 'UP Bank',
      updatedAt: new Date()
    };

    if (existing.length > 0) {
      // Update existing transaction
      await db.update(transactions)
        .set(transactionData)
        .where(eq(transactions.upTransactionId, transactionId));
      console.log(`✅ Updated transaction ${transactionId} from webhook`);
    } else {
      // Insert new transaction
      await db.insert(transactions).values({
        ...transactionData,
        userId: userId,
        createdAt: new Date()
      });
      console.log(`✅ Created transaction ${transactionId} from webhook`);
    }

    // Mark webhook as processed
    await db.update(webhookEvents)
      .set({
        processed: true,
        processedAt: new Date()
      })
      .where(eq(webhookEvents.upTransactionId, transactionId));

  } catch (error) {
    console.error('❌ Error processing webhook event:', error);

    // Store error in webhook event
    try {
      const transactionId = eventData.data.relationships?.transaction?.data?.id;
      if (transactionId) {
        await db.update(webhookEvents)
          .set({
            error: error instanceof Error ? error.message : 'Unknown error',
            processedAt: new Date()
          })
          .where(eq(webhookEvents.upTransactionId, transactionId));
      }
    } catch (dbError) {
      console.error('Failed to update webhook error:', dbError);
    }
  }
}
