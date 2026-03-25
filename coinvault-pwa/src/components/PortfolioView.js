import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);
const fmtFull = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v || 0);

export default function PortfolioView({ coins, soldCoins, onSelectCoin }) {
  const totalValue    = useMemo(() => coins.reduce((s, c) => s + (c.currentValue || 0), 0), [coins]);
  const totalCost     = useMemo(() => coins.reduce((s, c) => s + (c.purchaseCost || 0) + (c.shippingCost || 0), 0), [coins]);
  const unrealized    = totalValue - totalCost;
  const realized      = useMemo(() => soldCoins.reduce((s, c) => s + (c.salePrice - (c.purchaseCost || 0) - (c.shippingCost || 0)), 0), [soldCoins]);

  // By service
  const byService = useMemo(() => {
    const map = {};
    coins.forEach(c => {
      map[c.gradingService] = (map[c.gradingService] || 0) + (c.currentValue || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [coins]);

  // Top 5
  const topCoins = useMemo(() =>
    [...coins].filter(c => c.currentValue).sort((a, b) => b.currentValue - a.currentValue).slice(0, 5),
    [coins]
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
        <div className="stat-card">
          <div className="stat-label">Total value</div>
          <div className="stat-value">{fmt(totalValue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total cost</div>
          <div className="stat-value">{fmt(totalCost)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unrealized gain</div>
          <div className={`stat-value ${unrealized >= 0 ? 'pos' : 'neg'}`}>
            {unrealized >= 0 ? '+' : ''}{fmt(unrealized)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Realized gain</div>
          <div className={`stat-value ${realized >= 0 ? 'pos' : 'neg'}`}>
            {realized >= 0 ? '+' : ''}{fmt(realized)}
          </div>
        </div>
      </div>

      {/* Chart */}
      {byService.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>Value by grading service</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={byService} barSize={40}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text2)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v) => [fmtFull(v), 'Value']}
                contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text)' }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {byService.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#c9a84c' : i === 1 ? '#6ea8d8' : '#4caf82'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top 5 */}
      {topCoins.length > 0 && (
        <div className="card" style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Top 5 by value</div>
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

      {/* Missing values note */}
      {missing > 0 && (
        <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: '8px 0 16px' }}>
          {missing} coin{missing > 1 ? 's' : ''} have no value on record
        </div>
      )}
    </>
  );
}
