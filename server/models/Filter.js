import mongoose from 'mongoose';

const FilterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  includeTerms: [{ type: String }],
  excludeTerms: [{ type: String }],
  locations: [{ type: String }]
});

export default mongoose.model('Filter', FilterSchema);
