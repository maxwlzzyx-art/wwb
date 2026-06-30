// api/get-data.js — Vercel Serverless Function
import { createClient } from '@supabase/supabase-js';

// ===== ENV VARIABLES =====
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

// Default settings
const DEFAULT_SETTINGS = {
  web_title: 'AXELUF',
  web_subtitle: 'LINK MOD BERSIH DAN NO SCAM',
  web_logo: 'https://cdn.discordapp.com/attachments/1460944238773797027/1520853234502205631/39616d00fc778ee5fcb60e69142ab6ba.jpg?ex=6a455773&is=6a4405f3&hm=43fc584c70e6dd191ec467fefe73233930c7cfe033179fa438149b8bc5a168b2&',
  web_background_image: 'none',
  web_banner_image: 'https://cdn.discordapp.com/attachments/1460944238773797027/1521578537457422576/file_00000000b9647208b2c130ea7bee9dc5.png?ex=6a4557f0&is=6a440670&hm=6c9df45e2d6aba6779a749e17a6461c937a25a43be6b3627984aa2f690e9ab9a&',
  web_broadcast_text: '⚠️ Peringatan Keamanan: Unduh hanya dari portal resmi AXELUF',
  web_safelink_time: '5',
  profile_alignment: 'items-start text-left',
  pinned_tags_db: [],
  credits_supabase_db: [],
  web_custom_presets_db: [],
  links_supabase_db: []
};

async function getAllSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('key,value');

  if (error) {
    console.error(error);
    return DEFAULT_SETTINGS;
  }

  const settings = { ...DEFAULT_SETTINGS };

  for (const row of data) {
    let value = row.value;

    try {
      if (
        row.key.endsWith('_db') ||
        row.key === 'links_supabase_db' ||
        row.key === 'credits_supabase_db' ||
        row.key === 'pinned_tags_db' ||
        row.key === 'web_custom_presets_db'
      ) {
        value = JSON.parse(value);
      }
    } catch {}

    settings[row.key] = value;
  }

  return settings;
}

async function setSetting(key, value) {
  const stored =
    typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);

  const { error } = await supabase
    .from('settings')
    .upsert(
      { key, value: stored },
      { onConflict: 'key' }
    );

  if (error) throw error;

  return true;
}

export default async function handler(req, res) {
  try {
    // GET
    if (req.method === 'GET') {
      const settings = await getAllSettings();
      return res.status(200).json(settings);
    }

    // POST
    if (req.method === 'POST') {
      const { action, key, value } = req.body;

      if (action === 'get_all_settings') {
        const settings = await getAllSettings();
        return res.status(200).json(settings);
      }

      if (action === 'set_setting') {
        await setSetting(key, value);
        return res.json({
          success: true
        });
      }

      return res.status(400).json({
        error: 'Unknown action'
      });
    }

    return res.status(405).json({
      error: 'Method not allowed'
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
}    .select('key, value');

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
