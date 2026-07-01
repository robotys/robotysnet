import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Account from '../../src/pages/Account';
import { fetchSession } from '../../src/shared/auth';
import '../../src/index.css';

function AccountApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    const sessionUser = await fetchSession();
    setUser(sessionUser);
    setLoading(false);
  };

  useEffect(() => {
    checkSession();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '40px auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <a href="/" className="blue-link" style={{ fontSize: '0.9rem' }}>← Back</a>
      </div>
      <Account user={user} setUser={setUser} checkSession={checkSession} />
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<AccountApp />);
