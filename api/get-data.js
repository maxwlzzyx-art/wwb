// api/get-data.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error('Missing Supabase env vars');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

const DEFAULT_SETTINGS = { /* ... tetap sama ... */ };

async function getAllSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value');
  
  // 🔥 CETAK ERROR KE CONSOLE LOG VERCELL
  if (error) {
    console.error('❌ Supabase select error:', error);
    return DEFAULT_SETTINGS;
  }

  const saved = {};
  data.forEach(row => { saved[row.key] = row.value; });
  return { ...DEFAULT_SETTINGS, ...saved };
}

async function setSetting(key, value) {
  const storedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value: storedValue }, { onConflict: 'key' });
  
  // 🔥 CETAK ERROR KE CONSOLE LOG VERCELL
  if (error) {
    console.error('❌ Supabase upsert error:', error);
    throw new Error(`Gagal menyimpan ${key}: ${error.message}`);
  }
  return { key, value };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, ...payload } = req.body;
    console.log('📥 Action:', action); // 🔥 Log action

    switch (action) {
      case 'get_all_settings': {
        const settings = await getAllSettings();
        return res.status(200).json({ data: settings });
      }
      case 'set_setting': {
        const { key, value } = payload;
        if (!key) return res.status(400).json({ error: 'Missing key' });
        const result = await setSetting(key, value);
        return res.status(200).json({ data: result });
      }
      default: {
        return res.status(400).json({ error: `Unknown action: ${action}` });
      }
    }
  } catch (err) {
    console.error('💥 API Error:', err); // 🔥 Log error
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
