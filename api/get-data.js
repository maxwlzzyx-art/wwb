// api/get-data.js — Vercel Serverless Function
import { createClient } from '@supabase/supabase-js';

// ===== ENV VARIABLES (set in Vercel Dashboard) =====
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

// Default settings (fallback if Supabase table is empty)
const DEFAULT_SETTINGS = {
  web_title: 'AXELUF',
  web_subtitle: 'LINK MOD BERSIH DAN NO SCAM',
  web_logo: 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&q=80&w=200',
  web_background_image: 'none',
  web_banner_image: 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&q=1200',
  web_broadcast_text: '⚠️ Peringatan Keamanan: Unduh hanya dari portal resmi AXELUF | ⚡ Pembaruan: Semua paket mod telah diperbarui ke patch terbaru',
  web_safelink_time: '5',
  profile_alignment: 'items-start text-left',
  pinned_tags_db: [],
  credits_supabase_db: [],
  web_custom_presets_db: [],
  links_supabase_db: []
};

/**
 * Get all settings from Supabase
 * Returns a merged object: defaults + saved rows
 */
async function getAllSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value');

  if (error) {
    console.error('Supabase fetch error:', error);
    // If table doesn't exist yet, return defaults
    return DEFAULT_SETTINGS;
  }

  // Build settings object from rows
  const saved = {};
  data.forEach(row => {
    saved[row.key] = row.value;
  });

  // Merge with defaults (saved values override)
  return { ...DEFAULT_SETTINGS, ...saved };
}

/**
 * Set a single setting (upsert)
 */
async function setSetting(key, value) {
  // Convert value to JSON string if it's an object/array
  const storedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

  const { error } = await supabase
    .from('settings')
    .upsert({ key, value: storedValue }, { onConflict: 'key' });

  if (error) {
    console.error('Supabase upsert error:', error);
    throw new Error(`Failed to save setting: ${key}`);
  }

  return { key, value };
}

// ===== VERCEL HANDLER =====
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, ...payload } = req.body;

    switch (action) {
      case 'get_all_settings': {
        const settings = await getAllSettings();
        return res.status(200).json({ data: settings });
      }

      case 'set_setting': {
        const { key, value } = payload;
        if (!key) {
          return res.status(400).json({ error: 'Missing "key" parameter' });
        }
        const result = await setSetting(key, value);
        return res.status(200).json({ data: result });
      }

      default: {
        return res.status(400).json({ error: `Unknown action: ${action}` });
      }
    }
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}