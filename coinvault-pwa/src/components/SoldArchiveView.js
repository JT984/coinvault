import React, { useState, useMemo } from 'react';

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);

export default function SoldArchiveView({ soldCoins }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return search
      ? soldCoins.filter(c =>
          c.name?.toLowerCase().includes(q) ||
          c.soldTo?.toLowerCase().includes(q) ||
          c.certNumber?.toLowerCase().includes(q)
        )
      : soldCoins;
  }, [soldCoins, search]);

  const totalProceeds = useMemo(() => soldCoins.reduce((s, c) => s + (c.salePrice || 0), 0), [soldCoins]);
  const totalGain     = useMemo(() => soldCoins.reduce((s, c) => s + (c.salePrice - (c.purchaseCost || 0) - (c.shippingCost || 0)), 0), [soldCoins]);
  const avgGain       = soldCoins.length ? totalGain / soldCoins.length : 0;

  return (
    <>
      <div className="page-header">
        <div className="page-title">Sold coins</div>
      </div>

      {soldCoins.length > 0 && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Total sold</div>
            <div className="stat-value">{soldCoins.length} coins</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Realized gains</div>
            <div className={`stat-value ${totalGain >= 0 ? 'pos' : 'neg'}`}>{totalGain >= 0 ? '+' : ''}{fmt(totalGain)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total proceeds</div>
            <div className="stat-value">{fmt(totalProceeds)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg gain/coin</div>
            <div className={`stat-value ${avgGain >= 0 ? 'pos' : 'neg'}`}>{avgGain >= 0 ? '+' : ''}{fmt(avgGain)}</div>
          </div>
        </div>
      )}

      <div className="search-wrap">
        <SearchIcon />
        <input className="search-input" placeholder="Search sold coins…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {soldCoins.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <div className="empty-title">No sold coins yet</div>
          <div className="empty-sub">When you sell a coin, it will appear here with your realized gain and sale details.</div>
        </div>
      ) : (
        <div className="card" style={{ padding: '0 16px' }}>
          {filtered.map((sold, i) => {
            const gain = (sold.salePrice || 0) - (sold.purchaseCost || 0) - (sold.shippingCost || 0);
            const date = sold.saleDate ? new Date(sold.saleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
            return (
              <div key={sold.id || i} className="coin-row" style={{ cursor: 'default' }}>
                <div className="coin-avatar sold">🪙</div>
                <div className="coin-info">
                  <div className="coin-name">{sold.name}</div>
                  <div className="coin-meta">
                    {date}{sold.soldTo ? ` · ${sold.soldTo}` : ''}
                  </div>
                </div>
                <div className="coin-right">
                  <div className="coin-value">{fmt(sold.salePrice)}</div>
                  <div className={`coin-pl ${gain >= 0 ? 'pos' : 'neg'}`}>{gain >= 0 ? '+' : ''}{fmt(gain)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
}
