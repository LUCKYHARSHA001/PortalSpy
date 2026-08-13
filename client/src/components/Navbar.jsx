import React from 'react';
import { Radar, PhoneCall, LogOut, User, ShieldCheck } from 'lucide-react';

export default function Navbar({ user, whatsappStatus, onLogout, onOpenAuth }) {
  const getStatusBadge = () => {
    switch (whatsappStatus?.status) {
      case 'CONNECTED':
        return (
          <span className="status-badge status-connected">
            <span className="pulse-dot"></span> WhatsApp Connected
          </span>
        );
      case 'SIMULATION_MODE':
        return (
          <span className="status-badge status-simulation">
            <span className="pulse-dot"></span> Simulation Mode
          </span>
        );
      case 'QR_READY':
        return (
          <span className="status-badge status-simulation">
            <span className="pulse-dot"></span> Scan QR Code
          </span>
        );
      default:
        return (
          <span className="status-badge status-disconnected">
            <span className="pulse-dot"></span> WhatsApp Standby
          </span>
        );
    }
  };

  return (
    <header className="navbar">
      <div className="logo-brand">
        <div className="logo-icon">
          <Radar size={22} />
        </div>
        <span>Portalspy</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {getStatusBadge()}

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || user.email}
                  style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--accent-cyan)' }}
                />
              ) : (
                <User size={16} />
              )}
              {user.name ? `${user.name} (${user.email})` : user.email}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={onLogout} title="Logout">
              <LogOut size={16} /> Logout
            </button>
          </div>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
            <ShieldCheck size={16} /> Account Sign In
          </button>
        )}
      </div>
    </header>
  );
}
