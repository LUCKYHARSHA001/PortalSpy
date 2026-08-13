import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { ShieldCheck } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

export default function AuthModal({ isOpen, onClose, onLogin, onRegister, onGoogleLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('9876543210');
  const [errorMsg, setErrorMsg] = useState(null);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setErrorMsg(null);
      try {
        if (onGoogleLogin) {
          await onGoogleLogin({ accessToken: tokenResponse.access_token });
          onClose();
        }
      } catch (err) {
        setErrorMsg(err.response?.data?.message || err.message || 'Google Sign-In failed.');
      }
    },
    onError: (errorResponse) => {
      console.error('Google Login Error:', errorResponse);
      setErrorMsg('Google Sign-In was cancelled or failed.');
    }
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      if (isRegister) {
        const cleanDigits = phoneDigits.replace(/\D/g, '');
        if (cleanDigits.length < 10) {
          setErrorMsg('Please enter a valid 10-digit mobile number.');
          return;
        }
        await onRegister({ email, password, whatsappNumber: `+91${cleanDigits}` });
      } else {
        await onLogin({ email, password });
      }
      onClose();
    } catch (err) {
      if (!err.response && (err.message === 'Network Error' || err.code === 'ERR_NETWORK')) {
        setErrorMsg('Backend server offline. Please ensure backend engine is running on port 5000/5001.');
      } else {
        setErrorMsg(err.response?.data?.message || err.message || 'Authentication error.');
      }
    }
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div className="logo-icon" style={{ margin: '0 auto 0.75rem auto' }}>
            <ShieldCheck size={24} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '1.4rem' }}>
            {isRegister ? 'Create Portalspy Account' : 'Welcome Back to Portalspy'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Automated Career Portal & WhatsApp Alert System
          </p>
        </div>

        {errorMsg && (
          <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
            {errorMsg}
          </div>
        )}

        {/* Custom Styled Google OAuth Button */}
        <div style={{ marginBottom: '1.25rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => loginWithGoogle()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '24px',
              fontSize: '0.92rem',
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)'
            }}
          >
            <GoogleIcon /> {isRegister ? 'Sign up with Google' : 'Sign in with Google'}
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Or continue with email
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
              Email Address
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="user@portalspy.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
              Password
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                WhatsApp Phone Number
              </label>
              <div className="phone-input-group">
                <span className="phone-prefix">🇮🇳 +91</span>
                <input
                  type="tel"
                  className="phone-input-field"
                  placeholder="9876543210"
                  value={phoneDigits}
                  onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.25rem' }}>
            {isRegister ? 'Create Account & Start Tracking' : 'Sign In with Email'}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '0.85rem' }}>
          <span
            onClick={() => setIsRegister(!isRegister)}
            style={{ color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: 600 }}
          >
            {isRegister ? 'Already have an account? Log In' : "Don't have an account? Register"}
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
