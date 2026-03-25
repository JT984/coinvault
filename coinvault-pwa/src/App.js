import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import { fetchCoins, fetchSoldCoins, insertCoin, updateCoin, deleteCoin, insertSoldCoin, isSupabaseConfigured } from './lib/supabase';
import SEED_DATA from './seedData';
import CollectionView from './components/CollectionView';
import CoinDetailView from './components/CoinDetailView';
import AddCoinView from './components/AddCoinView';
import PortfolioView from './components/PortfolioView';
import SoldArchiveView from './components/SoldArchiveView';
import SettingsView from './components/SettingsView';

const TABS = ['collection', 'portfolio', 'add', 'sold', 'settings'];

export default function App() {
  const [tab, setTab] = useState('collection');
  const [coins, setCoins] = useState([]);
  const [soldCoins, setSoldCoins] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(isSupabaseConfigured());

  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      // Fallback: use seed data in local state only
      setCoins(SEED_DATA.map((c, i) => ({ ...c, id: i + 1 })));
      setSoldCoins([]);
      setLoading(false);
      return;
    }
    try {
      const [c, s] = await Promise.all([fetchCoins(), fetchSoldCoins()]);
      setCoins(c);
      setSoldCoins(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Coin actions ──────────────────────────────────────────────────────────

  async function handleAddCoin(coinData) {
    if (!isSupabaseConfigured()) {
      const newCoin = { ...coinData, id: Date.now() };
      setCoins(prev => [newCoin, ...prev]);
      setTab('collection');
      return;
    }
    const saved = await insertCoin(coinData);
    setCoins(prev => [saved, ...prev]);
    setTab('collection');
  }

  async function handleUpdateCoin(id, updates) {
    if (!isSupabaseConfigured()) {
      setCoins(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      if (selectedCoin?.id === id) setSelectedCoin(prev => ({ ...prev, ...updates }));
      return;
    }
    const updated = await updateCoin(id, updates);
    setCoins(prev => prev.map(c => c.id === id ? updated : c));
    if (selectedCoin?.id === id) setSelectedCoin(updated);
  }

  async function handleSellCoin(coin, saleData) {
    const soldEntry = {
      ...coin,
      salePrice: saleData.salePrice,
      saleDate: saleData.saleDate,
      soldTo: saleData.soldTo,
    };
    if (!isSupabaseConfigured()) {
      setCoins(prev => prev.filter(c => c.id !== coin.id));
      setSoldCoins(prev => [{ ...soldEntry, id: Date.now() }, ...prev]);
      setSelectedCoin(null);
      setTab('collection');
      return;
    }
    await insertSoldCoin(soldEntry);
    await deleteCoin(coin.id);
    setCoins(prev => prev.filter(c => c.id !== coin.id));
    setSoldCoins(prev => [soldEntry, ...prev]);
    setSelectedCoin(null);
    setTab('collection');
  }

  function openCoin(coin) {
    setSelectedCoin(coin);
  }

  function closeCoin() {
    setSelectedCoin(null);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <span style={{ color: 'var(--text2)', fontSize: 14 }}>Loading your collection…</span>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Main content */}
      <div className="page">
        {selectedCoin ? (
          <CoinDetailView
            coin={selectedCoin}
            onBack={closeCoin}
            onUpdate={handleUpdateCoin}
            onSell={handleSellCoin}
          />
        ) : tab === 'collection' ? (
          <CollectionView coins={coins} onSelectCoin={openCoin} configured={configured} />
        ) : tab === 'portfolio' ? (
          <PortfolioView coins={coins} soldCoins={soldCoins} onSelectCoin={openCoin} />
        ) : tab === 'add' ? (
          <AddCoinView onAdd={handleAddCoin} onCancel={() => setTab('collection')} />
        ) : tab === 'sold' ? (
          <SoldArchiveView soldCoins={soldCoins} />
        ) : (
          <SettingsView onConfigured={() => { setConfigured(true); loadData(); }} />
        )}
      </div>

      {/* Tab bar — hidden when viewing coin detail */}
      {!selectedCoin && (
        <nav className="tab-bar">
          <TabItem icon={<CollectionIcon />} label="Collection" active={tab === 'collection'} onClick={() => setTab('collection')} />
          <TabItem icon={<PortfolioIcon />} label="Portfolio"  active={tab === 'portfolio'} onClick={() => setTab('portfolio')} />
          <TabItem icon={<AddIcon />}        label="Add Coin"  active={tab === 'add'}        onClick={() => setTab('add')} />
          <TabItem icon={<SoldIcon />}       label="Sold"      active={tab === 'sold'}       onClick={() => setTab('sold')} />
          <TabItem icon={<SettingsIcon />}   label="Settings"  active={tab === 'settings'}   onClick={() => setTab('settings')} />
        </nav>
      )}
    </div>
  );
}

function TabItem({ icon, label, active, onClick }) {
  return (
    <button className={`tab-item ${active ? 'active' : ''}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────

function CollectionIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>;
}
function PortfolioIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 3v9l5 3"/></svg>;
}
function AddIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>;
}
function SoldIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 8h14M5 12h9M5 16h6"/><path d="M19 14l-4 4 2 2 4-4-2-2z"/></svg>;
}
function SettingsIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
