import React from 'react';
import { Globe, ShieldAlert, Zap, Bell, CheckCircle2 } from 'lucide-react';

export default function DashboardStats({ stats, onResetCircuit }) {
  const { totalPortals = 0, activePortals = 0, needsReviewPortals = 0, totalAlerts = 0, alertsToday = 0 } = stats || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {needsReviewPortals > 0 && (
        <div className="banner-alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert size={22} color="#fb7185" />
            <div>
              <strong style={{ color: '#fff' }}>Circuit Breaker Alert!</strong>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                {needsReviewPortals} career portal(s) marked as <strong>NEEDS_REVIEW</strong> after 3 consecutive scraping failures.
              </p>
            </div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={onResetCircuit}>
            Review & Reset Status
          </button>
        </div>
      )}

      <div className="stats-grid">
        <div className="glass-panel stat-card" style={{ '--stat-accent': 'var(--accent-cyan)' }}>
          <div className="stat-header">
            <span>Tracked Career Portals</span>
            <Globe size={18} color="var(--accent-cyan)" />
          </div>
          <div className="stat-value">{totalPortals}</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {activePortals} actively automated
          </span>
        </div>

        <div className="glass-panel stat-card" style={{ '--stat-accent': 'var(--primary)' }}>
          <div className="stat-header">
            <span>Active Automated Scrapers</span>
            <Zap size={18} color="var(--primary)" />
          </div>
          <div className="stat-value">{activePortals}</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Intervals: 1h, 6h, 12h, 24h
          </span>
        </div>

        <div className="glass-panel stat-card" style={{ '--stat-accent': 'var(--accent-purple)' }}>
          <div className="stat-header">
            <span>New Matches Discovered Today</span>
            <Bell size={18} color="var(--accent-purple)" />
          </div>
          <div className="stat-value">{alertsToday}</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {totalAlerts} total match history
          </span>
        </div>

        <div className="glass-panel stat-card" style={{ '--stat-accent': 'var(--accent-amber)' }}>
          <div className="stat-header">
            <span>WhatsApp Queue Dispatches</span>
            <CheckCircle2 size={18} color="var(--accent-amber)" />
          </div>
          <div className="stat-value">{totalAlerts}</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            3-6s rate-limited dispatches
          </span>
        </div>
      </div>
    </div>
  );
}
