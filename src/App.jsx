import React, { useState, useEffect } from 'react';
import { fetchSession } from './shared/auth';

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [links, setLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(true);

  // Fetch session status
  const checkSession = async () => {
    const sessionUser = await fetchSession();
    setUser(sessionUser);
    setLoadingSession(false);
  };

  // Fetch public links sorted by sort column
  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/links');
      const data = await response.json();
      if (response.ok) {
        setLinks(data.links);
      }
    } catch (err) {
      console.error("Failed to load links:", err);
    } finally {
      setLoadingLinks(false);
    }
  };

  useEffect(() => {
    checkSession();
    fetchLinks();
  }, []);

  const isExternal = (url) => url.startsWith('http');

  return (
    <div className="app-card">
      <div className="columns-container">
        {/* Left Column - persistent profile info */}
        <section className="left-column">
          <div className="header-content">
            <div className="avatar-circle">
              <img src="/robot-dp.png" alt="robotys profile avatar" />
            </div>
            <a href="/" className="brand-title">robotys.net</a>
          </div>

          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '1rem', lineHeight: '1.7', marginBottom: '7px' }}>
              Nearing 20 years doing web dev: still learning and 'bettering'. Love: web, automation, data/reporting, server, outdoor and ride (motorbike). Hate: bully, zealot, tyrant and clueless people. Pursuit: balance between form and function.
            </p>
            <quote style={{ fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '12px', display: 'block', fontStyle: 'italic' }} > "Life should be simple, but not simpler."</quote>
            <a href="/posts/" className="blue-link" style={{ fontSize: '0.95rem', fontWeight: '600' }}>
              Check my posts &rarr;
            </a>
          </div>
        </section>

        {/* Right Column - Navigation / Links */}
        <section className="right-column">
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>Links:</h3>
            <ul className="links-list">
              {loadingLinks ? (
                <li>Loading links...</li>
              ) : links.length === 0 ? (
                <li>No links available</li>
              ) : (
                links.map(link => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target={isExternal(link.url) ? "_blank" : undefined}
                      rel={isExternal(link.url) ? "noopener noreferrer" : undefined}
                      dangerouslySetInnerHTML={{ __html: link.text }}
                    /> →
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      </div >
    </div >
  );
}
