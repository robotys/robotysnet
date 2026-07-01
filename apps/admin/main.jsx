import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { fetchSession } from '../../src/shared/auth';
import AuthOverlay from '../../src/shared/AuthOverlay';
import AdminPostsList from './AdminPostsList';
import AdminPostEditor from './AdminPostEditor';
import AdminLinksList from './AdminLinksList';
import AdminLayout from './AdminLayout';
import '../../src/index.css';

function AdminDashboard({ user, navigateTo, setUser }) {
  const subtitle = (
    <a 
      href="/" 
      className="blue-link" 
      style={{ fontSize: '0.9rem', display: 'block', textDecoration: 'none', marginBottom: '8px' }}
    >
      &larr; Back to Website
    </a>
  );

  return (
    <AdminLayout user={user} title="Admin Dashboard" subtitle={subtitle} setUser={setUser}>
      <div style={{ display: 'flex', gap: '16px' }}>
        <button 
          onClick={() => navigateTo('/admin/posts')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#111111',
            color: '#ffffff',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Manage Post
        </button>
        <button 
          onClick={() => navigateTo('/admin/links')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            color: '#111111',
            border: '1px solid #222222',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Manage Link
        </button>
      </div>
    </AdminLayout>
  );
}

function AdminSPA() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Monitor browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
  };

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
        <p>Verifying admin session...</p>
      </div>
    );
  }

  // Access check: restrict to robotys@gmail.com
  if (!user || user.email !== 'robotys@gmail.com') {
    return (
      <div style={{ padding: '40px', maxWidth: '500px', margin: '60px auto', textAlign: 'center' }}>
        <div style={{ border: '1px solid #b56b5b', padding: '24px', backgroundColor: '#fdf3f2', marginBottom: '24px' }}>
          <h3 style={{ color: '#b56b5b', marginBottom: '12px' }}>Access Denied</h3>
          <p style={{ fontSize: '0.9rem' }}>
            Only the system administrator (<strong>robotys@gmail.com</strong>) has access to post management systems.
          </p>
        </div>
        <AuthOverlay onLoginSuccess={(u) => { setUser(u); }} />
      </div>
    );
  }

  // Client side routing logic
  // Case 1: Edit post /admin/post/{uuid}
  const editMatch = currentPath.match(/^\/admin\/post\/([a-zA-Z0-9-]+)$/);
  if (editMatch) {
    const postUuid = editMatch[1];
    return (
      <AdminPostEditor 
        uuid={postUuid} 
        user={user} 
        navigateTo={navigateTo} 
      />
    );
  }

  // Case 2: List posts /admin/posts
  if (currentPath === '/admin/posts' || currentPath === '/admin/posts/') {
    return (
      <AdminPostsList 
        user={user} 
        navigateTo={navigateTo} 
      />
    );
  }

  // Case 3: List links /admin/links
  if (currentPath === '/admin/links' || currentPath === '/admin/links/') {
    return (
      <AdminLinksList 
        user={user} 
        navigateTo={navigateTo} 
      />
    );
  }

  // Case 3: Admin Dashboard (default fallback for `/admin` or `/admin/`)
  return (
    <AdminDashboard
      user={user}
      navigateTo={navigateTo}
      setUser={setUser}
    />
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<AdminSPA />);
