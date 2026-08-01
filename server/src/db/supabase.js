/**
 * Cliente de Supabase para el servidor de juego.
 *
 * Usa la clave secreta (sb_secret_..., equivalente a service_role) — tiene
 * acceso total a la base de datos, ignorando Row Level Security. Por eso
 * SOLO debe vivir aquí, en el servidor (Render), nunca en el cliente
 * (GitHub Pages) ni en el repositorio de código.
 *
 * Variables de entorno esperadas (configuradas en Render, no en el código):
 *   SUPABASE_URL         → https://xxxxx.supabase.co
 *   SUPABASE_SECRET_KEY   → sb_secret_...
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

let supabase = null;

if (SUPABASE_URL && SUPABASE_SECRET_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false }, // el servidor no necesita sesión de usuario, solo acceso directo
  });
  console.log('[Supabase] Cliente inicializado, persistencia activa.');
} else {
  console.warn('[Supabase] SUPABASE_URL o SUPABASE_SECRET_KEY no configuradas — el servidor funcionará SIN persistencia (progreso no se guarda entre sesiones).');
}

module.exports = { supabase };
