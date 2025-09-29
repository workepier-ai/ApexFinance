import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from 'multer';
import path from 'path';

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

  const httpServer = createServer(app);

  return httpServer;
}
