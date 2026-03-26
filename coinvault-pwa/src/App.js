import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import { fetchCoins, fetchSoldCoins, insertCoin, updateCoin, deleteCoin, insertSoldCoin, isSupabaseConfigured, getAdminPin, setAdminPin } from './lib/supabase';
import SEED_DATA from './seedData';
import CollectionView from './components/CollectionView';
import CoinDetailView from './components/CoinDetailView';
import AddCoinView from './components/AddCoinView';
import PortfolioView from './components/PortfolioView';
import SoldArchiveView from './components/SoldArchiveView';
import SettingsView from './components/SettingsView';
import AdminLoginModal from './components/AdminLoginModal';

export function getAdminSession() {
  return sessionStorage.getItem('coinvault_is_admin') === 'true';
}
export function setAdminSession(val) {
  if (val) sessionStorage.setItem('coinvault_is_admin', 'true');
  else sessionStorage.removeItem('coinvault_is_admin');
}

export default function App() {
  const [tab, setTab] = useState('collection');
  const [coins, setCoins] = useState([]);
  const [soldCoins, setSoldCoins] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(isSupabaseConfigured());
  const [adminMode, setAdminMode] = useState(getAdminSession());
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [cachedPin, setCachedPin] = useState(null);

  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setCoins(SEED_DATA.map((c, i) => ({ ...c, id: i + 1 })));
      setSoldCoins([]);
      setLoading(false);
      return;
    }
    try {
      const [c, s, pin] = await Promise.all([fetchCoins(), fetchSoldCoins(), getAdminPin()]);
      setCoins(c);
      setSoldCoins(s);
      if (!pin) {
        await setAdminPin('1234');
        setCachedPin('1234');
      } else {
        setCachedPin(pin);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleAdminLogin(pin) {
    const correct = cachedPin || '1234';
    if (pin === correct) {
      setAdminSession(true);
      setAdminMode(true);
      setShowAdminLogin(false);
      return true;
    }
    return false;
  }

  async function handleSavePin(newPin) {
    const ok = await setAdminPin(newPin);
    if (ok) setCachedPin(newPin);
    return ok;
  }

  function handleAdminLogout() {
    setAdminSession(false);
    setAdminMode(false);
  }

  async function handleAddCoin(coinData) {
    if (!isSupabaseConfigured()) {
      setCoins(prev => [{ ...coinData, id: Date.now() }, ...prev]);
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
    const soldEntry = { ...coin, salePrice: saleData.salePrice, saleDate: saleData.saleDate, soldTo: saleData.soldTo };
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

  if (loading) {
    r
