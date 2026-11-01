import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsFor = (origin: string) => ({
  "Access-Control-Allow-Origin": ["https://raiomathias.github.io", "http://localhost:5173", "http://127.0.0.1:5173"].includes(origin) ? origin : "https://raiomathias.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json" },
});
Deno.serve(async (req: Request) => {
  const cors = corsFor(req.headers.get("origin") || "");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return response({ error: "Método no permitido." }, 405);
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return response({ error: "Sesión requerida." }, 401);
  const token = authorization.slice(7);
  const authClient = createClient(url, anon, { auth: { persistSession: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return response({ error: "Sesión inválida." }, 401);
  let body: { taller_id?: string; nombre_completo?: string; email?: string; rol?: string };
  try { body = await req.json(); } catch { return response({ error: "Solicitud inválida." }, 400); }
  const name = (body.nombre_completo || "").trim().replace(/\s+/g, " ");
  const email = (body.email || "").trim().toLowerCase();
  const role = body.rol || "mecanico";
  const allowed = ["administrador", "gerente", "jefe_taller", "recepcionista", "mecanico", "bodeguero", "administracion"];
  if (!body.taller_id || name.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !allowed.includes(role)) {
    return response({ error: "Completa nombre, correo, rol y taller con datos válidos." }, 400);
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: membership, error: memberError } = await admin.from("usuarios_taller")
    .select("rol").eq("taller_id", body.taller_id).eq("usuario_id", authData.user.id).eq("activo", true).maybeSingle();
  if (memberError || !membership || !["administrador", "gerente"].includes(membership.rol)) {
    return response({ error: "No tienes permisos para invitar usuarios a este taller." }, 403);
  }
  if (membership.rol === "gerente" && ["administrador", "gerente"].includes(role)) {
    return response({ error: "Solo un administrador puede asignar roles de administración o gerencia." }, 403);
  }
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { nombre_completo: name },
    redirectTo: "https://raiomathias.github.io/Taller/",
  });
  if (inviteError || !invited.user) return response({ error: inviteError?.message || "No se pudo enviar la invitación." }, 400);
  const userId = invited.user.id;
  const { error: profileError } = await admin.from("perfiles").upsert({
    id: userId, nombre_completo: name,
  }, { onConflict: "id" });
  if (profileError) return response({ error: "Usuario invitado, pero no se pudo crear su perfil: " + profileError.message, user_id: userId }, 500);
  const { data: existing } = await admin.from("usuarios_taller").select("id")
    .eq("taller_id", body.taller_id).eq("usuario_id", userId).maybeSingle();
  const membershipWrite = existing
    ? await admin.from("usuarios_taller").update({ rol: role, activo: true }).eq("id", existing.id)
    : await admin.from("usuarios_taller").insert({ taller_id: body.taller_id, usuario_id: userId, rol: role, activo: true });
  if (membershipWrite.error) return response({ error: "Usuario invitado, pero no se pudo asignar al taller: " + membershipWrite.error.message, user_id: userId }, 500);
  return response({ ok: true, message: "Invitación enviada.", user: { id: userId, nombre_completo: name, email, rol: role } });
});