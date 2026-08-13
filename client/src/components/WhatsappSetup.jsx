import React, { useState, useEffect } from 'react';
import { MessageSquare, QrCode, Phone, Send, CheckCircle, ShieldCheck, Check, RefreshCw } from 'lucide-react';

const extract10Digits = (fullNum) => {
  if (!fullNum) return '';
  const digits = fullNum.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

export default function WhatsappSetup({ user, whatsappStatus, onUpdatePhone, onTestNotification, onResetSession }) {
  const [digitsInput, setDigitsInput] = useState(extract10Digits(user?.whatsappNumber));
  const [testSending, setTestSending] = useState(false);
  const [resettingSession, setResettingSession] = useState(false);
  const [messageNotice, setMessageNotice] = useState(null);

  useEffect(() => {
    if (user?.whatsappNumber) {
      setDigitsInput(extract10Digits(user.whatsappNumber));
    }
  }, [user?.whatsappNumber]);

  const fullNumber = digitsInput.length > 0 ? `+91${digitsInput}` : '';

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    const cleanDigits = digitsInput.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setMessageNotice({ type: 'error', text: 'Please enter a valid 10-digit mobile number.' });
      return;
    }
    const formatted = `+91${cleanDigits}`;
    onUpdatePhone(formatted);
    setMessageNotice({ type: 'success', text: 'WhatsApp target phone updated & confirmation alert queued!' });
    setTimeout(() => setMessageNotice(null), 3500);
  };

  const handleSendTest = async () => {
    setTestSending(true);
    try {
      await onTestNotification();
      if (whatsappStatus?.status === 'CONNECTED') {
        setMessageNotice({ type: 'success', text: '✅ Real test alert dispatched to your WhatsApp number!' });
      } else {
        setMessageNotice({ type: 'success', text: 'ℹ️ Dispatched in Simulation Mode (printed to server terminal). Click "Connect / Scan New QR Code" below to receive real messages on your phone!' });
      }
    } catch (err) {
      setMessageNotice({ type: 'error', text: 'Failed to send test notification.' });
    } finally {
      setTestSending(false);
      setTimeout(() => setMessageNotice(null), 5000);
    }
  };

  const handleResetSessionClick = async () => {
    setResettingSession(true);
    try {
      if (onResetSession) {
        await onResetSession();
        setMessageNotice({ type: 'success', text: 'WhatsApp session reset. Generating fresh QR code...' });
      }
    } catch (err) {
      setMessageNotice({ type: 'error', text: 'Failed to reset WhatsApp session.' });
    } finally {
      setResettingSession(false);
      setTimeout(() => setMessageNotice(null), 3500);
    }
  };

  const handleUnlinkPhone = () => {
    onUpdatePhone('');
    setDigitsInput('');
    setMessageNotice({ type: 'success', text: 'Target WhatsApp phone number unlinked.' });
    setTimeout(() => setMessageNotice(null), 3000);
  };

  const isSaved = user?.whatsappNumber && user.whatsappNumber === fullNumber;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div className="section-header">
        <h2 className="section-title">
          <MessageSquare size={20} color="var(--primary)" />
          WhatsApp Alert Engine & Phone Setup
        </h2>
      </div>

      <div className="grid-2">
        {/* Phone Onboarding Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              <span>Target WhatsApp Phone Number</span>
              {user?.whatsappNumber ? (
                <span style={{ fontSize: '0.75rem', color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  <Check size={12} /> Number Configured
                </span>
              ) : (
                <span style={{ fontSize: '0.75rem', color: '#fb7185' }}>
                  ⚠️ Action Required
                </span>
              )}
            </label>
            <form onSubmit={handlePhoneSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="phone-input-group" style={{ flex: 1 }}>
                <span className="phone-prefix">🇮🇳 +91</span>
                <input
                  type="tel"
                  className="phone-input-field"
                  placeholder="9876543210"
                  value={digitsInput}
                  onChange={(e) => setDigitsInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                />
              </div>
              <button type="submit" className={`btn ${isSaved ? 'btn-secondary' : 'btn-primary'}`}>
                {isSaved ? 'Saved' : 'Update Number'}
              </button>
              {user?.whatsappNumber && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleUnlinkPhone}
                  title="Unlink and remove phone number"
                  style={{ padding: '0.65rem 0.85rem' }}
                >
                  Unlink
                </button>
              )}
            </form>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.3rem', display: 'block' }}>
              Fixed country code (+91 India). Enter your 10-digit WhatsApp mobile number.
            </span>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(11, 15, 25, 0.6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Instant Alert Dispatch Test</span>
              <button className="btn btn-primary btn-sm" onClick={handleSendTest} disabled={testSending}>
                <Send size={14} /> {testSending ? 'Dispatching...' : 'Send Test Alert'}
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Fires a simulated job alert payload via BullMQ queue with 3-6s rate-limiting protection.
            </p>
          </div>

          {messageNotice && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                background: messageNotice.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                color: messageNotice.type === 'success' ? '#34d399' : '#fb7185',
                border: messageNotice.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)'
              }}
            >
              {messageNotice.text}
            </div>
          )}
        </div>

        {/* WhatsApp Session Status & QR Code Visualizer */}
        <div style={{ padding: '1rem', background: 'rgba(11, 15, 25, 0.6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textCenter: 'center' }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <QrCode size={18} color="var(--primary)" /> WhatsApp Web Session Visualizer
          </h3>

          {whatsappStatus?.qrCode ? (
            <div style={{ textAlign: 'center' }}>
              <img
                src={whatsappStatus.qrCode}
                alt="WhatsApp Web QR Code"
                style={{ width: '180px', height: '180px', borderRadius: '12px', background: '#fff', padding: '8px' }}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', marginTop: '0.5rem', fontWeight: 600 }}>
                📱 Open WhatsApp on your phone → Linked Devices → Scan QR Code
              </p>
            </div>
          ) : whatsappStatus?.status === 'CONNECTED' ? (
            <div style={{ textAlign: 'center', padding: '0.75rem', width: '100%' }}>
              <CheckCircle size={40} color="#34d399" style={{ marginBottom: '0.4rem' }} />
              <h4 style={{ color: '#fff', margin: '0.2rem 0', fontSize: '1rem' }}>WhatsApp Web Connected ✅</h4>
              
              <div style={{ margin: '0.75rem 0', padding: '0.65rem 0.85rem', background: 'rgba(7, 10, 18, 0.7)', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', textAlign: 'left', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>📤 Sender Bot (FROM):</span>
                  <strong style={{ color: '#34d399' }}>{whatsappStatus.senderPhone || 'Connected Session'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>📥 Target Alerts (TO):</span>
                  <strong style={{ color: 'var(--accent-cyan)' }}>{user?.whatsappNumber || fullNumber || 'Not set'}</strong>
                </div>
              </div>
            </div>
          ) : whatsappStatus?.status === 'INITIALIZING' ? (
            <div style={{ textAlign: 'center', padding: '1.25rem 0.75rem', width: '100%' }}>
              <RefreshCw size={36} color="var(--accent-cyan)" className="spin" style={{ marginBottom: '0.5rem' }} />
              <h4 style={{ color: '#fff', margin: '0.2rem 0', fontSize: '0.95rem' }}>Initializing WhatsApp Engine...</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Launching headless Chrome. QR code will appear in 3–5 seconds...
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '0.75rem', width: '100%' }}>
              <ShieldCheck size={40} color="var(--accent-amber)" style={{ marginBottom: '0.4rem' }} />
              <h4 style={{ color: 'var(--accent-amber)', margin: '0.2rem 0', fontSize: '1rem' }}>Simulation / Unlinked Mode</h4>
              
              <div style={{ margin: '0.75rem 0', padding: '0.65rem 0.85rem', background: 'rgba(7, 10, 18, 0.7)', borderRadius: '8px', border: '1px solid rgba(251, 113, 133, 0.3)', textAlign: 'left', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>📤 Sender Bot (FROM):</span>
                  <span style={{ color: '#fb7185' }}>Unlinked (Waiting for QR scan)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>📥 Target Alerts (TO):</span>
                  <strong style={{ color: 'var(--accent-cyan)' }}>{user?.whatsappNumber || fullNumber || 'Not set'}</strong>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleResetSessionClick}
            disabled={resettingSession}
            style={{ marginTop: '0.5rem', fontSize: '0.78rem' }}
            title="Generate a fresh QR code to pair WhatsApp"
          >
            <RefreshCw size={13} className={resettingSession ? 'spin' : ''} />
            {resettingSession ? 'Generating QR Code...' : 'Connect / Scan New QR Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
