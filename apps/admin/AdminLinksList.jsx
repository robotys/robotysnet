import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';

export default function AdminLinksList({ user, navigateTo }) {
  const [links, setLinks] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal / Form state for Add/Edit Link
  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState(null); // null if adding
  const [formText, setFormText] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formSort, setFormSort] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchLinks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/links?q=${encodeURIComponent(search)}&page=${page}&limit=10`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to query links');
      }
      setLinks(data.links);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [search, page]);

  const handleOpenAdd = () => {
    setEditingLink(null);
    setFormText('');
    setFormUrl('');
    setFormSort(0);
    setShowForm(true);
  };

  const handleOpenEdit = (link) => {
    setEditingLink(link);
    setFormText(link.text);
    setFormUrl(link.url);
    setFormSort(link.sort || 0);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this link?")) return;
    try {
      const response = await fetch(`/api/admin/links/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete link');
      fetchLinks();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleReorder = async (id, direction) => {
    try {
      const response = await fetch(`/api/admin/links/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder: direction })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to sort link');
      fetchLinks();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    const url = editingLink ? `/api/admin/links/${editingLink.id}` : '/api/admin/links';
    const method = editingLink ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: formText, url: formUrl, sort: formSort })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save link');
      
      setShowForm(false);
      fetchLinks();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
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
      onClick={handleOpenAdd}
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
      + Create New Link
    </button>
  );

  return (
    <AdminLayout
      user={user}
      title="Manage Links"
      subtitle={subtitle}
      headerActions={headerActions}
    >
      {error && (
        <div style={{ padding: '16px', backgroundColor: '#fdf3f2', border: '1px solid #b56b5b', color: '#b56b5b', marginBottom: '24px', fontSize: '0.9rem' }}>
          Error: {error}
        </div>
      )}

      {/* Form Overlay Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '32px',
            border: '1px solid #222222',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '20px' }}>
              {editingLink ? 'Edit Link' : 'Create New Link'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Link Text</label>
                <input
                  type="text"
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="e.g. Nota Bisnes"
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #222222' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>URL</label>
                <input
                  type="text"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://example.com or /posts/file.html"
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #222222' }}
                />
              </div>



              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                <div>
                  {editingLink && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDelete(editingLink.id);
                        setShowForm(false);
                      }}
                      style={{ 
                        padding: '8px 16px', 
                        backgroundColor: '#b56b5b', 
                        color: '#ffffff', 
                        border: 'none', 
                        cursor: 'pointer', 
                        fontWeight: '600' 
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #222222', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ padding: '8px 16px', backgroundColor: '#111111', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {submitting ? 'Saving...' : 'Save Link'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search links by text or URL..."
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
        <p>Loading links...</p>
      ) : links.length === 0 ? (
        <p style={{ color: '#6e6a64', fontStyle: 'italic' }}>No links found.</p>
      ) : (
        <div>
          <div style={{ overflowX: 'auto', border: '1px solid #222222' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#faf9f6', borderBottom: '1px solid #222222' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '600', width: '60px' }}>#</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Text</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>URL</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', width: '200px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link, index) => (
                  <tr key={link.id} style={{ borderBottom: '1px solid #eeeeee' }}>
                    <td style={{ padding: '12px 16px', color: '#6e6a64' }}>{(page - 1) * 10 + index + 1}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '500' }} dangerouslySetInnerHTML={{ __html: link.text }} />
                    <td style={{ padding: '12px 16px', color: '#0022ff', wordBreak: 'break-all' }}>
                      <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a>
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => handleReorder(link.id, 'up')}
                        className="blue-link"
                        style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', marginRight: '10px' }}
                      >
                        [up]
                      </button>
                      <button
                        onClick={() => handleReorder(link.id, 'down')}
                        className="blue-link"
                        style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', marginRight: '10px' }}
                      >
                        [down]
                      </button>
                      <button
                        onClick={() => handleOpenEdit(link)}
                        className="blue-link"
                        style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}
                      >
                        [edit]
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
