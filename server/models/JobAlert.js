import mongoose from 'mongoose';

const JobAlertSchema = new mongoose.Schema({
  portalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Portal', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobTitle: { type: String, required: true },
  jobLocation: { type: String, default: 'Remote' },
  applyUrl: { type: String, required: true },
  jobHash: { type: String, required: true, unique: true },
  status: { type: String, enum: ['NOTIFIED', 'APPLIED', 'SAVED'], default: 'NOTIFIED' },
  sentAt: { type: Date, default: Date.now }
});

export default mongoose.model('JobAlert', JobAlertSchema);
