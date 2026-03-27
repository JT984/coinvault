import React, { useState, useMemo } from 'react';

const SORT_OPTIONS = ['Value', 'Year', 'Grade', 'P/L', 'Name'];
const fmt = (v) => v != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '—';
const fmtPL = (v) => v != null ? (v >= 0 ? '+' : '') + fmt(v) : null;

export default function CollectionView({ coins, onSelectCoin, configured }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('Value');
  const [sortOpen, setSortOpen] = useState(false);

  const totalValue = useMemo(() => coins.reduce((s, c) => s + (c.currentValue || 0), 0), [coins]);
  const totalCost  = useMemo(() => coins.reduce((s, c) => s + (c.purchaseCost || 0) + (c.shippingCost || 0), 0), [coins]);
  const totalPL    = totalValue - totalCost;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = search
      ? coins.filter(c =>
          c.name?.toLowerCase().includes(q) ||
          c.certNumber?.toLowerCase().includes(q) ||
          c.grade?.toLowerCase().includes(q) ||
          c.mint?.toLowerCase().includes(q) ||
          String(c.year || '').includes(q)
        )
      : [...coins];

    switch (sort) {
      case 'Value': list.sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0)); break;
      case 'Year':  list.sort((a, b) => (b.year || 0) - (a.year || 0)); break;
      case 'Grade': list.sort((a, b) => (b.grade || '').localeCompare(a.grade || '')); break;
      case 'P/L': {
        const pl = c => (c.currentValue || 0) - (c.purchaseCost || 0) - (c.shippingCost || 0);
        list.sort((a, b) => pl(b) - pl(a));
        break;
      }
      case 'Name': list.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
      default: break;
    }
    return list;
  }, [coins, search, sort]);

  return (
    <>
      {!configured && (
        <div className="config-banner">
          ⚠️ Supabase not configured — showing local data. Go to Settings to connect.
        </div>
      )}

      {/* Portfolio banner */}
      <div className="portfolio-hero">
        <div className="portfolio-total-label">{coins.length} coins · portfolio value</div>
        <div className="portfolio-total">{fmt(totalValue)}</div>
        <div style={{ fontSize: 13, color: totalPL >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 2 }}>
          {fmtPL(totalPL)} vs. cost basis
        </div>
        <div className="portfolio-bar-track">
          <div className="portfolio-bar-fill" style={{ width: `${totalCost > 0 ? Math.min((totalValue / (totalValue + totalCost)) * 100, 100) : 0}%` }} />
        </div>
      </div>

      {/* Search + sort toggle row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: sortOpen ? 8 : 12 }}>
        <div className="search-wrap" style={{ flex: 1, marginBottom: 0 }}>
          <SearchIcon />
          <input className="search-input" placeholder="Search coins…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button
          onClick={() => setSortOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: sortOpen ? 'var(--gold-bg2)' : 'var(--surface2)',
            border: `1px solid ${sortOpen ? 'var(--gold-dim)' : 'var(--border)'}`,
            color: sortOpen ? 'var(--gold)' : 'var(--text2)',
            borderRadius: 'var(--radius-sm)', padding: '0 12px',
            height: 38, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          <SortIcon />
          {sort}
        </button>
      </div>

      {/* Sort chips — only visible when open */}
      {sortOpen && (
        <div className="chip-row" style={{ marginBottom: 12 }}>
          {SORT_OPTIONS.map(o => (
            <button
              key={o}
              className={`chip ${sort === o ? 'active' : ''}`}
              onClick={() => { setSort(o); setSortOpen(false); }}
            >
              {o}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div className="card" style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🪙</div>
            <div className="empty-title">No coins found</div>
            <div className="empty-sub">Try a different search term</div>
          </div>
        ) : (
          filtered.map(coin => (
            <CoinRow key={coin.id} coin={coin} onClick={() => onSelectCoin(coin)} />
          ))
        )}
      </div>
    </>
  );
}

function CoinRow({ coin, onClick }) {
  const pl = (coin.currentValue || 0) - (coin.purchaseCost || 0) - (coin.shippingCost || 0);
  const hasPL = coin.currentValue != null && coin.purchaseCost != null;
  return (
    <div className="coin-row" onClick={onClick}>
      <div className="coin-avatar">🪙</div>
      <div className="coin-info">
        <div className="coin-name">{coin.name}</div>
        <div className="coin-meta">{coin.mint} · {coin.gradingService}</div>
      </div>
      <div className="coin-right">
        <div style={{ marginBottom: 4 }}>
          <span className="badge badge-green">{coin.grade}</span>
        </div>
        {coin.currentValue != null && <div className="coin-value">{fmt(coin.currentValue)}</div>}
        {hasPL && <div className={`coin-pl ${pl >= 0 ? 'pos' : 'neg'}`}>{fmtPL(pl)}</div>}
      </div>
    </div>
  );
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
}

function SortIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/></svg>;
}
