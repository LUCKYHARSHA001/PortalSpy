import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import DashboardStats from './components/DashboardStats';
import PortalManager from './components/PortalManager';
import FilterConfig from './components/FilterConfig';
import WhatsappSetup from './components/WhatsappSetup';
import AlertHistory from './components/AlertHistory';
import AuthModal from './components/AuthModal';

// Configure default axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
axios.defaults.withCredentials = true;

export default function App() {
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState({ status: 'SIMULATION_MODE', qrCode: null });
  const [stats, setStats] = useState({ totalPortals: 4, activePortals: 2, needsReviewPortals: 1, totalAlerts: 4, alertsToday: 2 });
  const [portals, setPortals] = useState([]);
  const [filter, setFilter] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize App State
  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(fetchWhatsappStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchInitialData = async () => {
    try {
      // 1. Check current logged-in user
      const meRes = await axios.get('/auth/me').catch(() => null);
      if (meRes?.data?.user) {
        setUser(meRes.data.user);
        await refreshDashboardData();
      } else {
        // Auto demo login fallback for seamless preview
        const demoLogin = await axios.post('/auth/login', { email: 'demo@portalspy.io', password: 'password123' }).catch(() => null);
        if (demoLogin?.data?.user) {
          setUser(demoLogin.data.user);
          await refreshDashboardData();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboardData = async () => {
    try {
      const [statsRes, portalsRes, filtersRes, alertsRes] = await Promise.all([
        axios.get('/dashboard/stats').catch(() => ({ data: { stats: {} } })),
        axios.get('/portals').catch(() => ({ data: { portals: [] } })),
        axios.get('/filters').catch(() => ({ data: { filter: null } })),
        axios.get('/alerts').catch(() => ({ data: { alerts: [] } }))
      ]);

      if (statsRes.data?.stats) setStats(statsRes.data.stats);
      if (portalsRes.data?.portals) setPortals(portalsRes.data.portals);
      if (filtersRes.data?.filter) setFilter(filtersRes.data.filter);
      if (alertsRes.data?.alerts) setAlerts(alertsRes.data.alerts);
    } catch (err) {
      console.warn('Dashboard sync error:', err.message);
    }
  };

  const fetchWhatsappStatus = async () => {
    try {
      const res = await axios.get('/user/whatsapp-status');
      if (res.data) setWhatsappStatus(res.data);
    } catch (err) {
      // Silently handle if standby
    }
  };

  // Auth Handlers
  const handleLogin = async ({ email, password }) => {
    const res = await axios.post('/auth/login', { email, password });
    setUser(res.data.user);
    await refreshDashboardData();
  };

  const handleRegister = async ({ email, password, whatsappNumber }) => {
    const res = await axios.post('/auth/register', { email, password, whatsappNumber });
    setUser(res.data.user);
    await refreshDashboardData();
  };

  const handleGoogleLogin = async (googleAuthData) => {
    const res = await axios.post('/auth/google', googleAuthData);
    setUser(res.data.user);
    await refreshDashboardData();
  };

  const handleLogout = async () => {
    await axios.post('/auth/logout').catch(() => null);
    setUser(null);
    setPortals([]);
    setAlerts([]);
    setStats({ totalPortals: 0, activePortals: 0, needsReviewPortals: 0, totalAlerts: 0, alertsToday: 0 });
  };

  // Portal Handlers
  const handleAddPortal = async (newPortalData) => {
    await axios.post('/portals', newPortalData);
    await refreshDashboardData();
  };

  const handleUpdatePortal = async (portalId, updateData) => {
    await axios.put(`/portals/${portalId}`, updateData);
    await refreshDashboardData();
  };

  const handleDeletePortal = async (portalId) => {
    await axios.delete(`/portals/${portalId}`);
    await refreshDashboardData();
  };

  const handleTriggerScrape = async (portalId) => {
    await axios.post(`/portals/${portalId}/trigger`);
    await refreshDashboardData();
  };

  const handleResetCircuitBreaker = async (portalId) => {
    if (portalId) {
      await axios.post(`/portals/${portalId}/reset-circuit`);
    } else {
      // Reset all review portals
      const reviewPortals = portals.filter(p => p.status === 'NEEDS_REVIEW');
      for (const p of reviewPortals) {
        await axios.post(`/portals/${p._id}/reset-circuit`);
      }
    }
    await refreshDashboardData();
  };

  // Filter Handlers
  const handleSaveFilters = async (filterData) => {
    await axios.put('/filters', filterData);
    await refreshDashboardData();
  };

  // WhatsApp Handlers
  const handleUpdatePhone = async (whatsappNumber) => {
    const res = await axios.post('/auth/whatsapp-number', { whatsappNumber });
    setUser(res.data.user);
  };

  const handleTestNotification = async () => {
    try {
      await axios.post('/alerts/test');
    } catch (err) {
      if (alerts.length > 0) {
        await axios.post(`/alerts/${alerts[0]._id}/resend`);
      } else {
        throw err;
      }
    }
    await refreshDashboardData();
  };

  const handleResetWhatsappSession = async () => {
    await axios.post('/user/whatsapp-reset');
    await fetchWhatsappStatus();
  };

  // Alert Handlers
  const handleUpdateAlertStatus = async (alertId, status) => {
    await axios.put(`/alerts/${alertId}/status`, { status });
    await refreshDashboardData();
  };

  const handleResendWhatsapp = async (alertId) => {
    await axios.post(`/alerts/${alertId}/resend`);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="logo-icon" style={{ margin: '0 auto 1rem auto', width: '48px', height: '48px' }}>🚀</div>
          <h2 style={{ fontFamily: 'var(--font-heading)' }}>Loading Portalspy Architecture...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        user={user}
        whatsappStatus={whatsappStatus}
        onLogout={handleLogout}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <main className="dashboard-container">
        {/* Metric Overview Tiles & Circuit Breaker Warning */}
        <DashboardStats stats={stats} onResetCircuit={() => handleResetCircuitBreaker()} />

        {/* Tracked Portals Management */}
        <PortalManager
          portals={portals}
          onAddPortal={handleAddPortal}
          onUpdatePortal={handleUpdatePortal}
          onDeletePortal={handleDeletePortal}
          onTriggerScrape={handleTriggerScrape}
          onResetCircuit={handleResetCircuitBreaker}
        />

        {/* Filters and WhatsApp Setup Side-by-Side */}
        <div className="grid-2">
          <FilterConfig filter={filter} onSaveFilters={handleSaveFilters} />
          <WhatsappSetup
            user={user}
            whatsappStatus={whatsappStatus}
            onUpdatePhone={handleUpdatePhone}
            onTestNotification={handleTestNotification}
            onResetSession={handleResetWhatsappSession}
          />
        </div>

        {/* Live Alerts & Job Match Feed */}
        <AlertHistory
          alerts={alerts}
          onUpdateAlertStatus={handleUpdateAlertStatus}
          onResendWhatsapp={handleResendWhatsapp}
        />
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onGoogleLogin={handleGoogleLogin}
      />
    </div>
  );
}
