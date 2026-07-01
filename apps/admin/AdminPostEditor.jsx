import React, { useState, useEffect, useRef } from 'react';

export default function AdminPostEditor({ uuid, navigateTo }) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState('unpublished');
  const [tags, setTags] = useState('');
  const [hook, setHook] = useState('');
  const [markdown, setMarkdown] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const toastTimerRef = useRef(null);

  // Fetch post details on load
  const fetchPostDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/posts/${uuid}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to retrieve post details');
      }
      setTitle(data.title || '');
      setSlug(data.slug || '');
      setStatus(data.status || 'unpublished');
      setTags(data.tags || '');
      setHook(data.hook || '');
      setMarkdown(data.markdown || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetails();
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [uuid]);

  // Handle Save
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/admin/posts/${uuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, status, tags, hook, markdown })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update post details');
      }
      setSuccess(true);
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading editor details...</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '90px', minHeight: '100vh', position: 'relative' }}>
      {/* Editor Content Area */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        
        {/* Navigation Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid #222222', paddingBottom: '12px' }}>
          <div>
            <button
              onClick={() => navigateTo('/admin/posts')}
              className="blue-link"
              style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              &larr; Back to Posts List
            </button>
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: '#6e6a64' }}>Post UUID: {uuid}</span>
          </div>
        </header>

        {error && (
          <div style={{ padding: '16px', backgroundColor: '#fdf3f2', border: '1px solid #b56b5b', color: '#b56b5b', marginBottom: '24px', fontSize: '0.9rem' }}>
            Error: {error}
          </div>
        )}

        {/* Success Toast */}
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          padding: '12px 20px',
          backgroundColor: '#e2f0e2',
          border: '1px solid #2e6b2e',
          color: '#2e6b2e',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          fontWeight: '500',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: success ? 'auto' : 'none',
          transform: success ? 'translateY(0)' : 'translateY(-100px)',
          opacity: success ? 1 : 0,
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease'
        }}>
          <span style={{ fontSize: '1.1rem' }}>✓</span> Changes saved successfully!
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
          
          {/* Left Column: Title and Markdown editor (65% width) */}
          <div style={{ flex: '2 1 650px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>
                Post Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title here..."
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #222222',
                  fontSize: '1.2rem',
                  fontWeight: '600'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>
                Markdown Content
              </label>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Write your article markdown here..."
                style={{
                  width: '100%',
                  height: '500px',
                  padding: '16px',
                  border: '1px solid #222222',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Right Column: Metadata Inputs (30% width) */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>
                URL Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. adcompare-marketing-guide"
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #222222',
                  fontSize: '0.9rem'
                }}
              />
              <small style={{ color: '#6e6a64', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                Auto-cleaned to lowercase kebab-case.
              </small>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #222222',
                  backgroundColor: '#ffffff',
                  fontSize: '0.9rem'
                }}
              >
                <option value="unpublished">Unpublished (Draft)</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. meta, ads, compare"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #222222',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>
                Hook / Summary Text
              </label>
              <textarea
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                placeholder="Brief meta description or hook for listing cards..."
                style={{
                  width: '100%',
                  height: '120px',
                  padding: '10px',
                  border: '1px solid #222222',
                  fontSize: '0.9rem',
                  resize: 'vertical'
                }}
              />
            </div>

          </div>

        </form>
      </div>

      {/* Fixed Save Bar Bottom Row */}
      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #222222',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        zIndex: 100
      }}>
        <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <button
            type="button"
            onClick={() => navigateTo('/admin/posts')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ffffff',
              border: '1px solid #222222',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px',
              backgroundColor: '#111111',
              color: '#ffffff',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </footer>
    </div>
  );
}
