import React, { useState } from 'react';

export default function Account({ user, setUser, checkSession }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isLogin) {
        setUser(data.user);
        setMessage('Logged in successfully!');
        setEmail('');
        setPassword('');
        // Force refresh session check
        if (checkSession) checkSession();
      } else {
        setMessage('Registration successful! You can now log in.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        setUser(null);
        setMessage('Logged out successfully.');
      }
    } catch (err) {
      setError('Logout failed.');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto' }}>
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius)',
          padding: '40px',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          <h2 style={{ marginBottom: '8px' }}>Your Profile</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Manage your account settings and credentials</p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '24px',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--border-color)',
            marginBottom: '32px'
          }}>
            <div>
              <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Email Address</span>
              <p style={{ fontSize: '1.1rem', fontWeight: '500', marginTop: '4px' }}>{user.email}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Account Status</span>
              <p style={{ fontSize: '1.1rem', fontWeight: '500', marginTop: '4px', color: 'var(--success)' }}>
                {user.tier === 'paid' ? 'Paid / Premium Member' : 'Registered Member (Free)'}
              </p>
            </div>
          </div>

          {message && <div style={{ color: 'var(--success)', marginBottom: '16px', fontWeight: '500' }}>{message}</div>}

          <button onClick={handleLogout} className="btn primary" disabled={loading}>
            {loading ? 'Logging out...' : 'Log Out'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '400px', margin: '40px auto' }}>
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #222222',
        padding: '32px'
      }}>
        {/* Tab Selection */}
        <div style={{ display: 'flex', borderBottom: '1px solid #222222', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setMessage(null); setError(null); }}
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
            onClick={() => { setIsLogin(false); setMessage(null); setError(null); }}
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

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #222222' }}
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
              placeholder={isLogin ? 'Your password' : 'At least 8 characters'}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #222222' }}
            />
          </div>

          {error && <div style={{ color: '#b56b5b', fontSize: '0.85rem', fontWeight: '500' }}>{error}</div>}
          {message && <div style={{ color: '#6e846e', fontSize: '0.85rem', fontWeight: '500' }}>{message}</div>}

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
