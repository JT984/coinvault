import React, { useState } from 'react';

export default function AdminLoginModal({ onLogin, onClose }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (onLogin(pin)) {
      setError('');
    } else {
      setError('Incorrect PIN. Try again.');
      setPin('');
    }
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: 360, margin: '0 auto' }}>
        <div className="sheet-handle" />
        <div className="sheet-title">Admin login</div>
        <div className="sheet-sub">Enter your PIN to enable editing.</div>

        <div className="form-group">
          <label className="form-label">PIN</label>
          <input
            className="form-input"
            type="password"
            inputMode="numeric"
            maxLength={8}
            placeholder="Enter PIN"
            value={pin}
            onChange={e => { setPin(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
          {error && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>{error}</div>}
        </div>

        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>
          Default PIN is <strong style={{ color: 'var(--text2)' }}>1234</strong>. Change it in Settings after logging in.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!pin}>Login</button>
        </div>
      </div>
    </div>
  );
}
