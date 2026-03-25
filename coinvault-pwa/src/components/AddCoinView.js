import React, { useState } from 'react';
import { lookupPCGS, loadPCGSCreds } from '../lib/pcgs';

export default function AddCoinView({ onAdd, onCancel }) {
  const [service, setService] = useState('NGC');
  const [certNumber, setCertNumber] = useState('');
  const [looking, setLooking] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [form, setForm] = useState({
    name: '', year: '', denomination: '', mint: '',
    strikeType: 'Business', grade: '', descriptors: '',
    purchaseCost: '', shippingCost: '', notes: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleLookup() {
    setLooking(true);
    setLookupError('');
    setLookupResult(null);
    try {
      if (service === 'PCGS') {
        const creds = loadPCGSCreds();
        if (!creds?.clientId) {
          setLookupError('PCGS credentials not configured. Go to Settings to add them, or enter coin details manually below.');
          return;
        }
        const result = await lookupPCGS(certNumber, creds);
        if (result) {
          setLookupResult(result);
          setForm(f => ({
            ...f,
            name: result.name || f.name,
            year: result.year ? String(result.year) : f.year,
            denomination: result.denomination || f.denomination,
            mint: result.mint || f.mint,
            grade: result.grade || f.grade,
            gradingService: 'PCGS',
          }));
        } else {
          setLookupError('Coin not found in PCGS database. Enter details manually below.');
        }
      } else {
        // NGC — open cert URL in new tab for manual reference
        const url = `https://www.ngccoin.com/certlookup/${certNumber.replace(/-/g, '')}/`;
        window.open(url, '_blank');
        setLookupError('NGC does not have a public API. Opened the NGC cert page in a new tab — copy the details below.');
      }
    } catch (e) {
      setLookupError('Lookup failed: ' + e.message);
    } finally {
      setLooking(false);
    }
  }

  function handleAdd() {
    const fmt = (v) => parseFloat(v) || null;
    onAdd({
      year: form.year ? parseInt(form.year) : null,
      name: form.name,
      denomination: form.denomination,
      mint: form.mint,
      strikeType: form.strikeType,
      gradingService: service,
      grade: form.grade,
      descriptors: form.descriptors,
      certNumber,
      ngcPopulation: lookupResult?.ngcPopulation || null,
      pcgsPopulation: lookupResult?.pcgsPopulation || null,
      currentValue: lookupResult?.currentValue || null,
      purchaseCost: fmt(form.purchaseCost),
      shippingCost: fmt(form.shippingCost) || 0,
      certURL: lookupResult?.certURL || '',
      notes: form.notes,
      inRegistry: false,
      registryPoints: null,
      lastValueUpdate: lookupResult?.currentValue ? new Date().toISOString() : null,
    });
  }

  const canAdd = form.name.trim().length > 0;

  return (
    <>
      <div className="page-header">
        <div className="page-title">Add coin</div>
      </div>

      {/* Service picker */}
      <div className="form-group">
        <label className="form-label">Grading service</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {['NGC', 'PCGS', 'ANACS'].map(s => (
            <button
              key={s}
              onClick={() => setService(s)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)',
                border: `1px solid ${service === s ? 'var(--gold-dim)' : 'var(--border)'}`,
                background: service === s ? 'var(--gold-bg2)' : 'var(--surface2)',
                color: service === s ? 'var(--gold)' : 'var(--text2)',
                fontWeight: 500, cursor: 'pointer', fontSize: 14,
              }}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Cert lookup */}
      <div className="form-group">
        <label className="form-label">Certification number</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="form-input"
            style={{ flex: 1 }}
            placeholder="e.g. 5850713-011"
            value={certNumber}
            onChange={e => setCertNumber(e.target.value)}
          />
          <button
            className="btn btn-primary"
            style={{ width: 'auto', padding: '0 16px', whiteSpace: 'nowrap' }}
            onClick={handleLookup}
            disabled={!certNumber.trim() || looking}
          >
            {looking ? <span className="spinner" /> : 'Look up'}
          </button>
        </div>
        {lookupError && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6, lineHeight: 1.5 }}>{lookupError}</div>}
      </div>

      {/* Lookup result */}
      {lookupResult && (
        <div className="lookup-result">
          <div className="lookup-found">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Coin found
          </div>
          <div className="lookup-name">{lookupResult.name}</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            <span className="badge badge-green">{lookupResult.grade}</span>
            {lookupResult.currentValue && <span className="badge badge-gold">${lookupResult.currentValue.toFixed(0)}</span>}
          </div>
          <div className="lookup-grid">
            {lookupResult.pcgsPopulation != null && (
              <div><div className="lookup-item-label">PCGS pop.</div><div className="lookup-item-val">{lookupResult.pcgsPopulation.toLocaleString()}</div></div>
            )}
            {lookupResult.mint && (
              <div><div className="lookup-item-label">Mint</div><div className="lookup-item-val">{lookupResult.mint}</div></div>
            )}
          </div>
        </div>
      )}

      <hr className="divider" />

      {/* Manual fields */}
      <div className="form-group"><label className="form-label">Coin name / series *</label><input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. 1964 50C Silver Proof" /></div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Year</label><input className="form-input" type="number" value={form.year} onChange={e => set('year', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Denomination</label><input className="form-input" value={form.denomination} onChange={e => set('denomination', e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Mint</label><input className="form-input" value={form.mint} onChange={e => set('mint', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Grade</label><input className="form-input" value={form.grade} onChange={e => set('grade', e.target.value)} /></div>
      </div>
      <div className="form-group">
        <label className="form-label">Strike type</label>
        <select className="form-select" value={form.strikeType} onChange={e => set('strikeType', e.target.value)}>
          {['Business', 'Proof', 'Business Satin Finish'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="form-group"><label className="form-label">Descriptors</label><input className="form-input" value={form.descriptors} onChange={e => set('descriptors', e.target.value)} placeholder="e.g. Accented Hair" /></div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Purchase price</label><input className="form-input" type="number" step="0.01" value={form.purchaseCost} onChange={e => set('purchaseCost', e.target.value)} placeholder="$0.00" /></div>
        <div className="form-group"><label className="form-label">Shipping</label><input className="form-input" type="number" step="0.01" value={form.shippingCost} onChange={e => set('shippingCost', e.target.value)} placeholder="$0.00" /></div>
      </div>
      <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
        <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleAdd} disabled={!canAdd}>Add to collection</button>
      </div>
    </>
  );
}
