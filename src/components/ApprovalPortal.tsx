import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3, ShieldCheck, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
type Row = Record<string, any>
const money=(n:number)=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(Number(n)||0)
const date=(value:string)=>value?new Date(value).toLocaleString('es-CL'):'—'
export default function ApprovalPortal({token}:{token:string}){
 const [approval,setApproval]=useState<Row|null>(null),[name,setName]=useState(''),[rut,setRut]=useState(''),[consent,setConsent]=useState(false),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 useEffect(()=>{let active=true;void(async()=>{setLoading(true);setError('');const {data,error}=await supabase.functions.invoke('presupuesto-ot',{body:{action:'get',token}});if(!active)return;if(error)setError(error.message||'No se pudo consultar el presupuesto.');else setApproval(data?.approval||null);setLoading(false)})();return()=>{active=false}},[token])
 async function respond(accepted:boolean){
  if(name.trim().length<3){setError('Ingresa tu nombre completo.');return}
  if(rut.trim().length<7||rut.trim().length>15){setError('Ingresa un RUT o documento válido.');return}
  if(!consent){setError('Debes confirmar que revisaste el presupuesto y autorizas registrar tu respuesta.');return}
  if(!accepted&&!window.confirm('¿Confirmas que deseas rechazar este presupuesto?'))return
  setSaving(true);setError('');const {data,error}=await supabase.functions.invoke('presupuesto-ot',{body:{action:'respond',token,accepted,nombre:name.trim(),rut:rut.trim(),consent:true}})
  if(error)setError(error.message||'No se pudo registrar la respuesta.')
  else{setApproval((current:Row|null)=>current?{...current,estado:accepted?'aprobado':'rechazado',respondido_por_nombre:name.trim(),respuesta_at:new Date().toISOString()}:current);setNotice(accepted?'Presupuesto autorizado correctamente.':'Rechazo registrado correctamente.')}
  setSaving(false)
 }
 const snapshot=approval?.quote_snapshot||{},closed=approval&&approval.estado!=='pendiente'
 return <main className="approval-portal"><article className="approval-card">
  <header className="approval-brand"><div><h1>{snapshot.taller?.nombre||'Taller'}</h1><small>Portal seguro de autorización de presupuestos</small></div><ShieldCheck size={28}/></header>
  <section className="approval-content">
   {loading?<div className="approval-result">Cargando presupuesto…</div>:error&&!approval?<div className="approval-result"><XCircle size={18}/> {error}</div>:approval?<>
    <span className="eyebrow">ORDEN DE TRABAJO {snapshot.orden?.numero_ot||''}</span><h2>Revisión del presupuesto</h2><p>Revisa el detalle y los valores antes de registrar tu respuesta. La autorización quedará asociada a esta orden de trabajo.</p>
    <div className="approval-meta"><div><small>Cliente</small><b>{snapshot.cliente?.nombre||'—'}</b></div><div><small>Vehículo</small><b>{[snapshot.vehiculo?.patente,snapshot.vehiculo?.marca,snapshot.vehiculo?.modelo].filter(Boolean).join(' ')||'—'}</b></div><div><small>Fecha del presupuesto</small><b>{date(snapshot.generado_at)}</b></div><div><small>Vigencia hasta</small><b>{date(approval.expires_at)}</b></div></div>
    {snapshot.orden?.trabajo_solicitado&&<p><b>Trabajo solicitado:</b> {snapshot.orden.trabajo_solicitado}</p>}{snapshot.orden?.diagnostico&&<p><b>Diagnóstico:</b> {snapshot.orden.diagnostico}</p>}
    <table className="approval-lines"><thead><tr><th>Detalle</th><th>Cant.</th><th>Precio unitario</th><th>Total</th></tr></thead><tbody>{(snapshot.detalles||[]).map((line:Row,i:number)=><tr key={i}><td>{line.descripcion}</td><td>{Number(line.cantidad).toLocaleString('es-CL')}</td><td>{money(line.precio_unitario)}</td><td>{money(Number(line.cantidad)*Number(line.precio_unitario))}</td></tr>)}</tbody></table>
    <div className="approval-total"><span>Subtotal</span><b>{money(snapshot.orden?.subtotal)}</b><span>Descuento</span><b>{money(snapshot.orden?.descuento||0)}</b><span>Impuestos</span><b>{money(snapshot.orden?.impuesto)}</b><strong>Total a autorizar</strong><strong>{money(snapshot.orden?.total)}</strong></div>
    {closed?<div className="approval-result">{approval.estado==='aprobado'?<CheckCircle2 size={19}/>:approval.estado==='rechazado'?<XCircle size={19}/>:<Clock3 size={19}/>} <b>{approval.estado==='aprobado'?'Presupuesto autorizado':approval.estado==='rechazado'?'Presupuesto rechazado':approval.estado==='vencido'?'Este enlace venció':'Este presupuesto ya no está disponible'}</b><p>{approval.respondido_por_nombre?'Respuesta registrada por '+approval.respondido_por_nombre+'. ':''}{approval.respuesta_at?date(approval.respuesta_at):''}</p></div>:<>
     <div className="approval-form"><h3>Registrar respuesta</h3><p>Ingresa tus datos para dejar constancia de la decisión.</p>
      <label>Nombre completo<input type="text" value={name} onChange={e=>setName(e.target.value)} maxLength={120} placeholder="Nombre y apellido"/></label>
      <label>RUT / Documento de identidad<input type="text" value={rut} onChange={e=>setRut(e.target.value)} maxLength={15} placeholder="12.345.678-9"/></label>
      <label className="approval-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>Declaro que revisé el detalle y los valores del presupuesto. Autorizo registrar electrónicamente mi respuesta con mi nombre, documento y fecha.</label>
      {error&&<div className="error">{error}</div>}{notice&&<div className="approval-result">{notice}</div>}
      <div className="approval-actions"><button className="primary" disabled={saving} onClick={()=>void respond(true)}><CheckCircle2 size={16}/> {saving?'Registrando…':'Autorizar presupuesto'}</button><button className="secondary" disabled={saving} onClick={()=>void respond(false)}><XCircle size={16}/> Rechazar</button></div>
     </div>
    </>}
   </>:<div className="approval-result">El enlace no es válido o ya no está disponible.</div>}
   <p style={{marginTop:24,fontSize:10}}>La respuesta queda registrada con fecha y datos declarados por quien responde. Este mecanismo es una constancia electrónica de aceptación/rechazo y no sustituye una firma electrónica avanzada cuando la ley o el contrato la exijan.</p>
  </section>
 </article></main>
}
