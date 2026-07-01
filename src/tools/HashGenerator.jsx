import React, { useState } from 'react';

export default function HashGenerator() {
  const [input, setInput] = useState('');
  const [algo, setAlgo] = useState('SHA-256');
  const [hash, setHash] = useState('');
  const [copied, setCopied] = useState(false);

  const calculateHash = async () => {
    if (!input) {
      setHash('');
      return;
    }

    try {
      const msgUint8 = new TextEncoder().encode(input);
      const hashBuffer = await crypto.subtle.digest(algo, msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setHash(hashHex);
    } catch (err) {
      console.error(err);
      setHash('Error generating cryptographic hash.');
    }
  };

  const handleCopy = () => {
    if (!hash || hash.startsWith('Error')) return;
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Input box */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
            Input Text
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter plain text to hash..."
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.95rem',
              resize: 'vertical',
              minHeight: '100px',
              width: '100%'
            }}
          />
        </div>

        {/* Action Select & Run */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Algorithm:</label>
            <select 
              value={algo} 
              onChange={(e) => setAlgo(e.target.value)} 
              style={{ width: '150px', padding: '8px 12px' }}
            >
              <option value="SHA-256">SHA-256</option>
              <option value="SHA-512">SHA-512</option>
              <option value="SHA-1">SHA-1 (Legacy)</option>
            </select>
          </div>
          
          <button onClick={calculateHash} className="primary">Calculate Hash</button>
        </div>
      </div>

      {/* Output card */}
      {hash && (
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius)',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '500' }}>
              {algo} Checksum Hex Output
            </span>
            <button onClick={handleCopy} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
              {copied ? 'Copied!' : 'Copy Hash'}
            </button>
          </div>
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            wordBreak: 'break-all',
            color: hash.startsWith('Error') ? 'var(--error)' : 'var(--text-primary)'
          }}>
            {hash}
          </div>
        </div>
      )}
    </div>
  );
}
