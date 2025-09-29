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
            // In real app, decrypt the token
            apiSettings.upBankToken = setting.valueEncrypted ? '***ENCRYPTED***' : '';
            break;
          case 'webhook_secret':
            apiSettings.webhookSecret = setting.valueEncrypted ? '***ENCRYPTED***' : '';
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
