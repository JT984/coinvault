import React, { useState, useEffect } from 'react';
import { savePCGSCreds, loadPCGSCreds } from '../lib/pcgs';

export default function SettingsView({ onConfigured, adminMode, onAdminLogin, onAdminLogout, onSavePin }) {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [pcgs, setPcgs] = useState({ clientId: '', clientSecret: '', username: '', password: '' });
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSupabaseUrl(localStorage.getItem('sb_url') || '');
    setSupabaseKey(localStorage.getItem('sb_key') || '');
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

  async function savePin() {
    if (!newPin || newPin.length < 4) { setPinMsg('PIN must be at least 4 digits.'); return; }
    if (newPin !== confirmPin) { setPinMsg('PINs do not match.'); return; }
    const ok = await onSavePin(newPin);
    if (ok) {
      setNewPin(''); setConfirmPin('');
      setPinMsg('PIN updated — takes effect on all devices immediately.');
      setTimeout(() => setPinMsg(''), 4000);
    } else {
      setPinMsg('Failed to save PIN. Check your Supabase connection.');
    }
  }

  const setP = (k, v) => setPcgs(p => ({ ...p, [k]: v }));

  return (
    <>
      <div className="page-header">
        <div className="page-title">Settings</div>
      </div>

      <div className="settings-section">
        <div className="settings-title">Admin access</div>
        {adminMode ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, background: 'var(--green-bg)', border: '1px solid rgba(76,175,130,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
              <span style={{ fontSize: 14 }}>✓</span>
              <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>Logged in as admin</span>
              <button onClick={onAdminLogout} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>Log out</button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
              Change your admin PIN — takes effect on all devices immediately:
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">New PIN</label>
                <input className="form-input" type="password" inputMode="numeric" maxLength={8} placeholder="Min 4 digits" value={newPin} onChange={e => { setNewPin(e.target.value); setPinMsg(''); }} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm PIN</label>
                <input className="form-input" type="password" inputMode="numeric" maxLength={8} placeholder="Repeat PIN" value={confirmPin} onChange={e => { setConfirmPin(e.target.value); setPinMsg(''); }} />
              </div>
            </div>
            {pinMsg && <div style={{ fontSize: 12, color: pinMsg.includes('updated') ? 'var(--green)' : 'var(--red)', marginBottom: 8 }}>{pinMsg}</div>}
            <button className="btn btn-outline" onClick={savePin}>Update PIN</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>
              The app is in read-only mode. Log in as admin to add, edit, or sell coins.
            </div>
            <button className="btn btn-primary" onClick={onAdminLogin}>Admin login</button>
          </>
        )}
      </div>

      <hr className="divider" />

      <div className="settings-section">
        <div className="settings-title">Shared database (Supabase)</div>
        <div className="form-group">
          <label className="form-label">Project URL</label>
          <input className="form-input" value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} placeholder="https://xxxx.supabase.co" />
        </div>
        <div className="form-group">
          <label className="form-label">Anon key</label>
          <input className="form-input" type="password" value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} placeholder="eyJhbGci..." />
        </div>
      </div>

      <hr className="divider" />

      <div className="settings-section">
        <div className="settings-title">PCGS API (auto-lookup)</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>
          Get access at <a href="https://www.pcgs.com/publicapi" target="_blank" rel="noreferrer" style={{ color: 'var(--gold)' }}>pcgs.com/publicapi</a>.
        </div>
        <div className="form-group"><label className="form-label">Client ID</label><input className="form-input" value={pcgs.clientId} onChange={e => setP('clientId', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Client Secret</label><input className="form-input" type="password" value={pcgs.clientSecret} onChange={e => setP('clientSecret', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Username</label><input className="form-input" value={pcgs.username} onChange={e => setP('username', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" value={pcgs.password} onChange={e => setP('password', e.target.value)} /></div>
      </div>

      <button className="btn btn-primary" onClick={saveSettings}>{saved ? '✓ Saved' : 'Save settings'}</button>

      <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginTop: 16, paddingBottom: 24 }}>
        Credentials are stored only in your browser and sent directly to Supabase and PCGS.
      </div>
    </>
  );
}
