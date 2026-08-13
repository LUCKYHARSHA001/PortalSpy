import { Queue, Worker } from 'bullmq';
import { redisOptions } from '../config/redis.js';
import { runPortalScrape } from '../services/scraperService.js';
import { sendWhatsappNotification } from '../services/whatsappService.js';
import Portal from '../models/Portal.js';

let scrapeQueue = null;
let whatsappQueue = null;

export const initQueues = () => {
  try {
    // 1. Scrape Queue setup
    scrapeQueue = new Queue('scrapeQueue', { connection: redisOptions });

    const scrapeWorker = new Worker(
      'scrapeQueue',
      async (job) => {
        const { portalId } = job.data;
        console.log(`⚙️ [Scrape Worker] Processing job for portal ID: ${portalId}`);
        const portal = await Portal.findById(portalId);
        if (portal && portal.status === 'ACTIVE') {
          await runPortalScrape(portal);
        }
      },
      { connection: redisOptions, concurrency: 3 }
    );

    scrapeWorker.on('completed', (job) => console.log(`✅ [Scrape Worker] Job ${job.id} completed.`));
    scrapeWorker.on('failed', (job, err) => console.error(`❌ [Scrape Worker] Job ${job?.id} failed: ${err.message}`));

    // 2. WhatsApp Queue setup (FR-3.2 Rate Limiting: 3-6s randomized delays)
    whatsappQueue = new Queue('whatsappQueue', { connection: redisOptions });

    const whatsappWorker = new Worker(
      'whatsappQueue',
      async (job) => {
        const { payload } = job.data;
        
        // Randomized delay between 3,000ms and 6,000ms (3-6s anti-spam delay)
        const delayMs = Math.floor(Math.random() * (6000 - 3000 + 1)) + 3000;
        console.log(`⏳ [WhatsApp Worker] Enforcing anti-spam delay of ${(delayMs / 1000).toFixed(1)}s before dispatching...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));

        await sendWhatsappNotification(payload);
      },
      { connection: redisOptions, concurrency: 1 } // Serialized processing to respect rate limits
    );

    whatsappWorker.on('completed', (job) => console.log(`✅ [WhatsApp Worker] Dispatch ${job.id} completed.`));
    whatsappWorker.on('failed', (job, err) => console.error(`❌ [WhatsApp Worker] Dispatch ${job?.id} failed: ${err.message}`));

    console.log('⚡ [Queue Engine] BullMQ Scrape and WhatsApp Queues Initialized successfully.');
  } catch (err) {
    console.warn('⚠️ BullMQ Queue initialization notice:', err.message);
  }
};

export const addScrapeJob = async (portalId, portalUrl, intervalHours) => {
  if (!scrapeQueue) {
    // Direct fallback if Redis isn't attached
    const portal = await Portal.findById(portalId);
    if (portal) runPortalScrape(portal).catch(e => console.error(e.message));
    return;
  }

  await scrapeQueue.add(
    `scrape_${portalId}`,
    { portalId, portalUrl },
    {
      repeat: {
        every: intervalHours * 60 * 60 * 1000 // Repeat every X hours
      },
      jobId: `repeat_${portalId}`
    }
  );
};

export const addWhatsappJob = async (payload) => {
  if (!whatsappQueue) {
    // Direct dispatch fallback
    sendWhatsappNotification(payload).catch(e => console.error(e.message));
    return;
  }

  await whatsappQueue.add('send_whatsapp_alert', { payload });
};
