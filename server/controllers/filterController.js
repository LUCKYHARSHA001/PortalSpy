import Filter from '../models/Filter.js';
import User from '../models/User.js';
import { addWhatsappJob } from '../queues/queueManager.js';

export const getFilters = async (req, res) => {
  try {
    let filter = await Filter.findOne({ userId: req.user.id });
    if (!filter) {
      filter = await Filter.create({
        userId: req.user.id,
        includeTerms: ['React', 'Frontend', 'Software Engineer'],
        excludeTerms: ['Senior Lead', 'Director'],
        locations: ['Remote', 'India']
      });
    }
    res.json({ filter });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching filter settings.' });
  }
};

export const updateFilters = async (req, res) => {
  try {
    const { includeTerms, excludeTerms, locations } = req.body;

    let filter = await Filter.findOne({ userId: req.user.id });
    if (!filter) {
      filter = new Filter({ userId: req.user.id });
    }

    if (Array.isArray(includeTerms)) filter.includeTerms = includeTerms.map(t => t.trim()).filter(Boolean);
    if (Array.isArray(excludeTerms)) filter.excludeTerms = excludeTerms.map(t => t.trim()).filter(Boolean);
    if (Array.isArray(locations)) filter.locations = locations.map(t => t.trim()).filter(Boolean);

    await filter.save();

    // Notify user via WhatsApp on Filter Updated
    const user = await User.findById(req.user.id);
    if (user?.whatsappNumber) {
      addWhatsappJob({
        userPhone: user.whatsappNumber,
        company: 'Portalspy Engine',
        title: `Include: ${filter.includeTerms.join(', ') || 'None'} | Exclude: ${filter.excludeTerms.join(', ') || 'None'}`,
        location: filter.locations.join(', ') || 'Any',
        applyUrl: 'http://localhost:5173',
        eventType: 'FILTER_UPDATED'
      }).catch(err => console.warn('WhatsApp event dispatch warning:', err.message));
    }

    res.json({ message: 'Filter settings updated successfully.', filter });
  } catch (err) {
    res.status(500).json({ message: 'Error updating filter settings.' });
  }
};
