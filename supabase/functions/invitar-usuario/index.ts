import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsFor = (origin: string) => ({
  "Access-Control-Allow-Origin": ["https://raiomathias.github.io", "http://localhost:5173", "http://127.0.0.1:5173"].includes(origin) ? origin : "https://raiomathias.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});
Deno.serve(async (req: Request) => {
  const cors = corsFor(req.headers.get("origin") || "");
  const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
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
  let body: { action?: string; taller_id?: string; membership_id?: string; nombre_completo?: string; email?: string; rol?: string; activo?: boolean };
  try { body = await req.json(); } catch { return response({ error: "Solicitud inválida." }, 400); }
  const name = (body.nombre_completo || "").trim().replace(/\s+/g, " ");
  const email = (body.email || "").trim().toLowerCase();
  const role = body.rol || "mecanico";
  const action = body.action || "invite";
  const allowed = ["administrador", "gerente", "jefe_taller", "recepcionista", "mecanico", "bodeguero", "administracion"];
  if (!body.taller_id || name.length < 3 || !allowed.includes(role) || (action === "invite" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return response({ error: "Completa nombre, correo, rol y taller con datos válidos." }, 400);
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: membership, error: memberError } = await admin.from("usuarios_taller")
    .select("rol").eq("taller_id", body.taller_id).eq("usuario_id", authData.user.id).eq("activo", true).maybeSingle();
  if (memberError || !membership || !["administrador", "gerente"].includes(membership.rol)) {
    return response({ error: "No tienes permisos para administrar usuarios de este taller." }, 403);
  }
  if (action === "update") {
    if (!body.membership_id || name.length < 3 || !allowed.includes(role)) return response({ error: "Datos de usuario inválidos." }, 400);
    if (membership.rol === "gerente" && ["administrador", "gerente"].includes(role)) return response({ error: "Solo un administrador puede asignar roles de administración o gerencia." }, 403);
    const { data: target, error: targetError } = await admin.from("usuarios_taller").select("usuario_id").eq("id", body.membership_id).eq("taller_id", body.taller_id).maybeSingle();
    if (targetError || !target) return response({ error: "No se encontró la membresía indicada." }, 404);
    const { error: profileUpdateError } = await admin.from("perfiles").upsert({ id: target.usuario_id, nombre_completo: name }, { onConflict: "id" });
    if (profileUpdateError) return response({ error: "No se pudo actualizar el nombre: " + profileUpdateError.message }, 400);
    const { error: membershipUpdateError } = await admin.from("usuarios_taller").update({ rol: role, activo: body.activo !== false }).eq("id", body.membership_id).eq("taller_id", body.taller_id);
    if (membershipUpdateError) return response({ error: membershipUpdateError.message }, 400);
    return response({ ok: true, message: "Usuario actualizado.", user: { nombre_completo: name, rol: role, activo: body.activo !== false } });
  }
  if (action !== "invite") return response({ error: "Acción no válida." }, 400);
  if (membership.rol === "gerente" && ["administrador", "gerente"].includes(role)) {
    return response({ error: "Solo un administrador puede asignar roles de administración o gerencia." }, 403);
  }
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { nombre_completo: name },
    redirectTo: "https://raiomathias.github.io/Taller/",
  });
  let userId: string;
  let invitationSent = false;
  if (invited?.user) {
    userId = invited.user.id;
    invitationSent = true;
  } else {
    // A confirmed account cannot be invited again; add that existing account to this workshop instead.
    const { data: users, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) return response({ error: inviteError?.message || listError.message || "No se pudo localizar la cuenta." }, 400);
    const existingUser = users.users.find((u) => (u.email || "").toLowerCase() === email);
    if (!existingUser) return response({ error: inviteError?.message || "No se pudo crear ni localizar la cuenta." }, 400);
    userId = existingUser.id;
  }
  const { error: profileError } = await admin.from("perfiles").upsert({
    id: userId, nombre_completo: name,
  }, { onConflict: "id" });
  if (profileError) return response({ error: "Usuario invitado, pero no se pudo crear su perfil: " + profileError.message }, 500);
  const { data: existing } = await admin.from("usuarios_taller").select("id")
    .eq("taller_id", body.taller_id).eq("usuario_id", userId).maybeSingle();
  const membershipWrite = existing
    ? await admin.from("usuarios_taller").update({ rol: role, activo: true }).eq("id", existing.id)
    : await admin.from("usuarios_taller").insert({ taller_id: body.taller_id, usuario_id: userId, rol: role, activo: true });
  if (membershipWrite.error) return response({ error: "Usuario invitado, pero no se pudo asignar al taller: " + membershipWrite.error.message }, 500);
  return response({ ok: true, message: invitationSent ? "Invitación enviada." : "Cuenta existente añadida al taller.", user: { nombre_completo: name, email, rol: role } });
});