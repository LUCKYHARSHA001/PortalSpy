import Filter from '../models/Filter.js';

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
    res.json({ message: 'Filter settings updated successfully.', filter });
  } catch (err) {
    res.status(500).json({ message: 'Error updating filter settings.' });
  }
};
