import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const DEFAULT_SETTINGS = {
  web_title: "AXELUF",
  web_subtitle: "LINK MOD BERSIH DAN NO SCAM",
  web_logo: "https://cdn.discordapp.com/attachments/1460944238773797027/1520853234502205631/39616d00fc778ee5fcb60e69142ab6ba.jpg?ex=6a455773&is=6a4405f3&hm=43fc584c70e6dd191ec467fefe73233930c7cfe033179fa438149b8bc5a168b2&",
  web_background_image: "none",
  web_banner_image: "https://cdn.discordapp.com/attachments/1460944238773797027/1521578537457422576/file_00000000b9647208b2c130ea7bee9dc5.png?ex=6a4557f0&is=6a440670&hm=6c9df45e2d6aba6779a749e17a6461c937a25a43be6b3627984aa2f690e9ab9a&",
  web_broadcast_text: "⚠️ Peringatan Keamanan: Unduh hanya dari portal resmi AXELUF",
  web_safelink_time: "5",
  profile_alignment: "items-start text-left",
  pinned_tags_db: [],
  credits_supabase_db: [],
  web_custom_presets_db: [],
  links_supabase_db: []
};

async function getAllSettings() {
  const { data, error } = await supabase
    .from("settings")
    .select("key,value");

  if (error) return DEFAULT_SETTINGS;

  const settings = { ...DEFAULT_SETTINGS };

  for (const row of data) {
    let value = row.value;

    if (
      row.key === "links_supabase_db" ||
      row.key === "credits_supabase_db" ||
      row.key === "pinned_tags_db" ||
      row.key === "web_custom_presets_db"
    ) {
      try {
        value = JSON.parse(value);
      } catch {}
    }

    settings[row.key] = value;
  }

  return settings;
}

async function setSetting(key, value) {
  await supabase
    .from("settings")
    .upsert(
      {
        key,
        value:
          typeof value === "object"
            ? JSON.stringify(value)
            : String(value)
      },
      {
        onConflict: "key"
      }
    );
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return res.status(200).json(await getAllSettings());
    }

    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed"
      });
    }

    const { action, key, value } = req.body;

    if (action === "get_all_settings") {
      return res.status(200).json({
        data: await getAllSettings()
      });
    }

    if (action === "set_setting") {
      await setSetting(key, value);

      return res.status(200).json({
        success: true
      });
    }

    return res.status(400).json({
      error: "Unknown action"
    });

  } catch (e) {
    console.error(e);

    return res.status(500).json({
      error: e.message
    });
  }
}
