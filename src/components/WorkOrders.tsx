import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, RefreshCw, Wrench, ClipboardCheck, Clock3, CreditCard, ImagePlus, Check, X, ChevronRight, AlertTriangle, CalendarClock } from 'lucide-react'

type Row = Record<string, any>
type Props = { workshop: Row; userId?: string; role: string; demoMode?: boolean }
const money = (n:number) => new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(Number(n)||0)
const statusLabels:Record<string,string> = {recibida:'Recibida',diagnostico:'Diagnóstico',presupuestada:'Presupuestada',esperando_autorizacion:'Esperando autorización',autorizada:'Autorizada',esperando_repuestos:'Esperando repuestos',en_reparacion:'En reparación',control_calidad:'Control de calidad',lista_entrega:'Lista para entrega',entregada:'Entregada',cancelada:'Cancelada'}
const statusOrder = ['recibida','diagnostico','presupuestada','esperando_autorizacion','autorizada','esperando_repuestos','en_reparacion','control_calidad','lista_entrega','entregada','cancelada']
const rolesEdit = ['administrador','gerente','jefe_taller','recepcionista','administracion']
const receptionChecklist = ['Carrocería y pintura','Parabrisas y cristales','Luces y señalizadores','Neumáticos y llantas','Espejos','Interior y tapicería','Herramientas y rueda de repuesto','Documentos del vehículo']
const qualityChecklist = ['Trabajo solicitado completado','Sin fugas visibles','Prueba de funcionamiento realizada','Herramientas retiradas del vehículo','Vehículo limpio y ordenado','Testigos del tablero revisados']
const isoNow = () => new Date().toISOString()
const demoKey = 'taller-demo-data-v1'
function demoRead(){try{return JSON.parse(localStorage.getItem(demoKey)||'{}')}catch{return {}}}
function demoWrite(d:Row){localStorage.setItem(demoKey,JSON.stringify(d))}
export default function WorkOrders({workshop,userId,role,demoMode=false}:Props){
 const [orders,setOrders]=useState<Row[]>([])
 const [clients,setClients]=useState<Row[]>([])
 const [vehicles,setVehicles]=useState<Row[]>([])
 const [products,setProducts]=useState<Row[]>([])
 const [warehouses,setWarehouses]=useState<Row[]>([])
 const [team,setTeam]=useState<Row[]>([])
 const [selected,setSelected]=useState<Row|null>(null)
 const [details,setDetails]=useState<Row[]>([])
 const [tasks,setTasks]=useState<Row[]>([])
 const [assignments,setAssignments]=useState<Row[]>([])
 const [payments,setPayments]=useState<Row[]>([])
 const [inspections,setInspections]=useState<Row[]>([])
 const [attachments,setAttachments]=useState<Row[]>([])
 const [times,setTimes]=useState<Row[]>([])
 const [loading,setLoading]=useState(true)
 const [saving,setSaving]=useState(false)
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 const [search,setSearch]=useState('')
 const [filter,setFilter]=useState('todas')
 const [showCreate,setShowCreate]=useState(false)
 const [showLine,setShowLine]=useState(false)
 const [showPayment,setShowPayment]=useState(false)
 const [showTask,setShowTask]=useState(false)
 const [tab,setTab]=useState('resumen')
 const [form,setForm]=useState<Row>({prioridad:'normal',kilometraje:0})
 const [line,setLine]=useState<Row>({tipo:'mano_obra',cantidad:1,precio_unitario:0})
 const [payment,setPayment]=useState<Row>({metodo:'transferencia',monto:''})
 const [task,setTask]=useState<Row>({prioridad:'normal',horas_estimadas:1})
 const canCreate = rolesEdit.includes(role)
 const canOperate = ['administrador','gerente','jefe_taller','mecanico','recepcionista','administracion'].includes(role)
 const canEditOrder = rolesEdit.includes(role)
 const canAssign = ['administrador','gerente','jefe_taller'].includes(role)
 const canCharge = ['administrador','gerente','recepcionista','administracion'].includes(role)
 const workshopId = workshop?.taller_id || workshop?.id

 const load = useCallback(async()=>{
  setLoading(true);setError('')
  if(demoMode){
   const d=demoRead()
   const seeded = d.ordenes_trabajo || [{
    id:'demo-ot-1',taller_id:workshopId,folio:1,numero_ot:'OT-000001',cliente_id:'c1',vehiculo_id:'v1',estado:'en_reparacion',prioridad:'alta',
    fecha_recepcion:isoNow(),fecha_prometida:null,kilometraje_ingreso:68450,sintomas:'Ruido al frenar y vibración en el volante.',trabajo_solicitado:'Revisar frenos delanteros y realizar mantención preventiva.',diagnostico:'Pastillas delanteras con desgaste avanzado. Se recomienda reemplazo.',subtotal:71400,impuesto:13566,total:84966,saldo:84966
   }]
   if(!d.ordenes_trabajo){d.ordenes_trabajo=seeded;d.ot_detalles=[{id:'demo-line-1',orden_id:'demo-ot-1',tipo:'repuesto',descripcion:'Pastillas de freno delanteras',cantidad:1,precio_unitario:42900,total_linea:42900},{id:'demo-line-2',orden_id:'demo-ot-1',tipo:'mano_obra',descripcion:'Revisión y servicio de frenos',cantidad:1.5,precio_unitario:19000,total_linea:28500}];d.ot_tareas=[{id:'demo-task-1',orden_id:'demo-ot-1',titulo:'Reemplazo de pastillas delanteras',estado:'en_progreso',prioridad:'alta',horas_estimadas:1.5}];d.ot_pagos=[];d.ot_inspecciones=[];d.ot_adjuntos=[];d.ot_tiempos=[];demoWrite(d)}
   setOrders(seeded);setClients(d.clientes||[]);setVehicles(d.vehiculos||[]);setProducts(d.productos||[]);setWarehouses(d.bodegas||[])
   setLoading(false);return
  }
  const [o,c,v,p,w,m]=await Promise.all([
   supabase.from('ordenes_trabajo').select('*,clientes(nombre,rut,telefono),vehiculos(patente,marca,modelo,anio,kilometraje)').eq('taller_id',workshopId).order('fecha_recepcion',{ascending:false}).limit(300),
   supabase.from('clientes').select('id,nombre,rut,telefono').eq('taller_id',workshopId).eq('activo',true).order('nombre'),
   supabase.from('vehiculos').select('id,cliente_id,patente,marca,modelo,anio,kilometraje').eq('taller_id',workshopId).eq('activo',true).order('patente'),
   supabase.from('productos').select('id,nombre,sku,tipo,unidad,costo_unitario,precio_venta,controla_stock').eq('taller_id',workshopId).eq('activo',true).order('nombre'),
   supabase.from('bodegas').select('id,nombre,es_principal').eq('taller_id',workshopId).eq('activo',true).order('nombre'),
   supabase.from('usuarios_taller').select('usuario_id,rol,perfiles(nombre_completo)').eq('taller_id',workshopId).eq('activo',true)
  ])
  const e=[o.error,c.error,v.error,p.error,w.error,m.error].find(Boolean);if(e)setError(e.message)
  setOrders(o.data||[]);setClients(c.data||[]);setVehicles(v.data||[]);setProducts(p.data||[]);setWarehouses(w.data||[]);setTeam(m.data||[])
  setLoading(false)
 },[demoMode,workshopId])

 const loadDetail = useCallback(async(order:Row)=>{
  setSelected(order);setTab('resumen')
  if(demoMode){
   const d=demoRead();setDetails((d.ot_detalles||[]).filter((x:Row)=>x.orden_id===order.id));setTasks((d.ot_tareas||[]).filter((x:Row)=>x.orden_id===order.id));setAssignments((d.ot_asignaciones||[]).filter((x:Row)=>x.orden_id===order.id));setPayments((d.ot_pagos||[]).filter((x:Row)=>x.orden_id===order.id));setInspections((d.ot_inspecciones||[]).filter((x:Row)=>x.orden_id===order.id));setAttachments((d.ot_adjuntos||[]).filter((x:Row)=>x.orden_id===order.id));setTimes((d.ot_tiempos||[]).filter((x:Row)=>x.orden_id===order.id));return
  }
  const [a,b,c,d,e,f,g]=await Promise.all([
   supabase.from('ot_detalles').select('*,productos(nombre,sku),bodegas(nombre)').eq('orden_id',order.id).order('created_at'),
   supabase.from('ot_tareas').select('*').eq('orden_id',order.id).order('created_at'),
   supabase.from('ot_pagos').select('*').eq('orden_id',order.id).order('created_at',{ascending:false}),
   supabase.from('ot_inspecciones').select('*').eq('orden_id',order.id).order('created_at'),
   supabase.from('ot_adjuntos').select('*').eq('orden_id',order.id).order('created_at',{ascending:false}),
   supabase.from('ot_tiempos').select('*').eq('orden_id',order.id).order('inicio',{ascending:false}),
   supabase.from('ot_asignaciones').select('*').eq('orden_id',order.id).eq('activa',true)
  ])
  const err=[a.error,b.error,c.error,d.error,e.error,f.error,g.error].find(Boolean);if(err)setError(err.message)
  setDetails(a.data||[]);setTasks(b.data||[]);setAssignments(g.data||[]);setPayments(c.data||[]);setInspections(d.data||[]);setAttachments(e.data||[]);setTimes(f.data||[])
 },[demoMode,workshopId])
 useEffect(()=>{void load()},[load])
 useEffect(()=>{if(selected){const fresh=orders.find(x=>x.id===selected.id);if(fresh&&fresh!==selected)setSelected(fresh)}},[orders])

 const filtered=useMemo(()=>orders.filter(o=>(filter==='todas'||o.estado===filter)&&JSON.stringify([o.numero_ot,o.clientes?.nombre,o.vehiculos?.patente,o.sintomas]).toLowerCase().includes(search.toLowerCase())),[orders,filter,search])
 const totalPaid=payments.reduce((a,x)=>a+Number(x.monto||0),0)
 const recalcDemo=(d:Row,orderId:string)=>{
  const o=d.ordenes_trabajo.find((x:Row)=>x.id===orderId);if(!o)return
  const sub=(d.ot_detalles||[]).filter((x:Row)=>x.orden_id===orderId).reduce((a:number,x:Row)=>a+Number(x.cantidad)*Number(x.precio_unitario),0)
  const paid=(d.ot_pagos||[]).filter((x:Row)=>x.orden_id===orderId).reduce((a:number,x:Row)=>a+Number(x.monto),0)
  const tax=sub*0.19;o.subtotal=sub;o.impuesto=tax;o.total=sub+tax;o.saldo=Math.max(0,o.total-paid)
 }
 async function createOrder(){
  if(!form.cliente_id||!form.vehiculo_id){setError('Selecciona cliente y vehículo.');return}
  setSaving(true);setError('')
  try{
   if(demoMode){
    const d=demoRead();const n=(d.ordenes_trabajo||[]).reduce((a:number,x:Row)=>Math.max(a,Number(x.folio)||0),0)+1
    const o={id:'demo-ot-'+Date.now(),taller_id:workshopId,folio:n,numero_ot:'OT-'+String(n).padStart(6,'0'),cliente_id:form.cliente_id,vehiculo_id:form.vehiculo_id,estado:'recibida',prioridad:form.prioridad||'normal',fecha_recepcion:isoNow(),fecha_prometida:form.fecha_prometida||null,kilometraje_ingreso:Number(form.kilometraje)||0,sintomas:form.sintomas||'',trabajo_solicitado:form.trabajo_solicitado||'',observaciones_recepcion:form.observaciones_recepcion||'',subtotal:0,impuesto:0,total:0,saldo:0}
    d.ordenes_trabajo=[...(d.ordenes_trabajo||[]),o];d.ot_inspecciones=[...(d.ot_inspecciones||[]),{id:'demo-insp-'+Date.now(),orden_id:o.id,etapa:'recepcion',resultado:'pendiente',items:receptionChecklist.map(label=>({label,estado:'pendiente'}))}];demoWrite(d)
   }else{
    const {error}=await supabase.rpc('crear_orden_trabajo',{p_taller_id:workshopId,p_cliente_id:form.cliente_id,p_vehiculo_id:form.vehiculo_id,p_kilometraje:Number(form.kilometraje)||0,p_sintomas:form.sintomas||null,p_trabajo_solicitado:form.trabajo_solicitado||null,p_observaciones:form.observaciones_recepcion||null,p_prioridad:form.prioridad||'normal',p_fecha_prometida:form.fecha_prometida?new Date(form.fecha_prometida+'T18:00:00').toISOString():null})
    if(error)throw error
   }
   setShowCreate(false);setForm({prioridad:'normal',kilometraje:0});setNotice('Orden de trabajo creada.');await load()
  }catch(e:any){setError(e.message||'No se pudo crear la orden.')}
  setSaving(false)
 }
 async function changeStatus(next:string){
  if(!selected||!canEditOrder)return
  if(next==='entregada'&&Number(selected.saldo)>0&&!confirm('La orden mantiene un saldo pendiente. ¿Confirmas la entrega?'))return
  setSaving(true);setError('')
  const patch:Row={estado:next}
  if(next==='autorizada'){patch.autorizado_at=isoNow();patch.autorizado_por=sessionName}
  if(next==='en_reparacion'&&!selected.fecha_inicio)patch.fecha_inicio=isoNow()
  if(next==='control_calidad')patch.fecha_termino=isoNow()
  if(next==='entregada'){patch.fecha_entrega=isoNow();patch.entregado_por=userId||null}
  try{
   if(demoMode){const d=demoRead();const o=d.ordenes_trabajo.find((x:Row)=>x.id===selected.id);Object.assign(o,patch);demoWrite(d)}
   else{const {error}=await supabase.from('ordenes_trabajo').update(patch).eq('id',selected.id).eq('taller_id',workshopId);if(error)throw error}
   setNotice('Estado de la OT actualizado.');await load();const fresh={...selected,...patch};setSelected(fresh);await loadDetail(fresh)
  }catch(e:any){setError(e.message||'No se pudo actualizar el estado.')}
  setSaving(false)
 }
 const sessionName = team.find(m=>m.usuario_id===userId)?.perfiles?.nombre_completo||'Usuario'
 async function addLine(){
  if(!selected||!line.descripcion?.trim()){setError('Ingresa una descripción.');return}
  const qty=Number(line.cantidad)||1
  const needsStock=['repuesto','insumo'].includes(line.tipo)
  if(needsStock&&(!line.producto_id||!(line.bodega_id||warehouses[0]?.id))){setError('Selecciona producto y bodega para consumir inventario.');return}
  setSaving(true);setError('')
  try{
   const product=products.find(p=>p.id===line.producto_id)
   if(demoMode){
    const d=demoRead();const p=d.productos?.find((x:Row)=>x.id===line.producto_id)
    if(needsStock){const stock=p?.stock?.find((x:Row)=>x.bodega_id===(line.bodega_id||warehouses[0]?.id));if(!stock||Number(stock.cantidad)<qty)throw new Error('Stock insuficiente. Disponible: '+Number(stock?.cantidad||0));stock.cantidad=Number(stock.cantidad)-qty;d.movimientos=[...(d.movimientos||[]),{id:'demo-mov-'+Date.now(),created_at:isoNow(),producto_id:p.id,bodega_id:line.bodega_id||warehouses[0]?.id,tipo:'salida',cantidad_delta:-qty,costo_unitario:p.costo_unitario,motivo:'Consumo en '+selected.numero_ot,referencia:selected.numero_ot}]}
    d.ot_detalles=[...(d.ot_detalles||[]),{id:'demo-det-'+Date.now(),taller_id:workshopId,orden_id:selected.id,tipo:line.tipo,producto_id:line.producto_id||null,bodega_id:line.bodega_id||null,descripcion:line.descripcion||product?.nombre,cantidad:qty,precio_unitario:Number(line.precio_unitario)||0,costo_unitario_historico:Number(product?.costo_unitario)||0,consumido:needsStock,total_linea:qty*(Number(line.precio_unitario)||0)}];recalcDemo(d,selected.id);demoWrite(d)
   }else{
    const {error}=await supabase.rpc('agregar_detalle_ot',{p_taller_id:workshopId,p_orden_id:selected.id,p_tipo:line.tipo,p_producto_id:needsStock?line.producto_id:null,p_bodega_id:needsStock?(line.bodega_id||warehouses[0]?.id):null,p_descripcion:line.descripcion||product?.nombre,p_cantidad:qty,p_precio_unitario:Number(line.precio_unitario)||0})
    if(error)throw error
   }
   setShowLine(false);setLine({tipo:'mano_obra',cantidad:1,precio_unitario:0});setNotice('Detalle agregado a la orden.');await loadDetail(selected);await load()
  }catch(e:any){setError(e.message||'No se pudo agregar el detalle.')}
  setSaving(false)
 }
 async function addPayment(){
  if(!selected||Number(payment.monto)<=0){setError('Ingresa un monto válido.');return}
  if(Number(payment.monto)>Number(selected.saldo)+0.01){setError('El pago supera el saldo pendiente.');return}
  setSaving(true);setError('')
  try{
   const record={taller_id:workshopId,orden_id:selected.id,monto:Number(payment.monto),metodo:payment.metodo,referencia:payment.referencia||null,observaciones:payment.observaciones||null,recibido_por:userId||null}
   if(demoMode){const d=demoRead();d.ot_pagos=[...(d.ot_pagos||[]),{...record,id:'demo-pay-'+Date.now(),created_at:isoNow()}];recalcDemo(d,selected.id);demoWrite(d)}
   else{const {error}=await supabase.from('ot_pagos').insert(record);if(error)throw error}
   setShowPayment(false);setPayment({metodo:'transferencia',monto:''});setNotice('Pago registrado.');await loadDetail(selected);await load()
  }catch(e:any){setError(e.message||'No se pudo registrar el pago.')}
  setSaving(false)
 }
 async function addTask(){
  if(!selected||!task.titulo?.trim()){setError('Escribe el nombre de la tarea.');return}
  setSaving(true);setError('')
  try{
   const record={taller_id:workshopId,orden_id:selected.id,titulo:task.titulo,descripcion:task.descripcion||null,prioridad:task.prioridad||'normal',horas_estimadas:Number(task.horas_estimadas)||0,creado_por:userId||null}
   if(demoMode){const d=demoRead();const taskId='demo-task-'+Date.now();d.ot_tareas=[...(d.ot_tareas||[]),{...record,id:taskId,estado:'pendiente'}];if(task.mecanico_id)d.ot_asignaciones=[...(d.ot_asignaciones||[]),{id:'demo-assign-'+Date.now(),taller_id:workshopId,orden_id:selected.id,tarea_id:taskId,mecanico_id:task.mecanico_id,activa:true}];demoWrite(d)}
   else{const {data,error}=await supabase.from('ot_tareas').insert(record).select().single();if(error)throw error;if(task.mecanico_id){const {error:assignError}=await supabase.from('ot_asignaciones').insert({taller_id:workshopId,orden_id:selected.id,tarea_id:data.id,mecanico_id:task.mecanico_id,asignado_por:userId||null});if(assignError)throw assignError}}
   setShowTask(false);setTask({prioridad:'normal',horas_estimadas:1,mecanico_id:''});await loadDetail(selected)
  }catch(e:any){setError(e.message||'No se pudo agregar la tarea.')}
  setSaving(false)
 }
 async function assignTask(t:Row,mechanicId:string){
  if(!selected||!canAssign)return
  try{if(demoMode){const d=demoRead();d.ot_asignaciones=(d.ot_asignaciones||[]).map((a:Row)=>a.tarea_id===t.id?{...a,activa:false}:a);if(mechanicId)d.ot_asignaciones.push({id:'demo-assign-'+Date.now(),taller_id:workshopId,orden_id:selected.id,tarea_id:t.id,mecanico_id:mechanicId,activa:true});demoWrite(d)}else{const {error}=await supabase.from('ot_asignaciones').update({activa:false}).eq('tarea_id',t.id).eq('activa',true);if(error)throw error;if(mechanicId){const {error:insertError}=await supabase.from('ot_asignaciones').insert({taller_id:workshopId,orden_id:selected.id,tarea_id:t.id,mecanico_id:mechanicId,asignado_por:userId||null});if(insertError)throw insertError}}await loadDetail(selected)}catch(e:any){setError(e.message)}
 }
 async function setTaskState(t:Row,state:string){
  try{if(demoMode){const d=demoRead();const r=d.ot_tareas.find((x:Row)=>x.id===t.id);r.estado=state;demoWrite(d)}else{const {error}=await supabase.from('ot_tareas').update({estado:state,fecha_inicio:state==='en_progreso'?isoNow():t.fecha_inicio,fecha_termino:state==='completada'?isoNow():null}).eq('id',t.id);if(error)throw error}await loadDetail(selected)}catch(e:any){setError(e.message)}
 }
 async function updateDiagnosis(){
  if(!selected)return
  setSaving(true)
  try{if(demoMode){const d=demoRead();Object.assign(d.ordenes_trabajo.find((x:Row)=>x.id===selected.id),{diagnostico:selected.diagnostico});demoWrite(d)}else{const {error}=await supabase.from('ordenes_trabajo').update({diagnostico:selected.diagnostico}).eq('id',selected.id);if(error)throw error}setNotice('Diagnóstico guardado.');await load()}catch(e:any){setError(e.message)}setSaving(false)
 }
 async function saveInspection(stage:string){
  if(!selected)return
  const defaults=(stage==='recepcion'?receptionChecklist:qualityChecklist).map(label=>({label,estado:'pendiente'}))
  try{
   if(demoMode){const d=demoRead();d.ot_inspecciones=[...(d.ot_inspecciones||[]),{id:'demo-insp-'+Date.now(),orden_id:selected.id,etapa:stage,items:defaults,resultado:'pendiente'}];demoWrite(d)}
   else{const {error}=await supabase.from('ot_inspecciones').insert({taller_id:workshopId,orden_id:selected.id,etapa:stage,items:defaults});if(error)throw error}
   await loadDetail(selected);setNotice('Checklist creado.')
  }catch(e:any){setError(e.message)}
 }
 async function uploadEvidence(file?:File){
  if(!selected||!file)return
  if(file.size>15*1024*1024){setError('El archivo supera el límite de 15 MB.');return}
  if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type)){setError('Formato no permitido. Usa JPG, PNG, WEBP o PDF.');return}
  if(demoMode){setNotice('En modo demo, la carga de archivos requiere conexión con Supabase.');return}
  setSaving(true);setError('')
  try{
   const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const path=workshopId+'/'+selected.id+'/'+Date.now()+'-'+safe
   const {error:upError}=await supabase.storage.from('ot-evidencias').upload(path,file,{upsert:false,contentType:file.type});if(upError)throw upError
   const {error:dbError}=await supabase.from('ot_adjuntos').insert({taller_id:workshopId,orden_id:selected.id,storage_path:path,nombre_archivo:file.name,mime_type:file.type,tamano_bytes:file.size,subido_por:userId||null});if(dbError)throw dbError
   setNotice('Evidencia adjuntada.');await loadDetail(selected)
  }catch(e:any){setError(e.message||'No se pudo cargar el archivo.')}
  setSaving(false)
 }
 async function openAttachment(a:Row){
  const {data,error}=await supabase.storage.from('ot-evidencias').createSignedUrl(a.storage_path,120)
  if(error){setError(error.message);return}window.open(data.signedUrl,'_blank','noopener,noreferrer')
 }
 async function startStopTime(){
  if(!selected)return
  const running=times.find(t=>!t.termino&&t.mecanico_id===userId)
  try{
   if(demoMode){const d=demoRead();d.ot_tiempos=d.ot_tiempos||[];if(running){const t=d.ot_tiempos.find((x:Row)=>x.id===running.id);t.termino=isoNow()}else d.ot_tiempos.push({id:'demo-time-'+Date.now(),taller_id:workshopId,orden_id:selected.id,mecanico_id:userId||'demo-user',inicio:isoNow(),termino:null});demoWrite(d)}
   else if(running){const {error}=await supabase.from('ot_tiempos').update({termino:isoNow()}).eq('id',running.id);if(error)throw error}
   else{const {error}=await supabase.from('ot_tiempos').insert({taller_id:workshopId,orden_id:selected.id,mecanico_id:userId});if(error)throw error}
   await loadDetail(selected)
  }catch(e:any){setError(e.message)}
 }
 const customerName=(o:Row)=>o.clientes?.nombre||clients.find(c=>c.id===o.cliente_id)?.nombre||'Cliente'
 const vehicleName=(o:Row)=>o.vehiculos?o.vehiculos.patente+' · '+o.vehiculos.marca+' '+o.vehiculos.modelo:(vehicles.find(v=>v.id===o.vehiculo_id)?.patente||'Vehículo')
 const input=(label:string,key:string,type='text',placeholder='')=><label className="wo-field">{label}<input type={type} placeholder={placeholder||label} value={form[key]??''} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>

 return <div className="wo-layout">
  <section className="wo-list panel">
   <div className="wo-list-head"><div><span className="eyebrow">OPERACIÓN</span><h2>Órdenes de trabajo</h2><p>Recepción, diagnóstico y seguimiento de reparaciones</p></div>{canCreate&&<button className="primary" onClick={()=>{setForm({prioridad:'normal',kilometraje:0});setShowCreate(true)}}><Plus size={16}/> Nueva OT</button>}</div>
   <div className="wo-tools"><div className="wo-search"><Search size={15}/><input placeholder="Buscar OT, cliente o patente…" value={search} onChange={e=>setSearch(e.target.value)}/></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="todas">Todos los estados</option>{statusOrder.map(s=><option value={s} key={s}>{statusLabels[s]}</option>)}</select><button className="icon-button" onClick={()=>void load()} title="Actualizar"><RefreshCw size={15}/></button></div>
   {loading?<div className="empty-state">Cargando órdenes…</div>:filtered.length===0?<div className="empty-state"><ClipboardCheck size={26}/><b>No hay órdenes para mostrar</b><p>Registra la recepción de un vehículo para comenzar.</p></div>:<div className="wo-order-list">{filtered.map(o=><button key={o.id} className={'wo-order-card '+(selected?.id===o.id?'selected':'')} onClick={()=>void loadDetail(o)}><div className="wo-order-top"><b>{o.numero_ot}</b><span className={'wo-status status-'+o.estado}>{statusLabels[o.estado]||o.estado}</span></div><strong>{vehicleName(o)}</strong><span>{customerName(o)}</span><div className="wo-order-foot"><small>{new Date(o.fecha_recepcion).toLocaleDateString('es-CL')} · {o.prioridad==='urgente'?'Urgente':o.prioridad==='alta'?'Prioridad alta':'Prioridad '+o.prioridad}</small><b>{money(o.total)}</b></div></button>)}</div>}
  </section>
  <section className="wo-detail panel">
   {!selected?<div className="wo-empty-detail"><div className="empty-icon"><Wrench size={24}/></div><h3>Selecciona una orden</h3><p>Abre una OT para ver el detalle, agregar trabajos, registrar pagos y actualizar su avance.</p></div>:<>
    <div className="wo-detail-head"><div><span className="eyebrow">{selected.numero_ot} · {new Date(selected.fecha_recepcion).toLocaleDateString('es-CL')}</span><h2>{vehicleName(selected)}</h2><p>{customerName(selected)} · {selected.kilometraje_ingreso?.toLocaleString('es-CL')} km al ingreso</p></div><span className={'wo-status status-'+selected.estado}>{statusLabels[selected.estado]}</span></div>
    <div className="wo-progress">{statusOrder.slice(0,10).map((s,i)=><span key={s} title={statusLabels[s]} className={statusOrder.indexOf(selected.estado)>=i?'done':''}/>)}</div>
    <div className="wo-actions">
     {canEditOrder&&<select value={selected.estado} onChange={e=>void changeStatus(e.target.value)} disabled={saving}>{statusOrder.map(s=><option key={s} value={s}>{statusLabels[s]}</option>)}</select>}
     {canOperate&&<button className="secondary" onClick={()=>void startStopTime()}><Clock3 size={15}/>{times.some(t=>!t.termino&&t.mecanico_id===userId)?'Detener tiempo':'Iniciar tiempo'}</button>}
     {canCharge&&<button className="primary" onClick={()=>setShowPayment(true)}><CreditCard size={15}/> Registrar pago</button>}
    </div>
    <div className="wo-tabs">{[['resumen','Resumen'],['trabajos','Trabajos'],['tareas','Tareas'],['pagos','Pagos'],['inspeccion','Inspección'],['archivos','Archivos'],['tiempos','Tiempos']].map(([k,l])=><button key={k} className={tab===k?'active':''} onClick={()=>setTab(k)}>{l}</button>)}</div>
    {tab==='resumen'&&<div className="wo-tab-content">
     <div className="wo-summary-grid"><div><small>Presupuesto total</small><b>{money(selected.total)}</b></div><div><small>Pagado</small><b>{money(totalPaid)}</b></div><div><small>Saldo pendiente</small><b className={Number(selected.saldo)>0?'text-warning':''}>{money(selected.saldo)}</b></div></div>
     <div className="wo-block"><div className="wo-block-title"><h3>Recepción y diagnóstico</h3><span>{selected.prioridad.toUpperCase()}</span></div><p><b>Solicitud:</b> {selected.trabajo_solicitado||'Sin detalle'}</p><p><b>Síntomas:</b> {selected.sintomas||'Sin detalle'}</p>{canEditOrder?<><label className="wo-field">Diagnóstico técnico<textarea value={selected.diagnostico||''} onChange={e=>setSelected({...selected,diagnostico:e.target.value})} placeholder="Describe las fallas encontradas y las causas…"/></label><button className="secondary" disabled={saving} onClick={()=>void updateDiagnosis()}><Check size={15}/> Guardar diagnóstico</button></>:<p><b>Diagnóstico técnico:</b> {selected.diagnostico||'Pendiente'}</p>}</div>
     <div className="wo-block"><div className="wo-block-title"><h3>Fechas</h3><CalendarClock size={17}/></div><p>Recepción: {new Date(selected.fecha_recepcion).toLocaleString('es-CL')}</p><p>Prometida: {selected.fecha_prometida?new Date(selected.fecha_prometida).toLocaleString('es-CL'):'No definida'}</p><p>Inicio: {selected.fecha_inicio?new Date(selected.fecha_inicio).toLocaleString('es-CL'):'Pendiente'} · Término: {selected.fecha_termino?new Date(selected.fecha_termino).toLocaleString('es-CL'):'Pendiente'}</p></div>
    </div>}
    {tab==='trabajos'&&<div className="wo-tab-content"><div className="wo-block-title"><h3>Repuestos, insumos y mano de obra</h3>{canEditOrder&&<button className="primary small" onClick={()=>{setLine({tipo:'mano_obra',cantidad:1,precio_unitario:0});setShowLine(true)}}><Plus size={14}/> Agregar detalle</button>}</div>{details.length===0?<p className="muted">Aún no hay detalles.</p>:<div className="wo-lines">{details.map(d=><div className="wo-line" key={d.id}><div><b>{d.descripcion}</b><small>{d.tipo.replace('_',' ')} · {d.cantidad} × {money(d.precio_unitario)} {d.consumido?'· Stock consumido':''}</small></div><strong>{money(Number(d.cantidad)*Number(d.precio_unitario))}</strong></div>)}</div>}<div className="wo-total"><span>Subtotal</span><b>{money(selected.subtotal)}</b><span>Impuestos</span><b>{money(selected.impuesto)}</b><span>Total</span><b>{money(selected.total)}</b></div></div>}
    {tab==='tareas'&&<div className="wo-tab-content"><div className="wo-block-title"><h3>Tareas y asignaciones</h3>{canOperate&&<button className="primary small" onClick={()=>setShowTask(true)}><Plus size={14}/> Nueva tarea</button>}</div>{tasks.length===0?<p className="muted">No hay tareas asignadas.</p>:tasks.map(t=><div className="wo-task" key={t.id}><div><b>{t.titulo}</b><small>{t.descripcion||'Sin descripción'} · {t.horas_estimadas} h estimadas · {assignments.filter(a=>a.tarea_id===t.id).map(a=>team.find(m=>m.usuario_id===a.mecanico_id)?.perfiles?.nombre_completo||'Mecánico').join(', ')||'Sin asignar'}</small>{canAssign&&<select value={assignments.find(a=>a.tarea_id===t.id)?.mecanico_id||''} onChange={e=>void assignTask(t,e.target.value)}><option value="">Sin asignar</option>{team.filter(m=>m.rol==='mecanico').map(m=><option key={m.usuario_id} value={m.usuario_id}>{m.perfiles?.nombre_completo||m.usuario_id}</option>)}</select>}</div><select value={t.estado} onChange={e=>void setTaskState(t,e.target.value)}><option value="pendiente">Pendiente</option><option value="en_progreso">En progreso</option><option value="bloqueada">Bloqueada</option><option value="completada">Completada</option></select></div>)}</div>}
    {tab==='pagos'&&<div className="wo-tab-content"><div className="wo-block-title"><h3>Pagos registrados</h3>{canCharge&&<button className="primary small" onClick={()=>setShowPayment(true)}><Plus size={14}/> Registrar pago</button>}</div>{payments.length===0?<p className="muted">Sin pagos registrados.</p>:payments.map(p=><div className="wo-line" key={p.id}><div><b>{money(p.monto)} · {p.metodo}</b><small>{new Date(p.created_at).toLocaleString('es-CL')} {p.referencia?'· '+p.referencia:''}</small></div><Check size={16}/></div>)}<div className="wo-total"><span>Total pagado</span><b>{money(totalPaid)}</b><span>Saldo pendiente</span><b>{money(selected.saldo)}</b></div></div>}
    {tab==='inspeccion'&&<div className="wo-tab-content"><div className="wo-block-title"><h3>Checklist e inspecciones</h3><button className="secondary small" onClick={()=>void saveInspection('calidad')}><Plus size={14}/> Crear checklist calidad</button></div>{inspections.length===0?<p className="muted">No hay inspecciones todavía.</p>:inspections.map(i=><div className="wo-inspection" key={i.id}><b>{i.etapa==='recepcion'?'Recepción':i.etapa==='calidad'?'Control de calidad':i.etapa}</b><span className="wo-status">{i.resultado}</span><small>{Array.isArray(i.items)?i.items.length+' puntos de revisión':'Checklist'}</small></div>)}</div>}
    {tab==='archivos'&&<div className="wo-tab-content"><div className="wo-block-title"><h3>Fotografías y documentos</h3>{canOperate&&<label className="secondary small file-pick"><ImagePlus size={14}/> Adjuntar<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>void uploadEvidence(e.target.files?.[0])}/></label>}</div>{attachments.length===0?<p className="muted">No hay archivos adjuntos. JPG, PNG, WEBP o PDF; máximo 15 MB.</p>:attachments.map(a=><button className="wo-line wo-file" key={a.id} onClick={()=>void openAttachment(a)}><div><b>{a.nombre_archivo}</b><small>{a.mime_type} · {Math.round((a.tamano_bytes||0)/1024)} KB</small></div><ChevronRight size={16}/></button>)}</div>}
    {tab==='tiempos'&&<div className="wo-tab-content"><h3>Registro de tiempo de mecánicos</h3>{times.length===0?<p className="muted">Sin tiempos registrados.</p>:times.map(t=><div className="wo-line" key={t.id}><div><b>{team.find(m=>m.usuario_id===t.mecanico_id)?.perfiles?.nombre_completo||'Mecánico'}</b><small>{new Date(t.inicio).toLocaleString('es-CL')} · {t.termino?new Date(t.termino).toLocaleString('es-CL'):'En curso'}</small></div><strong>{t.duracion_minutos??'—'} min</strong></div>)}</div>}
   </>}
  </section>

  {(showCreate||showLine||showPayment||showTask)&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget){setShowCreate(false);setShowLine(false);setShowPayment(false);setShowTask(false)}}}><div className="modal wo-modal"><div className="modal-head"><div><span className="eyebrow">ORDEN DE TRABAJO</span><h2>{showCreate?'Recepción de vehículo':showLine?'Agregar trabajo o repuesto':showPayment?'Registrar pago':'Crear tarea'}</h2></div><button className="icon-button" onClick={()=>{setShowCreate(false);setShowLine(false);setShowPayment(false);setShowTask(false)}}><X size={18}/></button></div>
   {showCreate&&<div className="form-grid">
    <label className="wo-field wide">Cliente<select value={form.cliente_id||''} onChange={e=>setForm({...form,cliente_id:e.target.value,vehiculo_id:''})}><option value="">Seleccionar cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.nombre} {c.rut?'· '+c.rut:''}</option>)}</select></label>
    <label className="wo-field wide">Vehículo<select value={form.vehiculo_id||''} onChange={e=>{const v=vehicles.find(x=>x.id===e.target.value);setForm({...form,vehiculo_id:e.target.value,kilometraje:v?.kilometraje||0})}}><option value="">Seleccionar vehículo</option>{vehicles.filter(v=>v.cliente_id===form.cliente_id).map(v=><option key={v.id} value={v.id}>{v.patente} · {v.marca} {v.modelo} ({v.anio||'—'})</option>)}</select></label>
    {input('Kilometraje de ingreso','kilometraje','number')}
    <label className="wo-field">Prioridad<select value={form.prioridad} onChange={e=>setForm({...form,prioridad:e.target.value})}><option value="baja">Baja</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></label>
    {input('Fecha prometida','fecha_prometida','date')}
    <label className="wo-field wide">Trabajo solicitado<textarea value={form.trabajo_solicitado||''} onChange={e=>setForm({...form,trabajo_solicitado:e.target.value})} placeholder="Qué solicita el cliente…"/></label>
    <label className="wo-field wide">Síntomas reportados<textarea value={form.sintomas||''} onChange={e=>setForm({...form,sintomas:e.target.value})} placeholder="Ruidos, fallas, testigos, comportamiento…"/></label>
    <label className="wo-field wide">Observaciones de recepción<textarea value={form.observaciones_recepcion||''} onChange={e=>setForm({...form,observaciones_recepcion:e.target.value})}/></label>
   </div>}
   {showLine&&<div className="form-grid"><label className="wo-field">Tipo<select value={line.tipo} onChange={e=>setLine({...line,tipo:e.target.value,producto_id:'',descripcion:''})}><option value="mano_obra">Mano de obra</option><option value="repuesto">Repuesto</option><option value="insumo">Insumo</option><option value="servicio">Servicio externo</option><option value="otro">Otro</option></select></label>{['repuesto','insumo'].includes(line.tipo)&&<label className="wo-field">Producto<select value={line.producto_id||''} onChange={e=>{const p=products.find(x=>x.id===e.target.value);setLine({...line,producto_id:e.target.value,descripcion:p?.nombre||'',precio_unitario:p?.precio_venta||0})}}><option value="">Seleccionar producto</option>{products.filter(p=>p.controla_stock).map(p=><option key={p.id} value={p.id}>{p.nombre} · {p.sku||'Sin SKU'}</option>)}</select></label>}{['repuesto','insumo'].includes(line.tipo)&&<label className="wo-field">Bodega<select value={line.bodega_id||warehouses[0]?.id||''} onChange={e=>setLine({...line,bodega_id:e.target.value})}>{warehouses.map(w=><option key={w.id} value={w.id}>{w.nombre}</option>)}</select></label>}<label className="wo-field wide">Descripción<input value={line.descripcion||''} onChange={e=>setLine({...line,descripcion:e.target.value})}/></label><label className="wo-field">Cantidad<input type="number" min="0.001" step="0.001" value={line.cantidad} onChange={e=>setLine({...line,cantidad:e.target.value})}/></label><label className="wo-field">Precio unitario (CLP)<input type="number" min="0" value={line.precio_unitario} onChange={e=>setLine({...line,precio_unitario:e.target.value})}/></label></div>}
   {showPayment&&<div className="form-grid"><label className="wo-field">Monto (CLP)<input type="number" min="1" max={selected?.saldo||0} value={payment.monto} onChange={e=>setPayment({...payment,monto:e.target.value})}/></label><label className="wo-field">Medio de pago<select value={payment.metodo} onChange={e=>setPayment({...payment,metodo:e.target.value})}><option value="transferencia">Transferencia</option><option value="debito">Débito</option><option value="credito">Crédito</option><option value="efectivo">Efectivo</option><option value="cheque">Cheque</option><option value="otro">Otro</option></select></label><label className="wo-field wide">Referencia<input value={payment.referencia||''} onChange={e=>setPayment({...payment,referencia:e.target.value})}/></label><label className="wo-field wide">Observaciones<textarea value={payment.observaciones||''} onChange={e=>setPayment({...payment,observaciones:e.target.value})}/></label></div>}
   {showTask&&<div className="form-grid"><label className="wo-field wide">Nombre de la tarea<input value={task.titulo||''} onChange={e=>setTask({...task,titulo:e.target.value})}/></label><label className="wo-field wide">Descripción<textarea value={task.descripcion||''} onChange={e=>setTask({...task,descripcion:e.target.value})}/></label><label className="wo-field">Horas estimadas<input type="number" min="0" step="0.25" value={task.horas_estimadas} onChange={e=>setTask({...task,horas_estimadas:e.target.value})}/></label><label className="wo-field">Asignar mecánico<select value={task.mecanico_id||''} onChange={e=>setTask({...task,mecanico_id:e.target.value})}><option value="">Sin asignar</option>{team.filter(m=>m.rol==='mecanico').map(m=><option key={m.usuario_id} value={m.usuario_id}>{m.perfiles?.nombre_completo||m.usuario_id}</option>)}</select></label><label className="wo-field">Prioridad<select value={task.prioridad} onChange={e=>setTask({...task,prioridad:e.target.value})}><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option><option value="baja">Baja</option></select></label></div>}
   {error&&<div className="error">{error}</div>}<div className="modal-actions"><button className="secondary" onClick={()=>{setShowCreate(false);setShowLine(false);setShowPayment(false);setShowTask(false)}}>Cancelar</button><button className="primary" disabled={saving} onClick={()=>void(showCreate?createOrder():showLine?addLine():showPayment?addPayment():addTask())}>{saving?'Guardando…':<><Check size={15}/> Guardar</>}</button></div>
  </div></div>}
  {error&&<div className="wo-toast error"><AlertTriangle size={15}/>{error}<button onClick={()=>setError('')}><X size={14}/></button></div>}
  {notice&&<div className="wo-toast success"><Check size={15}/>{notice}<button onClick={()=>setNotice('')}><X size={14}/></button></div>}
 </div>
}
