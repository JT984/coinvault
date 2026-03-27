import React, { useState } from 'react';
import { lookupPCGS, loadPCGSCreds } from '../lib/pcgs';

const fmt = (v) => v != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v) : '—';
const fmtPL = (v) => v != null ? (v >= 0 ? '+' : '') + fmt(v) : null;

function ngcCertURL(certNumber) {
  const clean = (certNumber || '').replace(/[-\s]/g, '');
  return `https://www.ngccoin.com/certlookup/${clean}/`;
}
function pcgsCertURL(certNumber) {
  const clean = (certNumber || '').replace(/[-\s]/g, '');
  return `https://www.pcgs.com/cert/${clean}`;
}

export default function CoinDetailView({ coin, onBack, onUpdate, onSell, adminMode }) {
  const [showSell, setShowSell] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState('');

  const totalCost = (coin.purchaseCost || 0) + (coin.shippingCost || 0);
  const pl = coin.currentValue != null ? coin.currentValue - totalCost : null;

  const certLink = coin.gradingService === 'NGC'
    ? ngcCertURL(coin.certNumber)
    : coin.gradingService === 'PCGS'
      ? pcgsCertURL(coin.certNumber)
      : coin.certURL || null;

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshMsg('');
    try {
      if (coin.gradingService === 'PCGS') {
        const creds = loadPCGSCreds();
        if (!creds?.clientId) { setRefreshMsg('PCGS credentials not set — go to Settings to add them.'); return; }
        const result = await lookupPCGS(coin.certNumber, creds);
        if (result?.currentValue) {
          await onUpdate(coin.id, { currentValue: result.currentValue, lastValueUpdate: new Date().toISOString() });
          setRefreshMsg(`Updated to ${fmt(result.currentValue)}`);
        } else {
          setRefreshMsg('No updated value found from PCGS.');
        }
      } else {
        window.open(ngcCertURL(coin.certNumber), '_blank', 'noopener,noreferrer');
        setRefreshMsg('Opened NGC cert page — update the value manually if it has changed.');
      }
    } catch (e) {
      setRefreshMsg('Refresh failed: ' + e.message);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <>
      {/* Back nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingTop: 'max(0px, env(safe-area-inset-top))', minHeight: 44 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 15, padding: '8px 8px 8px 0', minWidth: 44, minHeight: 44 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          Back
        </button>
        <div style={{ flex: 1 }} />
        {adminMode && (
          <button onClick={() => setShowEdit(true)} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 15, padding: '8px 0 8px 8px', minHeight: 44 }}>Edit</button>
        )}
      </div>

      {/* Hero — grade prominently displayed */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>🪙</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text)', marginBottom: 8 }}>{coin.name}</h1>
        {coin.descriptors && <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10 }}>{coin.descriptors}</div>}
        {/* Grade — large and prominent */}
        <div style={{
          display: 'inline-block',
          fontSize: 28, fontWeight: 700,
          color: 'var(--gold)',
          background: 'var(--gold-bg)',
          border: '1px solid var(--gold-dim)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 20px',
          marginBottom: 10,
          letterSpacing: '0.04em',
        }}>
          {coin.grade}
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
          <span className="badge badge-gold">{coin.gradingService}</span>
          <span className="badge badge-blue">{coin.strikeType}</span>
        </div>
      </div>

      {/* Value card */}
      <div className="value-hero">
        <div className="value-hero-label">Current value</div>
        <div className="value-hero-amount">{coin.currentValue != null ? fmt(coin.currentValue) : '—'}</div>
        {pl != null && (
          <div className="value-hero-pl" style={{ color: pl >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {fmtPL(pl)} · cost basis {fmt(totalCost)}
          </div>
        )}
        {coin.lastValueUpdate && (
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
            Updated {new Date(coin.lastValueUpdate).toLocaleDateString()}
          </div>
        )}
      </div>

      <button className="btn btn-refresh" onClick={handleRefresh} disabled={refreshing} style={{ marginBottom: refreshMsg ? 4 : 8 }}>
        {refreshing ? <span className="spinner" /> : <RefreshIcon />}
        {coin.gradingService === 'PCGS' ? 'Refresh value from PCGS' : 'View on NGC to check value'}
      </button>
      {refreshMsg && <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'center', marginBottom: 8, padding: '0 8px' }}>{refreshMsg}</div>}

      {/* Coin info — grade included as a row */}
      <div className="detail-group">
        <div className="detail-group-label">Coin info</div>
        <DetailRow label="Cert #" value={coin.certNumber} />
        <DetailRow label="Year" value={coin.year} />
        <DetailRow label="Denomination" value={coin.denomination} />
        <DetailRow label="Mint" value={coin.mint} />
        <DetailRow label="Strike" value={coin.strikeType} />
        <DetailRow label="Grade" value={coin.grade} highlight />
        {coin.descriptors && <DetailRow label="Descriptors" value={coin.descriptors} />}
      </div>

      {/* Registry */}
      <div className="detail-group">
        <div className="detail-group-label">Registry & population</div>
        <DetailRow label="Service" value={coin.gradingService} />
        <DetailRow label="In registry" value={coin.inRegistry ? 'Yes' : 'No'} />
        {coin.registryPoints != null && <DetailRow label="Registry points" value={coin.registryPoints.toLocaleString()} />}
        {coin.ngcPopulation != null && <DetailRow label="NGC population" value={coin.ngcPopulation.toLocaleString()} />}
        {coin.pcgsPopulation != null && <DetailRow label="PCGS population" value={coin.pcgsPopulation.toLocaleString()} />}
        {certLink && (
          <div className="detail-row">
            <span className="detail-label">Cert link</span>
            <a href={certLink} target="_blank" rel="noopener noreferrer" className="detail-link"
              onClick={e => { e.preventDefault(); window.open(certLink, '_blank', 'noopener,noreferrer'); }}>
              View on {coin.gradingService} ›
            </a>
          </div>
        )}
      </div>

      {/* Financials */}
      <div className="detail-group">
        <div className="detail-group-label">Financials</div>
        <DetailRow label="Purchase cost" value={fmt(coin.purchaseCost)} />
        <DetailRow label="Shipping" value={fmt(coin.shippingCost)} />
        <DetailRow label="Total cost" value={fmt(totalCost)} />
        {pl != null && (
          <div className="detail-row">
            <span className="detail-label">Unrealized gain/loss</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: pl >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtPL(pl)}</span>
          </div>
        )}
      </div>

      {/* Notes */}
      {coin.notes && (
        <div className="detail-group">
          <div className="detail-group-label">Notes</div>
          <div style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{coin.notes}</div>
        </div>
      )}

      {adminMode && (
        <button className="btn btn-danger" onClick={() => setShowSell(true)} style={{ marginTop: 8, marginBottom: 32 }}>
          <TagIcon /> Mark as sold
        </button>
      )}
      {!adminMode && (
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 16, marginBottom: 32 }}>
          Read-only — log in as admin to edit or sell
        </div>
      )}

      {showSell && adminMode && (
        <SellSheet coin={coin} totalCost={totalCost} onClose={() => setShowSell(false)}
          onConfirm={(saleData) => { setShowSell(false); onSell(coin, saleData); }} />
      )}
      {showEdit && adminMode && (
        <EditSheet coin={coin} onClose={() => setShowEdit(false)}
          onSave={(updates) => { onUpdate(coin.id, updates); setShowEdit(false); }} />
      )}
    </>
  );
}

function SellSheet({ coin, totalCost, onClose, onConfirm }) {
  const [salePrice, setSalePrice] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [soldTo, setSoldTo] = useState('');
  const price = parseFloat(salePrice) || null;
  const gain = price != null ? price - totalCost : null;
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">Mark as sold</div>
        <div className="sheet-sub">{coin.name} · {coin.grade}</div>
        <div className="form-group"><label className="form-label">Sale price</label><input className="form-input" type="number" min="0" step="0.01" placeholder="$0.00" value={salePrice} onChange={e => setSalePrice(e.target.value)} autoFocus /></div>
        <div className="form-group"><label className="form-label">Sale date</label><input className="form-input" type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Sold to</label><input className="form-input" type="text" placeholder="e.g. eBay, Heritage Auctions, dealer..." value={soldTo} onChange={e => setSoldTo(e.target.value)} /></div>
        {gain != null && (
          <div className={`gain-preview ${gain < 0 ? 'loss' : ''}`}>
            <div className="gain-preview-label">Realized gain/loss</div>
            <div className={`gain-preview-amount ${gain >= 0 ? 'pos' : 'neg'}`}>{gain >= 0 ? '+' : ''}{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(gain)}</div>
            <div className="gain-preview-calc">${parseFloat(salePrice).toFixed(2)} sale − ${totalCost.toFixed(2)} cost basis</div>
          </div>
        )}
        <button className="btn btn-primary" disabled={!price} onClick={() => onConfirm({ salePrice: price, saleDate, soldTo })}>Confirm sale</button>
      </div>
    </div>
  );
}

function EditSheet({ coin, onClose, onSave }) {
  const [form, setForm] = useState({
    name: coin.name || '', year: coin.year || '', denomination: coin.denomination || '',
    mint: coin.mint || '', strikeType: coin.strikeType || '', gradingService: coin.gradingService || '',
    grade: coin.grade || '', descriptors: coin.descriptors || '', certNumber: coin.certNumber || '',
    certURL: coin.certURL || '', currentValue: coin.currentValue || '', purchaseCost: coin.purchaseCost || '',
    shippingCost: coin.shippingCost || '', notes: coin.notes || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  function handleSave() {
    onSave({ ...form, year: form.year ? parseInt(form.year) : null, currentValue: form.currentValue ? parseFloat(form.currentValue) : null, purchaseCost: form.purchaseCost ? parseFloat(form.purchaseCost) : null, shippingCost: parseFloat(form.shippingCost) || 0, lastValueUpdate: form.currentValue ? new Date().toISOString() : coin.lastValueUpdate });
  }
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">Edit coin</div>
        <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Year</label><input className="form-input" type="number" value={form.year} onChange={e => set('year', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Denomination</label><input className="form-input" value={form.denomination} onChange={e => set('denomination', e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Mint</label><input className="form-input" value={form.mint} onChange={e => set('mint', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Grade</label><input className="form-input" value={form.grade} onChange={e => set('grade', e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Service</label>
            <select className="form-select" value={form.gradingService} onChange={e => set('gradingService', e.target.value)}>
              {['NGC','PCGS','ANACS'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Strike</label>
            <select className="form-select" value={form.strikeType} onChange={e => set('strikeType', e.target.value)}>
              {['Business','Proof','Business Satin Finish'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Descriptors</label><input className="form-input" value={form.descriptors} onChange={e => set('descriptors', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Cert number</label><input className="form-input" value={form.certNumber} onChange={e => set('certNumber', e.target.value)} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Current value</label><input className="form-input" type="number" step="0.01" value={form.currentValue} onChange={e => set('currentValue', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Purchase cost</label><input className="form-input" type="number" step="0.01" value={form.purchaseCost} onChange={e => set('purchaseCost', e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">Shipping</label><input className="form-input" type="number" step="0.01" value={form.shippingCost} onChange={e => set('shippingCost', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-val" style={highlight ? { color: 'var(--gold)', fontWeight: 700, fontSize: 15 } : {}}>{value ?? '—'}</span>
    </div>
  );
}
function RefreshIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>; }
function TagIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>; }
