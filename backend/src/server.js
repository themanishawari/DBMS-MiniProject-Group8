import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { testConnection } from './config/db.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import slaRoutes from './routes/slaRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import devRoutes from './routes/devRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// 1. CORS Configuration
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local development across Vite ports
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'Accept'],
  })
);

// 2. Request Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Request Logging Middleware
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// 4. Global Authentication Attachment
app.use(authenticate);

// 5. System Health Check
app.get('/api/v1/health', async (req, res) => {
  res.json({
    status: 'online',
    system: 'College Complaint Management System (CCMS) Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 6. Mount REST API Sub-routers
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/complaints`, complaintRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/departments`, departmentRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/sla-rules`, slaRoutes);
app.use(`${API_PREFIX}/audit-logs`, auditRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/dev`, devRoutes);

// 7. 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// 8. Server Bootstrapping & DB Connectivity Check
async function startServer() {
  console.log('='.repeat(70));
  console.log(' College Complaint Management System (CCMS) - Node.js Express Server');
  console.log('='.repeat(70));

  await testConnection();

  app.listen(PORT, () => {
    console.log(`[Server] CCMS REST API active and listening on: http://localhost:${PORT}`);
    console.log(`[Server] Base API Endpoint: http://localhost:${PORT}/api/v1`);
    console.log(`[Server] Health Check:     http://localhost:${PORT}/api/v1/health`);
    console.log('='.repeat(70));
  });
}

startServer();

export default app;
