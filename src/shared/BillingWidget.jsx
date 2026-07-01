import React, { useState } from 'react';

export default function BillingWidget({ user, onUpgradeSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Upgrade checkout failed');
      }
      setSuccess(true);
      if (onUpgradeSuccess) {
        setTimeout(() => onUpgradeSuccess(data.user), 1200);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '16px', border: '1px dashed #222', backgroundColor: '#faf9f6' }}>
        <p style={{ fontSize: '0.9rem', color: '#555' }}>
          Please log in to upgrade your subscription tier.
        </p>
      </div>
    );
  }

  if (user.tier === 'paid') {
    return (
      <div style={{ padding: '16px', border: '1px solid #6e846e', backgroundColor: '#faf9f6' }}>
        <p style={{ fontSize: '0.9rem', color: '#6e846e', fontWeight: '600' }}>
          ✓ Your Premium Subscription is Active
        </p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      border: '1px solid #222222',
      backgroundColor: '#faf9f6',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>Unlock Developer Pro Tools</h4>
      <p style={{ fontSize: '0.85rem', color: '#555' }}>
        Gain unlimited access to premium analytics databases and full API support for only $5/month.
      </p>

      {error && <p style={{ color: '#b56b5b', fontSize: '0.8rem' }}>{error}</p>}
      {success && <p style={{ color: '#6e846e', fontSize: '0.85rem', fontWeight: '600' }}>Payment Mock Successful! Upgrading...</p>}

      {!success && (
        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            backgroundColor: '#0022ff',
            color: '#fff',
            border: 'none',
            padding: '10px 16px',
            fontWeight: '600',
            fontSize: '0.85rem',
            cursor: 'pointer',
            alignSelf: 'flex-start'
          }}
        >
          {loading ? 'Processing Payment...' : 'Upgrade Now ($5)'}
        </button>
      )}
    </div>
  );
}
