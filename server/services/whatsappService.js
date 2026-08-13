import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let client = null;
let currentQrCodeDataUrl = null;
let connectionStatus = 'DISCONNECTED'; // DISCONNECTED, INITIALIZING, QR_READY, CONNECTED

export const getWhatsappStatus = () => {
  return {
    status: connectionStatus,
    qrCode: currentQrCodeDataUrl
  };
};

export const initWhatsappService = async () => {
  try {
    console.log('📱 [WhatsApp Service] Initializing LocalAuth WhatsApp Web client...');
    connectionStatus = 'INITIALIZING';

    // Remove any stale Chrome SingletonLock if left over from previous process crash
    const lockPath = path.join(__dirname, '../.wwebjs_auth/session/SingletonLock');
    try {
      if (fs.existsSync(lockPath) || fs.lstatSync(lockPath).isSymbolicLink()) {
        fs.unlinkSync(lockPath);
        console.log('🧹 [WhatsApp Service] Cleaned up stale Chromium SingletonLock.');
      }
    } catch (lockErr) {
      // Ignore if doesn't exist
    }

    client = new Client({
      authStrategy: new LocalAuth({
        dataPath: path.join(__dirname, '../.wwebjs_auth')
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      }
    });

    client.on('qr', async (qr) => {
      console.log('⚡ [WhatsApp Service] QR Code received. Scan with your phone.');
      connectionStatus = 'QR_READY';
      try {
        currentQrCodeDataUrl = await qrcode.toDataURL(qr);
      } catch (err) {
        console.error('QR Code render error:', err);
      }
    });

    client.on('ready', () => {
      console.log('✅ [WhatsApp Service] WhatsApp Client is CONNECTED and READY!');
      connectionStatus = 'CONNECTED';
      currentQrCodeDataUrl = null;
    });

    client.on('authenticated', () => {
      console.log('🔐 [WhatsApp Service] Authenticated successfully with saved LocalAuth session.');
    });

    client.on('auth_failure', (msg) => {
      console.error('❌ [WhatsApp Service] Authentication failed:', msg);
      connectionStatus = 'DISCONNECTED';
    });

    client.on('disconnected', (reason) => {
      console.warn('⚠️ [WhatsApp Service] Client disconnected:', reason);
      connectionStatus = 'DISCONNECTED';
    });

    client.initialize().catch(err => {
      console.warn('⚠️ WhatsApp client init non-blocking warn:', err.message);
      // Fallback mode enabled when puppeteer browser isn't interactive
      connectionStatus = 'SIMULATION_MODE';
    });

  } catch (err) {
    console.warn('⚠️ WhatsApp Service initialization warning:', err.message);
    connectionStatus = 'SIMULATION_MODE';
  }
};

/**
 * Format and dispatch rich WhatsApp alert payload (FR-3.1)
 */
export const sendWhatsappNotification = async ({ userPhone, company, title, location, applyUrl, isWelcome }) => {
  let formattedMessage = '';

  if (isWelcome) {
    formattedMessage = 
`🎯 *PORTALSPY NOTIFICATION ENGINE ACTIVATED* 🚀

✅ *WhatsApp Number Linked Successfully!*
📱 *Linked Phone:* ${userPhone}

You will now receive instant automated alerts whenever new job openings matching your keyword & location filters are discovered across tracked career portals.

🔗 *Dashboard:* ${applyUrl || 'http://localhost:5173'}

_Automated by Portalspy Engine_`;
  } else {
    formattedMessage = 
`🎯 *PORTALSPY NEW JOB ALERT* 🚀

🏢 *Company:* ${company}
💼 *Role:* ${title}
📍 *Location:* ${location}

🔗 *Apply Direct:* ${applyUrl}

_Tracked automatically by Portalspy_`;
  }

  console.log(`💬 [WhatsApp Dispatch] Sending ${isWelcome ? 'Welcome notification' : 'Job Alert'} to ${userPhone}...`);

  if (connectionStatus === 'CONNECTED' && client) {
    try {
      // Format number for whatsapp-web.js (e.g., 919876543210@c.us)
      const cleanNumber = userPhone.replace(/[^\d]/g, '');
      const chatId = `${cleanNumber}@c.us`;
      await client.sendMessage(chatId, formattedMessage);
      console.log(`✅ [WhatsApp Dispatch] Message delivered to ${chatId}`);
      return { success: true, mode: 'REAL' };
    } catch (err) {
      console.error(`❌ [WhatsApp Dispatch] Real dispatch failed: ${err.message}`);
    }
  }

  // Simulation log when not live connected
  console.log(`ℹ️ [WhatsApp Simulation Mode Dispatch]\n-------------------------------\nTO: ${userPhone}\n${formattedMessage}\n-------------------------------`);
  return { success: true, mode: 'SIMULATED' };
};

/**
 * Reset WhatsApp session and clear LocalAuth session files to generate a fresh QR code
 */
export const resetWhatsappSession = async () => {
  console.log('🔄 [WhatsApp Service] Resetting WhatsApp Web session & clearing LocalAuth...');
  connectionStatus = 'INITIALIZING';
  currentQrCodeDataUrl = null;

  try {
    if (client) {
      try {
        await client.logout();
      } catch (e) {
        // Ignore logout error if session unlinked
      }
      try {
        await client.destroy();
      } catch (e) {
        // Ignore destroy error
      }
      client = null;
      // Allow Chromium processes to release file locks
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  } catch (err) {
    console.warn('WhatsApp client cleanup warning:', err.message);
  }

  // Remove .wwebjs_auth folder to force new QR generation
  const authDir = path.join(__dirname, '../.wwebjs_auth');
  try {
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
      console.log('🧹 [WhatsApp Service] Removed .wwebjs_auth session storage.');
    }
  } catch (rmErr) {
    console.warn('Cleanup .wwebjs_auth warning:', rmErr.message);
  }

  // Re-initialize WhatsApp service to generate a fresh QR Code
  await initWhatsappService();
  return { success: true };
};
