import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);
const fmtFull = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v || 0);

const GRADE_COLORS = ['#c9a84c','#6ea8d8','#4caf82','#e05c5c','#a06cd5','#e8a838','#5bc8c8','#e87878'];

export default function PortfolioView({ coins, soldCoins, onSelectCoin }) {
  const [selectedDenom, setSelectedDenom] = useState('All');

  const totalValue  = useMemo(() => coins.reduce((s, c) => s + (c.currentValue || 0), 0), [coins]);
  const totalCost   = useMemo(() => coins.reduce((s, c) => s + (c.purchaseCost || 0) + (c.shippingCost || 0), 0), [coins]);
  const unrealized  = totalValue - totalCost;
  const realized    = useMemo(() => soldCoins.reduce((s, c) => s + (c.salePrice - (c.purchaseCost || 0) - (c.shippingCost || 0)), 0), [soldCoins]);

  // All unique denominations
  const denoms = useMemo(() => {
    const d = [...new Set(coins.map(c => c.denomination).filter(Boolean))].sort();
    return ['All', ...d];
  }, [coins]);

  // Filtered coins by denomination
  const filteredCoins = useMemo(() =>
    selectedDenom === 'All' ? coins : coins.filter(c => c.denomination === selectedDenom),
    [coins, selectedDenom]
  );

  // Value by grade for filtered coins
  const byGrade = useMemo(() => {
    const map = {};
    filteredCoins.forEach(c => {
      if (!c.grade) return;
      map[c.grade] = (map[c.grade] || 0) + (c.currentValue || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12); // cap at 12 grades for readability
  }, [filteredCoins]);

  // Top 5 for filtered coins
  const topCoins = useMemo(() =>
    [...filteredCoins].filter(c => c.currentValue).sort((a, b) => b.currentValue - a.currentValue).slice(0, 5),
    [filteredCoins]
  );

  const missing = coins.filter(c => !c.currentValue).length;

  return (
    <>
      <div className="page-header">
        <div className="page-title">Portfolio</div>
        <div className="page-sub">{coins.length} active coins</div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Total value</div><div className="stat-value">{fmt(totalValue)}</div></div>
        <div className="stat-card"><div className="stat-label">Total cost</div><div className="stat-value">{fmt(totalCost)}</div></div>
        <div className="stat-card">
          <div className="stat-label">Unrealized gain</div>
          <div className={`stat-value ${unrealized >= 0 ? 'pos' : 'neg'}`}>{unrealized >= 0 ? '+' : ''}{fmt(unrealized)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Realized gain</div>
          <div className={`stat-value ${realized >= 0 ? 'pos' : 'neg'}`}>{realized >= 0 ? '+' : ''}{fmt(realized)}</div>
        </div>
      </div>

      {/* Denomination filter */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Filter by denomination</div>
        <div className="chip-row">
          {denoms.map(d => (
            <button
              key={d}
              className={`chip ${selectedDenom === d ? 'active' : ''}`}
              onClick={() => setSelectedDenom(d)}
            >
              {d === '1' ? '$1' : d === '50C' ? '50¢' : d === '25C' ? '25¢' : d === '10C' ? '10¢' : d === '5C' ? '5¢' : d === '1C' ? '1¢' : d}
            </button>
          ))}
        </div>
      </div>

      {/* Grade chart */}
      {byGrade.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>
            Value by grade{selectedDenom !== 'All' ? ` · ${selectedDenom}` : ''}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byGrade} barSize={28} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} axisLine={false} tickLine={false} interval={0} />
              <YAxis hide />
              <Tooltip
                formatter={(v) => [fmtFull(v), 'Value']}
                contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text)' }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {byGrade.map((_, i) => (
                  <Cell key={i} fill={GRADE_COLORS[i % GRADE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top 5 */}
      {topCoins.length > 0 && (
        <div className="card" style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
            Top 5 by value{selectedDenom !== 'All' ? ` · ${selectedDenom}` : ''}
          </div>
          {topCoins.map((coin, i) => {
            const pl = coin.currentValue - (coin.purchaseCost || 0) - (coin.shippingCost || 0);
            return (
              <div key={coin.id} className="coin-row" onClick={() => onSelectCoin(coin)}>
                <div style={{ width: 24, fontSize: 13, color: 'var(--text3)', fontWeight: 600, flexShrink: 0 }}>#{i + 1}</div>
                <div className="coin-info">
                  <div className="coin-name">{coin.name}</div>
                  <div className="coin-meta">{coin.grade} · {coin.gradingService}</div>
                </div>
                <div className="coin-right">
                  <div className="coin-value">{fmt(coin.currentValue)}</div>
                  <div className={`coin-pl ${pl >= 0 ? 'pos' : 'neg'}`}>{pl >= 0 ? '+' : ''}{fmt(pl)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {missing > 0 && (
        <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: '8px 0 16px' }}>
          {missing} coin{missing > 1 ? 's' : ''} have no value on record
        </div>
      )}
    </>
  );
}
