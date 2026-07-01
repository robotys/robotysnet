import React, { useState } from 'react';

export default function JsonFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [indent, setIndent] = useState(2);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const formatJson = (minify = false) => {
    setError(null);
    setCopied(false);
    if (!input.trim()) {
      setOutput('');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const formatted = minify 
        ? JSON.stringify(parsed) 
        : JSON.stringify(parsed, null, parseInt(indent));
      setOutput(formatted);
    } catch (err) {
      setError(err.message);
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
    setCopied(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tab Spacing:</label>
          <select 
            value={indent} 
            onChange={(e) => setIndent(e.target.value)} 
            style={{ width: '80px', padding: '6px 12px' }}
          >
            <option value={2}>2</option>
            <option value={4}>4</option>
            <option value={8}>8</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => formatJson(false)} className="primary">Format</button>
          <button onClick={() => formatJson(true)}>Minify</button>
          <button onClick={handleClear}>Clear</button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        minHeight: '400px'
      }}>
        {/* Input Textarea */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Input Raw JSON</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Paste raw JSON here (e.g. {"name":"robotys","age":2})'
            style={{
              flex: 1,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              resize: 'none',
              minHeight: '350px'
            }}
          />
        </div>

        {/* Output Textarea */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Formatted Result</label>
            {output && (
              <button onClick={handleCopy} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                {copied ? 'Copied!' : 'Copy Result'}
              </button>
            )}
          </div>
          <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <textarea
              readOnly
              value={output}
              placeholder="Output will appear here..."
              style={{
                flex: 1,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                backgroundColor: 'var(--bg-secondary)',
                resize: 'none',
                minHeight: '350px',
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
                fontSize: '0.85rem',
                fontFamily: 'var(--font-mono)'
              }}>
                <strong>Validation Error:</strong> {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
