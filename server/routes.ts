import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import {
  settings,
  transactions,
  autotagRules,
  webhookEvents,
  syncQueue,
  apiLogs
} from "@shared/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { UpBankApiClient } from './UpBankApiClient';

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

      // Fetch transactions with pagination
      let allNewTransactions: any[] = [];
      let nextPageUrl: string | null = null;
      let newCount = 0;
      let updatedCount = 0;

      do {
        const response = await upBankClient.getTransactions({
          pageSize: 100,
          since: settingsMap.lastSync // Only fetch new transactions
        });

        for (const txn of response.data) {
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
              description: txn.attributes.rawText || txn.attributes.description || 'No description',
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

        allNewTransactions.push(...response.data);
        nextPageUrl = response.links?.next || null;

        // Safety: don't fetch more than 500 transactions in one sync
        if (allNewTransactions.length >= 500) break;
      } while (nextPageUrl);

      // Update last sync timestamp
      const now = new Date().toISOString();
      const lastSyncSetting = await db.select()
        .from(settings)
        .where(and(
          eq(settings.userId, userId),
          eq(settings.key, 'last_transaction_sync')
        ))
        .limit(1);

      if (lastSyncSetting.length > 0) {
        await db.update(settings)
          .set({ valueText: now, updatedAt: new Date() })
          .where(and(
            eq(settings.userId, userId),
            eq(settings.key, 'last_transaction_sync')
          ));
      } else {
        await db.insert(settings).values({
          userId,
          key: 'last_transaction_sync',
          valueText: now,
          valueEncrypted: null,
          updatedAt: new Date()
        });
      }

      res.json({
        success: true,
        data: {
          newTransactions: newCount,
          updatedTransactions: updatedCount,
          totalFetched: allNewTransactions.length,
          lastSync: now
        },
        message: `Synced ${newCount} new and ${updatedCount} updated transactions`
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

      // Update local database
      const updated = await db.update(transactions)
        .set(updateData)
        .where(eq(transactions.id, id))
        .returning();

      // If this is an UP Bank transaction, sync changes back to UP Bank
      if (transaction.upTransactionId) {
        try {
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

          if (upBankToken) {
            const upBankClient = new UpBankApiClient(upBankToken);

            // Sync category change to UP Bank
            if (category !== undefined && category !== 'uncategorized') {
              // Validate that this is not a parent category
              const categoriesResponse = await upBankClient.getCategories();
              const categoryObj = categoriesResponse.data.find((c: any) => c.id === category);

              if (categoryObj?.relationships?.parent?.data === null) {
                throw new Error(`Cannot assign parent category "${category}". Please select a child category instead.`);
              }

              await upBankClient.updateTransactionCategory(transaction.upTransactionId, category);
            }

            // Sync tags change to UP Bank
            if (tags !== undefined) {
              const oldTags = transaction.tags ? transaction.tags.split(',').filter(Boolean) : [];
              const newTags = tags.split(',').filter(Boolean);
              await upBankClient.updateTransactionTags(transaction.upTransactionId, newTags, oldTags);
            }

            console.log(`✅ Synced transaction ${id} changes to UP Bank`);
          }
        } catch (syncError) {
          console.error('Failed to sync to UP Bank:', syncError);
          // Don't fail the request if UP Bank sync fails
        }
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

      for (const row of csvTransactions) {
        try {
          // Map CSV columns to transaction fields
          const amount = Number(row[mapping.amount] || row.Amount || 0);
          const date = new Date(row[mapping.date] || row.Date);
          const description = row[mapping.merchant] || row[mapping.description] || row.Merchant || 'Imported';
          const category = row[mapping.category] || row.Category || 'uncategorized';
          const tags = row[mapping.tags] || row.Tags || '';
          const account = row[mapping.account] || row.Account || 'Imported';

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
            syncStatus: 'synced',
            createdAt: new Date(),
            updatedAt: new Date()
          }).returning();

          imported.push(newTxn[0]);
        } catch (error) {
          errors.push({
            row,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

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

  // Enhanced transactions endpoint with UP Bank integration
  app.get('/api/transactions', async (req, res) => {
    try {
      const { limit = 50, offset = 0, account, category, dateFrom, dateTo } = req.query;

      let query = db.select().from(transactions).orderBy(desc(transactions.date));

      // Add filters
      const conditions = [];
      if (account) conditions.push(eq(transactions.account, account as string));
      if (category) conditions.push(eq(transactions.category, category as string));
      if (dateFrom) conditions.push(gte(transactions.date, new Date(dateFrom as string)));
      if (dateTo) conditions.push(lte(transactions.date, new Date(dateTo as string)));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query.limit(parseInt(limit as string)).offset(parseInt(offset as string));

      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Failed to retrieve transactions' });
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

// Helper functions
function encryptToken(token: string): string {
  // TODO: Implement proper encryption
  // For now, just base64 encode (NOT SECURE - implement proper encryption)
  return Buffer.from(token).toString('base64');
}

function decryptToken(encryptedToken: string): string {
  // TODO: Implement proper decryption
  return Buffer.from(encryptedToken, 'base64').toString('utf-8');
}

async function processWebhookEvent(eventData: any) {
  // TODO: Implement webhook event processing
  // 1. Fetch transaction details from UP Bank
  // 2. Update local database
  // 3. Apply auto-tag rules if enabled
  // 4. Handle transfer detection
  console.log('Processing webhook event:', eventData.data.attributes.eventType);
}
