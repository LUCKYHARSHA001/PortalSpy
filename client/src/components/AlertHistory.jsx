import React, { useState } from 'react';
import { Bell, ExternalLink, CheckCircle, Bookmark, Send, Clock, Building } from 'lucide-react';

export default function AlertHistory({ alerts, onUpdateAlertStatus, onResendWhatsapp }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const filteredAlerts = alerts.filter((item) => {
    if (filterStatus === 'ALL') return true;
    return item.status === filterStatus;
  });

  const handleResend = async (alertId) => {
    setActionLoadingId(alertId);
    try {
      await onResendWhatsapp(alertId);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div className="section-header">
        <h2 className="section-title">
          <Bell size={20} color="var(--accent-purple)" />
          Live Job Alerts & Match History ({alerts.length})
        </h2>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(11, 15, 25, 0.6)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {['ALL', 'NOTIFIED', 'APPLIED', 'SAVED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                background: filterStatus === st ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: filterStatus === st ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '0.3rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filteredAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            No matching job alerts found for filter <strong>{filterStatus}</strong>.
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert._id}
              style={{
                padding: '1.1rem 1.25rem',
                background: 'rgba(11, 15, 25, 0.5)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyCumulative: 'space-between',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: '260px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>{alert.jobTitle}</span>
                  {alert.status === 'NOTIFIED' && <span className="badge badge-notified">NOTIFIED</span>}
                  {alert.status === 'APPLIED' && <span className="badge badge-applied">APPLIED</span>}
                  {alert.status === 'SAVED' && <span className="badge badge-saved">SAVED</span>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Building size={14} color="var(--accent-cyan)" /> {alert.portalId?.companyName || 'Target Company'}
                  </span>
                  <span>📍 {alert.jobLocation || 'Remote'}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={14} /> {alert.sentAt ? new Date(alert.sentAt).toLocaleString() : 'Recent'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <a
                  href={alert.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  Apply Direct <ExternalLink size={14} />
                </a>

                {alert.status !== 'APPLIED' && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onUpdateAlertStatus(alert._id, 'APPLIED')}
                    title="Mark as Applied"
                  >
                    <CheckCircle size={14} color="#34d399" /> Applied
                  </button>
                )}

                {alert.status !== 'SAVED' && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onUpdateAlertStatus(alert._id, 'SAVED')}
                    title="Save for Later"
                  >
                    <Bookmark size={14} color="#c084fc" /> Save
                  </button>
                )}

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleResend(alert._id)}
                  disabled={actionLoadingId === alert._id}
                  title="Resend via WhatsApp"
                >
                  <Send size={14} /> {actionLoadingId === alert._id ? 'Sending...' : 'Resend'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
