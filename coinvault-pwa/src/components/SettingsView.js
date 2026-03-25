import React, { useState, useEffect } from 'react';
import { savePCGSCreds, loadPCGSCreds } from '../lib/pcgs';

export default function SettingsView({ onConfigured }) {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [pcgs, setPcgs] = useState({ clientId: '', clientSecret: '', username: '', password: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSupabaseUrl(process.env.REACT_APP_SUPABASE_URL || localStorage.getItem('sb_url') || '');
    setSupabaseKey(process.env.REACT_APP_SUPABASE_ANON_KEY || localStorage.getItem('sb_key') || '');
    const creds = loadPCGSCreds();
    if (creds) setPcgs(creds);
  }, []);

  function saveSettings() {
    localStorage.setItem('sb_url', supabaseUrl);
    localStorage.setItem('sb_key', supabaseKey);
    savePCGSCreds(pcgs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (supabaseUrl && supabaseKey) onConfigured();
  }

  const setP = (k, v) => setPcgs(p => ({ ...p, [k]: v }));

  return (
    <>
      <div className="page-header">
        <div className="page-title">Settings</div>
      </div>

      {/* Supabase */}
      <div className="settings-section">
        <div className="settings-title">Shared database (Supabase)</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>
          Supabase is a free database that lets your group share the same collection in real time. Setup takes about 5 minutes.
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14, marginBottom: 12, fontSize: 12, color: 'var(--text2)', lineHeight: 1.8 }}>
          <strong style={{ color: 'var(--text)' }}>Setup steps:</strong><br />
          1. Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ color: 'var(--gold)' }}>supabase.com</a> → New project (free)<br />
          2. In the SQL editor, run the SQL from the README<br />
          3. Go to Project Settings → API → copy URL and anon key below<br />
          4. Share the app URL with your group
        </div>
        <div className="form-group">
          <label className="form-label">Supabase project URL</label>
          <input className="form-input" value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} placeholder="https://xxxx.supabase.co" />
        </div>
        <div className="form-group">
          <label className="form-label">Supabase anon key</label>
          <input className="form-input" value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} placeholder="eyJhbGci..." type="password" />
        </div>
      </div>

      <hr className="divider" />

      {/* PCGS */}
      <div className="settings-section">
        <div className="settings-title">PCGS API credentials</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>
          Enables automatic cert lookup for PCGS coins. Get API access at{' '}
          <a href="https://www.pcgs.com/publicapi" target="_blank" rel="noreferrer" style={{ color: 'var(--gold)' }}>pcgs.com/publicapi</a>.
        </div>
        <div className="form-group">
          <label className="form-label">Client ID</label>
          <input className="form-input" value={pcgs.clientId} onChange={e => setP('clientId', e.target.value)} placeholder="From PCGS API portal" />
        </div>
        <div className="form-group">
          <label className="form-label">Client Secret</label>
          <input className="form-input" type="password" value={pcgs.clientSecret} onChange={e => setP('clientSecret', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">PCGS username (email)</label>
          <input className="form-input" value={pcgs.username} onChange={e => setP('username', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">PCGS password</label>
          <input className="form-input" type="password" value={pcgs.password} onChange={e => setP('password', e.target.value)} />
        </div>
      </div>

      <button className="btn btn-primary" onClick={saveSettings}>
        {saved ? '✓ Saved' : 'Save settings'}
      </button>

      <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
        Credentials are stored only in your browser's local storage and are never sent to any server other than PCGS and Supabase directly.
      </div>
    </>
  );
}
