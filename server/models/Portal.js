import mongoose from 'mongoose';

const PortalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyName: { type: String, required: true },
  portalUrl: { type: String, required: true },
  checkIntervalHours: { type: Number, default: 6 },
  status: { type: String, enum: ['ACTIVE', 'PAUSED', 'NEEDS_REVIEW'], default: 'ACTIVE' },
  consecutiveFailures: { type: Number, default: 0 },
  lastCheckedAt: { type: Date }
});

export default mongoose.model('Portal', PortalSchema);
