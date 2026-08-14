import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/api.js';
import { connectDB } from './config/db.js';
import { initQueues } from './queues/queueManager.js';
import { initWhatsappService } from './services/whatsappService.js';


const app = express();
const PORT = process.env.PORT || 5000;

// CORS Middleware setup
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount API Router
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'Portalspy API Server', timestamp: new Date() });
});

// Boot Server Procedure
const startServer = async () => {
  console.log('🚀 Booting Portalspy Backend Engine v2.0...');

  // 1. Connect MongoDB Database
  await connectDB();

  // 2. Initialize Redis Queues
  initQueues();

  // 3. Initialize WhatsApp Engine asynchronously
  initWhatsappService().catch(err => console.warn('WhatsApp Init Warn:', err.message));

  app.listen(PORT, () => {
    console.log(`🎯 Portalspy API Server running at http://localhost:${PORT}`);
  });
};

startServer().catch(err => {
  console.error('Fatal Server Boot Error:', err);
});
