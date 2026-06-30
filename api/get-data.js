import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  // Setel CORS Header secara manual agar browser tidak memblokir rute API Anda
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: "Metode HTTP tidak diizinkan. Gunakan POST." });
  }

  const { action, key, value } = req.body;

  try {
    if (action === 'get_all_settings') {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');

      if (error) throw error;

      // Ubah dari bentuk larik menjadi objek kamus agar mudah dibaca oleh index.html
      const settingsMap = {};
      data.forEach(item => {
        settingsMap[item.key] = item.value;
      });

      return res.status(200).json({
        success: true,
        data: settingsMap
      });
    }

    if (action === 'set_setting') {
      if (!key) {
        return res.status(400).json({ success: false, message: "Kunci konfigurasi tidak boleh kosong!" });
      }

      const { data, error } = await supabase
        .from('settings')
        .upsert({ key: key, value: value }, { onConflict: 'key' })
        .select();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: data
      });
    }

    return res.status(400).json({ success: false, message: "Aksi tidak dikenali oleh sistem." });

  } catch (err) {
    console.error("Supabase Backend Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Gagal berinteraksi dengan Supabase Cloud Database",
      error: err.message
    });
  }
}
