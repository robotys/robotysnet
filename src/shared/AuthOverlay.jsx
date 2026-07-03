import React, { useState, useEffect } from 'react';
import { performLogin, performRegister } from './auth';

export default function AuthOverlay({ onLoginSuccess, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [hasUsers, setHasUsers] = useState(true);
  const [loadingSetup, setLoadingSetup] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await fetch('/api/auth/setup-status');
        const data = await response.json();
        if (response.ok) {
          setHasUsers(data.hasUsers);
        }
      } catch (err) {
        console.error("Failed to check setup status:", err);
      } finally {
        setLoadingSetup(false);
      }
    };
    checkSetup();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const user = await performLogin(email, password);
        setMessage('Signed in successfully!');
        if (onLoginSuccess) {
          setTimeout(() => onLoginSuccess(user), 800);
        }
      } else {
        await performRegister(email, password);
        setMessage('Registration complete! You can now log in.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(250, 249, 246, 0.95)', // Cream background matching Japandi theme
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#ffffff',
        border: '1px solid #222222',
        padding: '32px',
        position: 'relative'
      }}>
        {onClose && (
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: '#555'
            }}
          >
            &times;
          </button>
        )}

        {!loadingSetup && !hasUsers ? (
          <div style={{ display: 'flex', borderBottom: '1px solid #222222', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); setMessage(null); }}
              style={{
                flex: 1,
                padding: '10px',
                background: 'none',
                border: 'none',
                borderBottom: isLogin ? '2px solid #0022ff' : 'none',
                fontWeight: isLogin ? '600' : '400',
                borderRadius: 0,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); setMessage(null); }}
              style={{
                flex: 1,
                padding: '10px',
                background: 'none',
                border: 'none',
                borderBottom: !isLogin ? '2px solid #0022ff' : 'none',
                fontWeight: !isLogin ? '600' : '400',
                borderRadius: 0,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Register
            </button>
          </div>
        ) : (
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '24px', textAlign: 'center', color: '#111111' }}>
            {loadingSetup ? 'Loading...' : 'Log In'}
          </h2>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
              Email Address
            </label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #222' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
              Password
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #222' }}
            />
          </div>

          {error && <p style={{ color: '#b56b5b', fontSize: '0.85rem', fontWeight: '500' }}>{error}</p>}
          {message && <p style={{ color: '#6e846e', fontSize: '0.85rem', fontWeight: '500' }}>{message}</p>}

          <button 
            type="submit" 
            disabled={loading}
            style={{
              backgroundColor: '#111',
              color: '#fff',
              border: 'none',
              padding: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
