import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || localStorage.getItem('sb_url') || '';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || localStorage.getItem('sb_key') || '';

export const isSupabaseConfigured = () =>
  SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 0;

export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export async function fetchCoins() {
  const { data, error } = await supabase
    .from('coins')
    .select('*')
    .order('current_value', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data || []).map(fromDb);
}

export async function insertCoin(coin) {
  const { data, error } = await supabase
    .from('coins')
    .insert([toDb(coin)])
    .select()
    .single();
  if (error) throw error;
  return fromDb(data);
}

export async function updateCoin(id, updates) {
  const { data, error } = await supabase
    .from('coins')
    .update(toDb(updates))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return fromDb(data);
}

export async function deleteCoin(id) {
  const { error } = await supabase.from('coins').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchSoldCoins() {
  const { data, error } = await supabase
    .from('sold_coins')
    .select('*')
    .order('sale_date', { ascending: false });
  if (error) throw error;
  return (data || []).map(fromDb);
}

export async function insertSoldCoin(sold) {
  const { data, error } = await supabase
    .from('sold_coins')
    .insert([soldToDb(sold)])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAdminPin() {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'admin_pin')
    .single();
  return data?.value || null;
}

export async function setAdminPin(pin) {
  if (!isSupabaseConfigured()) return false;
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: 'admin_pin', value: pin }, { onConflict: 'key' });
  return !error;
}

function toDb(c) {
  const out = {};
  if (c.year !== undefined) out.year = c.year;
  if (c.name !== undefined) out.name = c.name;
  if (c.denomination !== undefined) out.denomination = c.denomination;
  if (c.mint !== undefined) out.mint = c.mint;
  if (c.strikeType !== undefined) out.strike_type = c.strikeType;
  if (c.gradingService !== undefined) out.grading_service = c.gradingService;
  if (c.grade !== undefined) out.grade = c.grade;
  if (c.descriptors !== undefined) out.descriptors = c.descriptors;
  if (c.certNumber !== undefined) out.cert_number = c.certNumber;
  if (c.registryPoints !== undefined) out.registry_points = c.registryPoints;
  if (c.inRegistry !== undefined) out.in_registry = c.inRegistry;
  if (c.ngcPopulation !== undefined) out.ngc_population = c.ngcPopulation;
  if (c.pcgsPopulation !== undefined) out.pcgs_population = c.pcgsPopulation;
  if (c.currentValue !== undefined) out.current_value = c.currentValue;
  if (c.purchaseCost !== undefined) out.purchase_cost = c.purchaseCost;
  if (c.shippingCost !== undefined) out.shipping_cost = c.shippingCost;
  if (c.certURL !== undefined) out.cert_url = c.certURL;
  if (c.notes !== undefined) out.notes = c.notes;
  if (c.lastValueUpdate !== undefined) out.last_value_update = c.lastValueUpdate;
  return out;
}

function fromDb(r) {
  return {
    id: r.id,
    year: r.year,
    name: r.name,
    denomination: r.denomination,
    mint: r.mint,
    strikeType: r.strike_type,
    gradingService: r.grading_service,
    grade: r.grade,
    descriptors: r.descriptors,
    certNumber: r.cert_number,
    registryPoints: r.registry_points,
    inRegistry: r.in_registry,
    ngcPopulation: r.ngc_population,
    pcgsPopulation: r.pcgs_population,
    currentValue: r.current_value,
    purchaseCost: r.purchase_cost,
    shippingCost: r.shipping_cost || 0,
    certURL: r.cert_url,
    notes: r.notes,
    lastValueUpdate: r.last_value_update,
    dateAdded: r.created_at,
  };
}

function soldToDb(s) {
  return {
    year: s.year,
    name: s.name,
    denomination: s.denomination,
    mint: s.mint,
    strike_type: s.strikeType,
    grading_service: s.gradingService,
    grade: s.grade,
    descriptors: s.descriptors,
    cert_number: s.certNumber,
    purchase_cost: s.purchaseCost,
    shipping_cost: s.shippingCost || 0,
    cert_url: s.certURL,
    notes: s.notes,
    sale_price: s.salePrice,
    sale_date: s.saleDate,
    sold_to: s.soldTo,
  };
}
