import Portal from '../models/Portal.js';
import { addScrapeJob } from '../queues/queueManager.js';
import { runPortalScrape } from '../services/scraperService.js';

export const getPortals = async (req, res) => {
  try {
    const portals = await Portal.find({ userId: req.user.id }).sort({ lastCheckedAt: -1, _id: -1 });
    res.json({ portals });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching portals.' });
  }
};

export const createPortal = async (req, res) => {
  try {
    const { companyName, portalUrl, checkIntervalHours } = req.body;

    if (!companyName || !portalUrl) {
      return res.status(400).json({ message: 'Company name and portal URL are required.' });
    }

    const interval = parseInt(checkIntervalHours || '6', 10);
    if (![1, 6, 12, 24].includes(interval)) {
      return res.status(400).json({ message: 'Allowed intervals are 1, 6, 12, or 24 hours.' });
    }

    const portal = await Portal.create({
      userId: req.user.id,
      companyName,
      portalUrl,
      checkIntervalHours: interval,
      status: 'ACTIVE',
      consecutiveFailures: 0
    });

    // Schedule initial background scrape job
    addScrapeJob(portal._id, portal.portalUrl, portal.checkIntervalHours).catch(err => {
      console.warn('Queue scheduling warning:', err.message);
    });

    res.status(201).json({ message: 'Portal added successfully.', portal });
  } catch (err) {
    res.status(500).json({ message: 'Error creating portal.' });
  }
};

export const updatePortal = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, portalUrl, checkIntervalHours, status } = req.body;

    const portal = await Portal.findOne({ _id: id, userId: req.user.id });
    if (!portal) {
      return res.status(404).json({ message: 'Portal not found.' });
    }

    if (companyName !== undefined) portal.companyName = companyName;
    if (portalUrl !== undefined) portal.portalUrl = portalUrl;
    if (checkIntervalHours !== undefined) {
      const interval = parseInt(checkIntervalHours, 10);
      if ([1, 6, 12, 24].includes(interval)) {
        portal.checkIntervalHours = interval;
      }
    }
    if (status !== undefined && ['ACTIVE', 'PAUSED', 'NEEDS_REVIEW'].includes(status)) {
      portal.status = status;
      if (status === 'ACTIVE') {
        portal.consecutiveFailures = 0;
      }
    }

    await portal.save();
    res.json({ message: 'Portal updated successfully.', portal });
  } catch (err) {
    res.status(500).json({ message: 'Error updating portal.' });
  }
};

export const deletePortal = async (req, res) => {
  try {
    const { id } = req.params;
    const portal = await Portal.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!portal) {
      return res.status(404).json({ message: 'Portal not found.' });
    }
    res.json({ message: 'Portal deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting portal.' });
  }
};

export const triggerScrape = async (req, res) => {
  try {
    const { id } = req.params;
    const portal = await Portal.findOne({ _id: id, userId: req.user.id });
    if (!portal) {
      return res.status(404).json({ message: 'Portal not found.' });
    }

    console.log(`⚡ Manual scrape triggered for portal: ${portal.companyName} (${portal.portalUrl})`);

    // Execute scrape directly or via task queue
    const results = await runPortalScrape(portal);

    res.json({
      message: `Manual scrape completed for ${portal.companyName}`,
      jobsExtracted: results.newJobsCount,
      alertsCreated: results.newAlertsCount,
      portal
    });
  } catch (err) {
    console.error('Trigger Scrape Error:', err);
    res.status(500).json({ message: 'Error executing manual scrape.', error: err.message });
  }
};

export const resetCircuitBreaker = async (req, res) => {
  try {
    const { id } = req.params;
    const portal = await Portal.findOne({ _id: id, userId: req.user.id });
    if (!portal) {
      return res.status(404).json({ message: 'Portal not found.' });
    }

    portal.consecutiveFailures = 0;
    portal.status = 'ACTIVE';
    await portal.save();

    res.json({ message: `Circuit breaker reset for ${portal.companyName}. Status set to ACTIVE.`, portal });
  } catch (err) {
    res.status(500).json({ message: 'Error resetting circuit breaker.' });
  }
};
