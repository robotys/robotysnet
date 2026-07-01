import React, { useState } from 'react';

export default function Base64Codec() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleEncode = () => {
    setError(null);
    setCopied(false);
    try {
      // Use encodeURIComponent to handle Unicode characters correctly
      const utf8Bytes = new TextEncoder().encode(input);
      let binary = '';
      const len = utf8Bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(utf8Bytes[i]);
      }
      setOutput(window.btoa(binary));
    } catch (err) {
      setError("Failed to encode input text. Ensure it is valid UTF-8.");
      setOutput('');
    }
  };

  const handleDecode = () => {
    setError(null);
    setCopied(false);
    try {
      const binary = window.atob(input.trim());
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      setOutput(new TextDecoder().decode(bytes));
    } catch (err) {
      setError("Invalid Base64 sequence. Failed to decode.");
      setOutput('');
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleEncode} className="primary">Encode to Base64</button>
        <button onClick={handleDecode}>Decode from Base64</button>
        <button onClick={handleClear}>Clear</button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        minHeight: '350px'
      }}>
        {/* Input area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Source String</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste source data here..."
            style={{
              flex: 1,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              resize: 'none'
            }}
          />
        </div>

        {/* Output area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Encoded / Decoded Output</label>
            {output && (
              <button onClick={handleCopy} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                {copied ? 'Copied!' : 'Copy Output'}
              </button>
            )}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <textarea
              readOnly
              value={output}
              placeholder="Output will display here..."
              style={{
                flex: 1,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                backgroundColor: 'var(--bg-secondary)',
                resize: 'none',
                borderColor: error ? 'var(--error)' : 'var(--border-color)'
              }}
            />
            {error && (
              <div style={{
                marginTop: '10px',
                padding: '12px',
                backgroundColor: '#fdf3f2',
                border: '1px solid var(--error)',
                borderRadius: 'var(--border-radius-sm)',
                color: 'var(--error)',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
