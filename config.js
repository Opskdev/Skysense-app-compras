// ============================================================================
//  CONFIGURACION DE SUPABASE
//  Reemplaza estos 2 valores con los de TU proyecto:
//  Supabase -> Project Settings -> API
//    - Project URL                     -> SUPABASE_URL
//    - Project API keys (anon, public) -> SUPABASE_ANON_KEY
//  La anon key es PUBLICA y segura de exponer: la seguridad real esta en las
//  politicas RLS de la base de datos. NUNCA pongas aqui la service_role key.
//
//  NOTA: este es un archivo .js. NO le des doble clic en Windows (intentaria
//  ejecutarlo con "Windows Based Script Host"). Abrelo con Bloc de notas / VS Code.
// ============================================================================

const SUPABASE_URL = "https://odovkwgcgpusugpfjngv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kb3Zrd2djZ3B1c3VncGZqbmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2Mjc0NzAsImV4cCI6MjA5OTIwMzQ3MH0.l3eNo28wZZSf_UkANaWnWtPyzlDS0xA8ZVXzRCweWcQ";

// No editar debajo de esta linea -----------------------------------------
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper: obtiene sesion + rol del usuario actual (o null si no hay sesion)
async function obtenerUsuarioYRol() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;
  const { data: perfil } = await sb
    .from("profiles")
    .select("rol, email")
    .eq("id", session.user.id)
    .single();
  return {
    id: session.user.id,
    email: session.user.email,
    rol: perfil ? perfil.rol : "pm",
  };
}

// Helper: registra un evento en log_actividad (login, logout, carga_excel, etc.)
// Silencioso: si falla (p.ej. sin sesion), no interrumpe el flujo de la app.
async function logEvento(evento, detalle) {
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;
    await sb.from("log_actividad").insert({
      evento: evento,
      detalle: detalle || null,
      usuario_id: session.user.id,
      usuario_email: session.user.email,
    });
  } catch (e) { /* silencioso */ }
}
