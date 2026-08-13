import JobAlert from '../models/JobAlert.js';
import Portal from '../models/Portal.js';
import { addWhatsappJob } from '../queues/queueManager.js';
import User from '../models/User.js';

export const getAlerts = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const query = { userId: req.user.id };
    if (status) query.status = status;

    const alerts = await JobAlert.find(query)
      .populate('portalId', 'companyName portalUrl')
      .sort({ sentAt: -1 })
      .limit(parseInt(limit, 10));

    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching job alerts.' });
  }
};

export const updateAlertStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['NOTIFIED', 'APPLIED', 'SAVED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const alert = await JobAlert.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { status },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found.' });
    }

    res.json({ message: 'Alert status updated.', alert });
  } catch (err) {
    res.status(500).json({ message: 'Error updating alert status.' });
  }
};

export const resendWhatsappAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await JobAlert.findOne({ _id: id, userId: req.user.id }).populate('portalId', 'companyName');
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found.' });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.whatsappNumber) {
      return res.status(400).json({ message: 'No WhatsApp number configured.' });
    }

    await addWhatsappJob({
      userPhone: user.whatsappNumber,
      company: alert.portalId?.companyName || 'Company',
      title: alert.jobTitle,
      location: alert.jobLocation,
      applyUrl: alert.applyUrl
    });

    res.json({ message: `WhatsApp alert queued for dispatch to ${user.whatsappNumber}` });
  } catch (err) {
    res.status(500).json({ message: 'Error queuing WhatsApp notification.' });
  }
};

export const sendTestAlert = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.whatsappNumber) {
      return res.status(400).json({ message: 'No WhatsApp number configured. Please enter your 10-digit number and click Update Number first.' });
    }

    await addWhatsappJob({
      userPhone: user.whatsappNumber,
      company: 'Portalspy Engine',
      title: 'Senior Fullstack Engineer (Test Dispatch)',
      location: 'Remote / India',
      applyUrl: 'https://portalspy.io/jobs/test-alert-101'
    });

    res.json({ message: `Test WhatsApp alert queued for dispatch to ${user.whatsappNumber}` });
  } catch (err) {
    console.error('Send Test Alert Error:', err);
    res.status(500).json({ message: 'Error queuing test WhatsApp notification.' });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const totalPortals = await Portal.countDocuments({ userId });
    const activePortals = await Portal.countDocuments({ userId, status: 'ACTIVE' });
    const needsReviewPortals = await Portal.countDocuments({ userId, status: 'NEEDS_REVIEW' });
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const totalAlerts = await JobAlert.countDocuments({ userId });
    const alertsToday = await JobAlert.countDocuments({ userId, sentAt: { $gte: startOfDay } });

    res.json({
      stats: {
        totalPortals,
        activePortals,
        needsReviewPortals,
        totalAlerts,
        alertsToday
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching dashboard stats.' });
  }
};
