import React, { useState } from 'react';

export default function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  async function handleSubmit() {
    if (!password) return;
    setChecking(true);
    setError('');
    const ok = await onUnlock(password);
    if (!ok) {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
    setChecking(false);
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100dvh', padding: '24px',
      background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 320 }}>
        {/* Logo / title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🪙</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--text)' }}>CoinVault</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Enter your password to continue</div>
        </div>

        {/* Password field */}
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
          {error && (
            <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>{error}</div>
          )}
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!password || checking}
          style={{ marginTop: 4 }}
        >
          {checking ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Enter'}
        </button>
      </div>
    </div>
  );
}
