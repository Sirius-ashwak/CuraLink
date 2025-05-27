import express, { Request, Response } from 'express';
import { documentProcessing } from '../services/documentProcessing';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const router = express.Router();

// Set up multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Store uploads in a temporary directory
      const tempDir = path.join(os.tmpdir(), 'document-uploads');
      
      // Ensure directory exists
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      cb(null, tempDir);
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: {
    fileSize: 15 * 1024 * 1024 // Limit to 15 MB
  }
});

/**
 * POST /api/document-processing/upload/:patientId
 * Upload and process a medical document
 */
router.post('/upload/:patientId', authMiddleware, upload.single('document'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { patientId } = req.params;
    const documentType = req.body.documentType as 'medicalForm' | 'medicalReport' | 'prescription' | 'labReport';
    
    if (!documentType) {
      return res.status(400).json({ error: 'Document type is required' });
    }
    
    // Process the document
    const processedDocument = await documentProcessing.processDocument(patientId, req.file.path, documentType);
    
    // Clean up the temporary file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temporary file:', err);
    });
    
    res.json(processedDocument);
  } catch (error) {
    console.error('Error processing document:', error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

/**
 * POST /api/document-processing/categorize
 * Categorize a document automatically
 */
router.post('/categorize', authMiddleware, upload.single('document'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Categorize the document
    const category = await documentProcessing.categorizeDocument(req.file.path);
    
    // Clean up the temporary file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temporary file:', err);
    });
    
    res.json({ category });
  } catch (error) {
    console.error('Error categorizing document:', error);
    res.status(500).json({ error: 'Failed to categorize document' });
  }
});

/**
 * GET /api/document-processing/patient/:patientId
 * Get all documents for a patient
 */
router.get('/patient/:patientId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const documents = await documentProcessing.getPatientDocuments(patientId);
    res.json(documents);
  } catch (error) {
    console.error('Error getting patient documents:', error);
    res.status(500).json({ error: 'Failed to get patient documents' });
  }
});

export default router;