import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 5000;

// Create uploads directory if it doesn't exist
const uploadsDir = join(__dirname, '../uploads');
await fs.mkdir(uploadsDir, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());

// Log upload details
async function logUpload(ehrSystem, filename) {
  const logPath = join(uploadsDir, 'logs.txt');
  const logEntry = `[${new Date().toISOString()}] File: ${filename}, EHR System: ${ehrSystem}\n`;
  
  try {
    await fs.appendFile(logPath, logEntry);
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
}

// Upload route
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const ehrSystem = req.body.ehrSystem || 'Unknown';
    
    // Log the upload
    await logUpload(ehrSystem, req.file.filename);

    res.json({
      message: 'File uploaded successfully',
      filename: req.file.filename,
      ehrSystem
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});