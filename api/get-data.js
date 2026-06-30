import { createClient } from '@supabase/supabase-js';

// Mengambil konfigurasi kredensial dari Environment Variables Vercel yang sudah kamu pasang
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  // CORS Headers agar bisa diakses secara aman
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
    // Aksi untuk mengambil seluruh data setting dari database Supabase
    if (action === 'get_all_settings') {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');

      if (error) throw error;

      // Mapping data array menjadi objek dictionary sederhana
      const settingsMap = {};
      data.forEach(item => {
        settingsMap[item.key] = item.value;
      });

      return res.status(200).json({
        success: true,
        data: settingsMap
      });
    }

    // Aksi untuk memperbarui atau menyisipkan satu set data setting baru
    if (action === 'set_setting') {
      if (!key) {
        return res.status(400).json({ success: false, message: "Kunci tidak boleh kosong!" });
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

    return res.status(400).json({ success: false, message: "Aksi tidak dikenali." });

  } catch (err) {
    console.error("Supabase Backend Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Gagal berinteraksi dengan Supabase Cloud Database",
      error: err.message
    });
  }
}
