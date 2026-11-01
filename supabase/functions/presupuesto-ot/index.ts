import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const allowedOrigins=["https://raiomathias.github.io","http://localhost:5173","http://127.0.0.1:5173"];
const corsFor=(origin:string)=>({"Access-Control-Allow-Origin":allowedOrigins.includes(origin)?origin:"https://raiomathias.github.io","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"});
const hex=(bytes:Uint8Array)=>Array.from(bytes).map(x=>x.toString(16).padStart(2,"0")).join("");
const makeToken=()=>{const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);return hex(bytes)};
async function hashToken(token:string){const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token));return hex(new Uint8Array(digest))}
const json=(body:unknown,status:number,cors:Record<string,string>)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
Deno.serve(async(req:Request)=>{
 const cors=corsFor(req.headers.get("origin")||"");
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({error:"Método no permitido."},405,cors);
 let body:{action?:string;order_id?:string;token?:string;accepted?:boolean;nombre?:string;rut?:string;consent?:boolean};
 try{body=await req.json()}catch{return json({error:"Solicitud inválida."},400,cors)}
 const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 const admin=createClient(url,service,{auth:{persistSession:false}}),action=body.action||"";
 if(action==="create"){
  const authorization=req.headers.get("Authorization")||"";
  if(!authorization.startsWith("Bearer "))return json({error:"Debes iniciar sesión para crear el enlace."},401,cors);
  const auth=createClient(url,anon,{auth:{persistSession:false}});
  const {data:userData,error:userError}=await auth.auth.getUser(authorization.slice(7));
  if(userError||!userData.user)return json({error:"Sesión inválida."},401,cors);
  if(!body.order_id)return json({error:"Falta la orden de trabajo."},400,cors);
  const {data:order,error:orderError}=await admin.from("ordenes_trabajo").select("id,taller_id,numero_ot,cliente_id,vehiculo_id,estado,fecha_recepcion,fecha_prometida,trabajo_solicitado,diagnostico,subtotal,descuento,impuesto,total").eq("id",body.order_id).maybeSingle();
  if(orderError||!order)return json({error:"No se encontró la orden."},404,cors);
  if(["cancelada","entregada"].includes(order.estado))return json({error:"No se puede emitir un presupuesto para una OT cancelada o entregada."},409,cors);
  const {data:member,error:memberError}=await admin.from("usuarios_taller").select("rol").eq("taller_id",order.taller_id).eq("usuario_id",userData.user.id).eq("activo",true).maybeSingle();
  if(memberError||!member)return json({error:"No perteneces a este taller."},403,cors);
  let canEdit=["administrador","gerente"].includes(member.rol);
  if(!canEdit){const {data:permission}=await admin.from("permisos_rol_taller").select("permisos").eq("taller_id",order.taller_id).eq("rol",member.rol).maybeSingle();const configured=permission?.permisos?.ordenes?.editar;canEdit=typeof configured==="boolean"?configured:["jefe_taller","recepcionista","administracion"].includes(member.rol)}
  if(!canEdit)return json({error:"No tienes permiso para emitir presupuestos."},403,cors);
  const [{data:details,error:detailError},{data:client},{data:vehicle},{data:workshop}]=await Promise.all([
   admin.from("ot_detalles").select("tipo,descripcion,cantidad,precio_unitario,total_linea").eq("orden_id",order.id).order("created_at"),
   admin.from("clientes").select("nombre,rut").eq("id",order.cliente_id).maybeSingle(),
   admin.from("vehiculos").select("patente,marca,modelo,anio,kilometraje").eq("id",order.vehiculo_id).maybeSingle(),
   admin.from("talleres").select("nombre,rut,telefono,email,direccion,ciudad").eq("id",order.taller_id).maybeSingle()
  ]);
  if(detailError)return json({error:detailError.message},400,cors);
  if(!details?.length||Number(order.total)<=0)return json({error:"Agrega trabajos o repuestos y calcula el total antes de emitir el presupuesto."},409,cors);
  const snapshot={generado_at:new Date().toISOString(),taller:workshop||{},cliente:client||{},vehiculo:vehicle||{},orden:order,detalles:details};
  const token=makeToken(),token_hash=await hashToken(token),expires_at=new Date(Date.now()+7*24*60*60*1000).toISOString();
  await admin.from("ot_presupuestos_aprobacion").update({estado:"revocado"}).eq("orden_id",order.id).eq("estado","pendiente");
  const {data:record,error:insertError}=await admin.from("ot_presupuestos_aprobacion").insert({taller_id:order.taller_id,orden_id:order.id,token_hash,quote_snapshot:snapshot,creado_por:userData.user.id,expires_at}).select("id,expires_at").single();
  if(insertError)return json({error:insertError.message},400,cors);
  await admin.from("auditoria").insert({taller_id:order.taller_id,usuario_id:userData.user.id,entidad:"ordenes_trabajo",entidad_id:order.id,accion:"presupuesto_enviado_a_autorizacion",detalle:{aprobacion_id:record.id,numero_ot:order.numero_ot,total:order.total,expires_at}});
  const approvalUrl=new URL("https://raiomathias.github.io/Taller/");approvalUrl.searchParams.set("aprobar",token);
  return json({ok:true,approval_url:approvalUrl.toString(),expires_at},200,cors);
 }
 if(action==="get"||action==="respond"){
  if(!body.token||!/^[a-f0-9]{64}$/i.test(body.token))return json({error:"El enlace no es válido."},400,cors);
  const token_hash=await hashToken(body.token);
  const {data:record,error:recordError}=await admin.from("ot_presupuestos_aprobacion").select("id,taller_id,orden_id,estado,quote_snapshot,expires_at,respondido_por_nombre,respuesta_at").eq("token_hash",token_hash).maybeSingle();
  if(recordError||!record)return json({error:"El enlace no existe o ya no está disponible."},404,cors);
  if(record.estado==="pendiente"&&new Date(record.expires_at).getTime()<=Date.now()){await admin.from("ot_presupuestos_aprobacion").update({estado:"vencido"}).eq("id",record.id).eq("estado","pendiente");record.estado="vencido"}
  if(action==="get")return json({approval:{estado:record.estado,quote_snapshot:record.quote_snapshot,expires_at:record.expires_at,respondido_por_nombre:record.respondido_por_nombre,respuesta_at:record.respuesta_at}},200,cors);
  const nombre=(body.nombre||"").trim().replace(/\s+/g," "),rut=(body.rut||"").trim();
  if(typeof body.accepted!=="boolean"||body.consent!==true||nombre.length<3||nombre.length>120||rut.length<7||rut.length>15)return json({error:"Completa nombre, documento y confirmación para registrar tu respuesta."},400,cors);
  if(record.estado!=="pendiente")return json({error:"Este presupuesto ya fue respondido, revocado o venció."},409,cors);
  const next=body.accepted?"aprobado":"rechazado",now=new Date().toISOString();
  const {data:updated,error:updateError}=await admin.from("ot_presupuestos_aprobacion").update({estado:next,respondido_por_nombre:nombre,respondido_por_rut:rut,respuesta_at:now}).eq("id",record.id).eq("estado","pendiente").gt("expires_at",now).select("id").maybeSingle();
  if(updateError||!updated)return json({error:"La respuesta no pudo registrarse. El enlace puede haber vencido o ya fue utilizado."},409,cors);
  if(body.accepted)await admin.from("ordenes_trabajo").update({estado:"autorizada",autorizado_por:nombre,autorizado_at:now}).eq("id",record.orden_id).in("estado",["recibida","diagnostico","presupuestada","esperando_autorizacion"]);
  await admin.from("auditoria").insert({taller_id:record.taller_id,usuario_id:null,entidad:"ordenes_trabajo",entidad_id:record.orden_id,accion:body.accepted?"presupuesto_aprobado_por_cliente":"presupuesto_rechazado_por_cliente",detalle:{aprobacion_id:record.id,nombre,rut,respondido_at:now}});
  return json({ok:true,estado:next},200,cors);
 }
 return json({error:"Acción no válida."},400,cors);
});
