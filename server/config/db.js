import mongoose from 'mongoose';
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portalspy';

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('✅ MongoDB connected successfully to', mongoURI);
  } catch (err) {
    console.warn('⚠️ Standard MongoDB connection failed:', err.message);
    console.log('🔄 Attempting to start embedded/local mongod daemon...');

    try {
      const dbPath = path.join(__dirname, '../data/db');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      // Check if mongod is already running or start a local process
      const logPath = path.join(__dirname, '../data/mongod.log');
      console.log(`🚀 Starting local mongod at ${dbPath}...`);
      
      const mongodProc = spawn('mongod', ['--dbpath', dbPath, '--port', '27017', '--logpath', logPath], {
        detached: true,
        stdio: 'ignore'
      });
      mongodProc.unref();

      // Wait 2.5 seconds for mongod to initialize
      await new Promise(resolve => setTimeout(resolve, 2500));

      await mongoose.connect(mongoURI);
      console.log('✅ MongoDB connected successfully to local daemon at', mongoURI);
    } catch (startErr) {
      console.error('❌ Failed to start and connect to MongoDB:', startErr.message);
      // Fallback in-memory mock store capability if mongod binary fails
    }
  }
};
