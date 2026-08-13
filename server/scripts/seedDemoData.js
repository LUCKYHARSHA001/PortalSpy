import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Portal from '../models/Portal.js';
import Filter from '../models/Filter.js';
import JobAlert from '../models/JobAlert.js';
import { generateJobHash } from '../services/scraperService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seed = async () => {
  console.log('🌱 Seeding Portalspy Demo Data...');
  await connectDB();

  // 1. Create or fetch Demo User
  let user = await User.findOne({ email: 'demo@portalspy.io' });
  if (!user) {
    const passwordHash = await bcrypt.hash('password123', 12);
    user = await User.create({
      email: 'demo@portalspy.io',
      passwordHash,
      whatsappNumber: '+919876543210',
      isVerified: true
    });
    console.log('👤 Created Demo User: demo@portalspy.io / password123');
  }

  // 2. Clear old demo data for clean state
  await Portal.deleteMany({ userId: user._id });
  await Filter.deleteMany({ userId: user._id });
  await JobAlert.deleteMany({ userId: user._id });

  // 3. Create Sample Portals
  const p1 = await Portal.create({
    userId: user._id,
    companyName: 'Stripe',
    portalUrl: 'https://boards.greenhouse.io/stripe',
    checkIntervalHours: 6,
    status: 'ACTIVE',
    consecutiveFailures: 0,
    lastCheckedAt: new Date(Date.now() - 30 * 60 * 1000)
  });

  const p2 = await Portal.create({
    userId: user._id,
    companyName: 'Linear App',
    portalUrl: 'https://jobs.lever.co/linear',
    checkIntervalHours: 1,
    status: 'ACTIVE',
    consecutiveFailures: 0,
    lastCheckedAt: new Date(Date.now() - 10 * 60 * 1000)
  });

  const p3 = await Portal.create({
    userId: user._id,
    companyName: 'Netflix',
    portalUrl: 'https://netflix.wd1.myworkdayjobs.com/en-US/careers',
    checkIntervalHours: 12,
    status: 'PAUSED',
    consecutiveFailures: 0,
    lastCheckedAt: new Date(Date.now() - 4 * 3600 * 1000)
  });

  const p4 = await Portal.create({
    userId: user._id,
    companyName: 'Cloudflare',
    portalUrl: 'https://www.cloudflare.com/careers/jobs/invalid-test',
    checkIntervalHours: 24,
    status: 'NEEDS_REVIEW',
    consecutiveFailures: 3,
    lastCheckedAt: new Date(Date.now() - 15 * 60 * 1000)
  });

  console.log('🏢 Seeded 4 sample career portals (Greenhouse, Lever, Workday, Circuit Breaker).');

  // 4. Create Filter Settings
  await Filter.create({
    userId: user._id,
    includeTerms: ['React', 'Frontend', 'Software Engineer', 'Fullstack', 'Node'],
    excludeTerms: ['Senior Lead', 'Director', 'Manager'],
    locations: ['Remote', 'India', 'San Francisco', 'Hybrid']
  });

  console.log('⚙️ Seeded filter configuration.');

  // 5. Create Sample Job Alerts
  const sampleJobs = [
    {
      portalId: p1._id,
      title: 'Frontend Engineer - Dashboard UI',
      location: 'Remote / US',
      url: 'https://boards.greenhouse.io/stripe/jobs/40192',
      status: 'NOTIFIED',
      agoHours: 0.5
    },
    {
      portalId: p2._id,
      title: 'Software Engineer - Product Systems',
      location: 'Remote',
      url: 'https://jobs.lever.co/linear/890123',
      status: 'APPLIED',
      agoHours: 2
    },
    {
      portalId: p1._id,
      title: 'React Core Platform Developer',
      location: 'Hybrid / India',
      url: 'https://boards.greenhouse.io/stripe/jobs/40899',
      status: 'SAVED',
      agoHours: 5
    },
    {
      portalId: p3._id,
      title: 'Fullstack Engineer - Streaming Web Engine',
      location: 'Remote / India',
      url: 'https://netflix.wd1.myworkdayjobs.com/en-US/careers/job/1092',
      status: 'NOTIFIED',
      agoHours: 12
    }
  ];

  for (const item of sampleJobs) {
    const hash = generateJobHash('Stripe/Linear/Netflix', item.title, item.url);
    await JobAlert.create({
      portalId: item.portalId,
      userId: user._id,
      jobTitle: item.title,
      jobLocation: item.location,
      applyUrl: item.url,
      jobHash: hash,
      status: item.status,
      sentAt: new Date(Date.now() - item.agoHours * 3600 * 1000)
    });
  }

  console.log('🔔 Seeded sample job alert records.');
  console.log('✅ Demo seeding completed successfully!');

  await mongoose.disconnect();
};

seed().catch(err => {
  console.error('Seed Error:', err);
  process.exit(1);
});
