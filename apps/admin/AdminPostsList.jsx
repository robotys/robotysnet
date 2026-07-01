import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';

export default function AdminPostsList({ user, navigateTo }) {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/posts?q=${encodeURIComponent(search)}&page=${page}&limit=10`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to query posts');
      }
      setPosts(data.posts);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [search, page]);

  const handleCreatePost = async () => {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create new draft post');
      }
      navigateTo(`/admin/post/${data.post.uuid}`);
    } catch (err) {
      setError(err.message);
      setCreating(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const subtitle = (
    <button
      onClick={() => navigateTo('/admin')}
      className="blue-link"
      style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', fontSize: '0.9rem', display: 'block' }}
    >
      &larr; Back to Dashboard
    </button>
  );

  const headerActions = (
    <button
      onClick={handleCreatePost}
      disabled={creating}
      style={{
        backgroundColor: '#0022ff',
        color: '#ffffff',
        border: 'none',
        padding: '10px 16px',
        fontWeight: '600',
        cursor: 'pointer',
        fontSize: '0.85rem'
      }}
    >
      {creating ? 'Creating...' : '+ Create New Post'}
    </button>
  );

  return (
    <AdminLayout 
      user={user} 
      title="Manage Posts" 
      subtitle={subtitle} 
      headerActions={headerActions}
    >

      {error && (
        <div style={{ padding: '16px', backgroundColor: '#fdf3f2', border: '1px solid #b56b5b', color: '#b56b5b', marginBottom: '24px', fontSize: '0.9rem' }}>
          Error: {error}
        </div>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search posts by title..."
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '10px 14px',
            border: '1px solid #222222',
            fontSize: '0.9rem'
          }}
        />
      </div>

      {loading ? (
        <p>Loading posts...</p>
      ) : posts.length === 0 ? (
        <p style={{ color: '#6e6a64', fontStyle: 'italic' }}>No posts found.</p>
      ) : (
        <div>
          <div style={{ overflowX: 'auto', border: '1px solid #222222' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#faf9f6', borderBottom: '1px solid #222222' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Title</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Slug</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Created At</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(post => (
                  <tr key={post.uuid} style={{ borderBottom: '1px solid #eeeeee' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '500' }}>{post.title}</td>
                    <td style={{ padding: '12px 16px', color: '#6e6a64' }}>{post.slug}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: post.status === 'published' ? '#e2f0e2' : '#eee',
                        color: post.status === 'published' ? '#2e6b2e' : '#555'
                      }}>
                        {post.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{formatDate(post.created_at)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => navigateTo(`/admin/post/${post.uuid}`)}
                        className="blue-link"
                        style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', textDecoration: 'none', cursor: 'pointer' }}
                      >
                        [manage]
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #222222',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.5 : 1
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.9rem' }}>
                Page <strong>{page}</strong> of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #222222',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: page >= totalPages ? 0.5 : 1
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
