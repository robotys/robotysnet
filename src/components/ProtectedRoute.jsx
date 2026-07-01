import React from 'react';

export default function ProtectedRoute({ user, loading, children }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Verifying authorization...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        maxWidth: '500px',
        margin: '60px auto',
        padding: '32px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius)',
        textAlign: 'center',
        boxShadow: 'var(--shadow-subtle)'
      }}>
        <h2 style={{ marginBottom: '12px', color: 'var(--error)' }}>Restricted Access</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          This utility is reserved for registered users. Please log in or register a free account to gain full access.
        </p>
        <button 
          className="primary" 
          onClick={() => window.history.pushState({}, '', '/apps/account')}
        >
          Manage Account & Login
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
