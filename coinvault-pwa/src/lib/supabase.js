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
