import React from 'react';
import { performLogout } from '../../src/shared/auth';

export default function AdminLayout({ user, title, subtitle, headerActions, setUser, children }) {
  const handleLogout = async () => {
    const success = await performLogout();
    if (success) {
      if (setUser) setUser(null);
      window.location.href = '/';
    }
  };

  return (
    <div style={{ width: '900px', margin: '60px auto', padding: '0' }}>
      {/* Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end', 
        paddingBottom: '16px', 
        borderBottom: '1px solid #222222',
        marginBottom: '40px'
      }}>
        <div>
          {subtitle && <div style={{ marginBottom: '8px' }}>{subtitle}</div>}
          <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0, marginBottom: '8px' }}>{title}</h1>
          <div>
            <span style={{ fontSize: '0.9rem', color: 'var(--gray-muted)', marginRight: '12px' }}>
              Signed in as: <strong>{user.email}</strong>
            </span>
            <button 
              onClick={handleLogout} 
              className="blue-link"
              style={{ 
                background: 'none', 
                border: 'none', 
                padding: 0, 
                font: 'inherit', 
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.9rem'
              }}
            >
              Logout
            </button>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {headerActions}
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}
