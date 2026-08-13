import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Globe, Plus, Play, Pause, RefreshCw, Trash2, ExternalLink, ShieldAlert, Edit3 } from 'lucide-react';

export default function PortalManager({ portals, onAddPortal, onUpdatePortal, onDeletePortal, onTriggerScrape, onResetCircuit }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [loadingPortalId, setLoadingPortalId] = useState(null);

  // Add Portal State
  const [companyName, setCompanyName] = useState('');
  const [portalUrl, setPortalUrl] = useState('');
  const [checkIntervalHours, setCheckIntervalHours] = useState('6');

  // Edit Portal State
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editPortalUrl, setEditPortalUrl] = useState('');
  const [editIntervalHours, setEditIntervalHours] = useState('6');

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!companyName || !portalUrl) return;
    onAddPortal({ companyName, portalUrl, checkIntervalHours: parseInt(checkIntervalHours, 10) });
    setCompanyName('');
    setPortalUrl('');
    setShowAddModal(false);
  };

  const handleOpenEditModal = (portal) => {
    setSelectedPortal(portal);
    setEditCompanyName(portal.companyName || '');
    setEditPortalUrl(portal.portalUrl || '');
    setEditIntervalHours(portal.checkIntervalHours ? portal.checkIntervalHours.toString() : '6');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedPortal || !editCompanyName || !editPortalUrl) return;
    await onUpdatePortal(selectedPortal._id, {
      companyName: editCompanyName,
      portalUrl: editPortalUrl,
      checkIntervalHours: parseInt(editIntervalHours, 10)
    });
    setSelectedPortal(null);
  };

  const handleManualTrigger = async (portalId) => {
    setLoadingPortalId(portalId);
    try {
      await onTriggerScrape(portalId);
    } finally {
      setLoadingPortalId(null);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div className="section-header">
        <h2 className="section-title">
          <Globe size={20} color="var(--primary)" />
          Tracked Career Portals ({portals.length})
        </h2>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Add Portal URL
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Frequency</th>
              <th>Status</th>
              <th>Last Checked</th>
              <th>Scrape Action</th>
            </tr>
          </thead>
          <tbody>
            {portals.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No target career portals added yet. Click <strong>Add Portal URL</strong> to start tracking!
                </td>
              </tr>
            ) : (
              portals.map((portal) => (
                <tr key={portal._id}>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(portal)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        fontWeight: 600,
                        color: '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit'
                      }}
                      title={`Click to view URL or edit settings for ${portal.companyName}`}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-cyan)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#fff')}
                    >
                      {portal.companyName}
                      <Edit3 size={13} style={{ color: 'var(--accent-cyan)', opacity: 0.8 }} />
                    </button>
                  </td>
                  <td>
                    <select
                      value={portal.checkIntervalHours}
                      onChange={(e) => onUpdatePortal(portal._id, { checkIntervalHours: parseInt(e.target.value, 10) })}
                      style={{ background: 'rgba(11,15,25,0.8)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.3rem 0.5rem', borderRadius: '6px' }}
                    >
                      <option value={1}>Every 1 hour</option>
                      <option value={6}>Every 6 hours</option>
                      <option value={12}>Every 12 hours</option>
                      <option value={24}>Every 24 hours</option>
                    </select>
                  </td>
                  <td>
                    {portal.status === 'ACTIVE' && <span className="badge badge-active">ACTIVE</span>}
                    {portal.status === 'PAUSED' && <span className="badge badge-paused">PAUSED</span>}
                    {portal.status === 'NEEDS_REVIEW' && (
                      <span className="badge badge-review" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <ShieldAlert size={12} /> NEEDS REVIEW ({portal.consecutiveFailures || 3}/3)
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {portal.lastCheckedAt ? new Date(portal.lastCheckedAt).toLocaleTimeString() : 'Never'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleManualTrigger(portal._id)}
                        disabled={loadingPortalId === portal._id}
                        title="Run Instant Scrape"
                      >
                        <RefreshCw size={14} className={loadingPortalId === portal._id ? 'spin' : ''} />
                        {loadingPortalId === portal._id ? 'Scraping...' : 'Scrape Now'}
                      </button>

                      {portal.status === 'ACTIVE' ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onUpdatePortal(portal._id, { status: 'PAUSED' })}
                          title="Pause Scraper"
                        >
                          <Pause size={14} />
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => onResetCircuit(portal._id)}
                          title="Activate / Reset Circuit Breaker"
                        >
                          <Play size={14} />
                        </button>
                      )}

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => onDeletePortal(portal._id)}
                        title="Delete Portal"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View & Edit Portal Modal */}
      {selectedPortal && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={() => setSelectedPortal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="logo-icon" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                  <Globe size={18} />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>
                    Portal Details & Edit URL
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Modify target URL or open live site for <strong>{selectedPortal.companyName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPortal(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-muted)',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 500 }}>
                  Company Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  style={{ background: 'rgba(7, 10, 18, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)' }}
                  required
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Career Portal / Job Listing URL
                  </label>
                  <a
                    href={editPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    Open Live Portal <ExternalLink size={12} />
                  </a>
                </div>
                <input
                  type="url"
                  className="form-input"
                  value={editPortalUrl}
                  onChange={(e) => setEditPortalUrl(e.target.value)}
                  style={{ background: 'rgba(7, 10, 18, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 500 }}>
                  Automated Check Frequency
                </label>
                <select
                  className="form-input"
                  value={editIntervalHours}
                  onChange={(e) => setEditIntervalHours(e.target.value)}
                  style={{ background: 'rgba(7, 10, 18, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)' }}
                >
                  <option value="1">Every 1 Hour (High Priority)</option>
                  <option value="6">Every 6 Hours (Recommended)</option>
                  <option value="12">Every 12 Hours</option>
                  <option value="24">Every 24 Hours</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedPortal(null)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 1.4rem', borderRadius: '10px', fontWeight: 700 }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Add Portal Modal */}
      {showAddModal && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="logo-icon" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                  <Globe size={18} />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>
                    Add Target Career Portal
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Track greenhouse, lever, workday & career job boards
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-muted)',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 500 }}>
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Stripe, OpenAI, Lever Demo"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  style={{ background: 'rgba(7, 10, 18, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 500 }}>
                  Career Portal / Job Listing URL
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="e.g. https://boards.greenhouse.io/stripe"
                  value={portalUrl}
                  onChange={(e) => setPortalUrl(e.target.value)}
                  style={{ background: 'rgba(7, 10, 18, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 500 }}>
                  Automated Check Frequency
                </label>
                <select
                  className="form-input"
                  value={checkIntervalHours}
                  onChange={(e) => setCheckIntervalHours(e.target.value)}
                  style={{ background: 'rgba(7, 10, 18, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)' }}
                >
                  <option value="1">Every 1 Hour (High Priority)</option>
                  <option value="6">Every 6 Hours (Recommended)</option>
                  <option value="12">Every 12 Hours</option>
                  <option value="24">Every 24 Hours</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 1.4rem', borderRadius: '10px', fontWeight: 700 }}
                >
                  <Plus size={16} /> Start Tracking
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
