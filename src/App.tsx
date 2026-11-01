import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, ArrowDownToLine, ClipboardList, Settings2, Boxes, CarFront, Check, ChevronDown, Command, LayoutDashboard, LogOut, Moon, Package, Plus, Search, Sun, Users, Warehouse, Wrench, X, Pencil, Trash2, RefreshCw, Tags, Truck, History, CircleDollarSign } from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import WorkOrders from './components/WorkOrders'

type Section = 'Resumen'|'Órdenes de trabajo'|'Inventario'|'Clientes'|'Vehículos'|'Proveedores'|'Categorías'|'Bodegas'|'Movimientos'|'Usuarios'|'Auditoría'|'Configuración'|'Catálogo de trabajos'
type Row = Record<string, any>
type Field = {key:string;label:string;type?:string;wide?:boolean;options?:string[];placeholder?:string;required?:boolean}
const navigation:{label:Section;icon:any}[]=[
 {label:'Resumen',icon:LayoutDashboard},{label:'Órdenes de trabajo',icon:ClipboardList},{label:'Inventario',icon:Package},{label:'Movimientos',icon:History},
 {label:'Clientes',icon:Users},{label:'Vehículos',icon:CarFront},{label:'Proveedores',icon:Truck},
 {label:'Categorías',icon:Tags},{label:'Bodegas',icon:Warehouse},{label:'Catálogo de trabajos',icon:Wrench},{label:'Usuarios',icon:Users},{label:'Auditoría',icon:ClipboardList},{label:'Configuración',icon:Settings2}
]
const demoKey='taller-demo-data-v1'
const money=(n:number)=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(Number(n)||0)
const today=new Date().toISOString()
function demoSeed(){
 return {
  productos:[
   {id:'p1',sku:'FIL-001',nombre:'Filtro de aceite Toyota',marca:'Mann',tipo:'repuesto',unidad:'unidad',costo_unitario:4500,precio_venta:7900,stock_minimo:5,activo:true,stock:[{cantidad:18,reservado:0,bodega_id:'b1'}]},
   {id:'p2',sku:'ACE-005',nombre:'Aceite sintético 5W-30 1L',marca:'Mobil',tipo:'insumo',unidad:'litro',costo_unitario:6200,precio_venta:9900,stock_minimo:12,activo:true,stock:[{cantidad:7,reservado:0,bodega_id:'b1'}]},
   {id:'p3',sku:'LIM-010',nombre:'Limpiador de frenos 500ml',marca:'Würth',tipo:'insumo',unidad:'unidad',costo_unitario:2800,precio_venta:4500,stock_minimo:4,activo:true,stock:[{cantidad:3,reservado:0,bodega_id:'b1'}]},
   {id:'p4',sku:'PAS-020',nombre:'Pastillas de freno delanteras',marca:'Bosch',tipo:'repuesto',unidad:'juego',costo_unitario:28500,precio_venta:42900,stock_minimo:2,activo:true,stock:[{cantidad:6,reservado:1,bodega_id:'b1'}]},
   {id:'p5',sku:'HER-003',nombre:'Llave dinamométrica 1/2"',marca:'Bahco',tipo:'herramienta',unidad:'unidad',costo_unitario:68900,precio_venta:0,stock_minimo:1,activo:true,stock:[{cantidad:2,reservado:0,bodega_id:'b1'}]}
  ],
  clientes:[
   {id:'c1',nombre:'Andrés Muñoz',tipo_persona:'natural',rut:'16.234.567-8',telefono:'+56 9 7123 4567',email:'andres.munoz@example.com',ciudad:'Puerto Montt',activo:true},
   {id:'c2',nombre:'Transportes Patagonia Ltda.',tipo_persona:'empresa',rut:'77.345.678-9',telefono:'+56 65 223 4567',email:'flota@example.com',ciudad:'Puerto Montt',activo:true},
   {id:'c3',nombre:'Camila Soto',tipo_persona:'natural',rut:'18.456.789-0',telefono:'+56 9 8234 5678',email:'camila.soto@example.com',ciudad:'Puerto Varas',activo:true}
  ],
  vehiculos:[
   {id:'v1',cliente_id:'c1',patente:'ABCD-12',marca:'Toyota',modelo:'Corolla',anio:2019,color:'Gris',kilometraje:68450,combustible:'Gasolina',activo:true},
   {id:'v2',cliente_id:'c2',patente:'KJTR-48',marca:'Hyundai',modelo:'H-1',anio:2021,color:'Blanco',kilometraje:112300,combustible:'Diésel',activo:true},
   {id:'v3',cliente_id:'c3',patente:'PLMX-73',marca:'Suzuki',modelo:'Swift',anio:2022,color:'Rojo',kilometraje:32600,combustible:'Gasolina',activo:true}
  ],
  proveedores:[{id:'s1',razon_social:'Repuestos del Sur SpA',rut:'76.123.456-7',contacto:'Camila Soto',email:'ventas@example.com',telefono:'+56 9 6123 4567',activo:true},{id:'s2',razon_social:'Lubricantes Patagonia',rut:'77.222.333-4',contacto:'Diego Pérez',email:'pedidos@example.com',telefono:'+56 65 223 9988',activo:true}],
  categorias:[{id:'g1',nombre:'Filtros y lubricantes',tipo:'repuesto',color:'#0ea5e9',activo:true},{id:'g2',nombre:'Insumos de taller',tipo:'insumo',color:'#8b5cf6',activo:true},{id:'g3',nombre:'Herramientas',tipo:'herramienta',color:'#16a34a',activo:true}],
  bodegas:[{id:'b1',nombre:'Bodega principal',ubicacion:'Área de almacenamiento',es_principal:true,activo:true}],
  taller:{nombre:'Taller Patagonia',rut:'76.555.444-3',telefono:'+56 65 223 4455',email:'contacto@tallerpatagonia.example',direccion:'Av. Presidente Ibáñez 1234',ciudad:'Puerto Montt',zona_horaria:'America/Santiago',moneda:'CLP'},
  config:{prefijo_ot:'OT',proximo_folio_ot:1,stock_negativo_permitido:false,impuesto_porcentaje:19,tema_preferido:'dark'},
  usuarios:[{id:'u1',usuario_id:'demo-user',nombre_completo:'Administrador Demo',rol:'administrador',activo:true}],
  servicios_taller:[{id:'demo-sv-1',nombre:'Cambio de aceite',precio:50000,estado:'aprobado'},{id:'demo-sv-2',nombre:'Cambio de ruedas',precio:150000,estado:'aprobado'},{id:'demo-sv-3',nombre:'Desabolladura',precio:70000,estado:'aprobado'}],
  auditoria:[{id:'a1',created_at:today,entidad:'taller',accion:'crear',entidad_id:'demo-taller',usuario_id:'demo-user',detalle:{origen:'datos de demostración'}},{id:'a2',created_at:today,entidad:'productos',accion:'crear',entidad_id:'p1',usuario_id:'demo-user',detalle:{sku:'FIL-001'}}],
  movimientos:[
   {id:'m1',created_at:today,producto_id:'p1',bodega_id:'b1',tipo:'entrada',cantidad_delta:18,costo_unitario:4500,motivo:'Carga inicial de demostración',referencia:'DEMO-001'},
   {id:'m2',created_at:today,producto_id:'p2',bodega_id:'b1',tipo:'entrada',cantidad_delta:7,costo_unitario:6200,motivo:'Carga inicial de demostración',referencia:'DEMO-002'},
   {id:'m3',created_at:today,producto_id:'p3',bodega_id:'b1',tipo:'entrada',cantidad_delta:3,costo_unitario:2800,motivo:'Carga inicial de demostración',referencia:'DEMO-003'}
  ]
 }
}
function loadDemo(){try{const raw=localStorage.getItem(demoKey);if(raw)return JSON.parse(raw)}catch{}const seed=demoSeed();localStorage.setItem(demoKey,JSON.stringify(seed));return seed}
function saveDemo(data:Row){localStorage.setItem(demoKey,JSON.stringify(data))}
function tableName(s:Section){return ({Inventario:'productos',Clientes:'clientes',Vehículos:'vehiculos',Proveedores:'proveedores',Categorías:'categorias_productos',Bodegas:'bodegas',Movimientos:'movimientos_stock',Usuarios:'usuarios_taller',Auditoría:'auditoria','Catálogo de trabajos':'servicios_taller'} as Record<string,string>)[s]||''}
function titleFor(s:Section){return ({Configuración:'Configuración',Inventario:'Producto',Clientes:'Cliente',Vehículos:'Vehículo',Proveedores:'Proveedor',Categorías:'Categoría',Bodegas:'Bodega',Movimientos:'Movimiento de inventario',Usuarios:'Usuario','Catálogo de trabajos':'Trabajo del catálogo'} as Record<string,string>)[s]||'Registro'}
function fieldsFor(s:Section,lookups:Row):Field[]{
 const f:Record<string,Field[]> = {
 Inventario:[{key:'nombre',label:'Nombre del producto',wide:true,required:true},{key:'sku',label:'SKU'},{key:'codigo_barras',label:'Código de barras'},{key:'marca',label:'Marca'},{key:'modelo_compatible',label:'Modelo compatible'},{key:'tipo',label:'Tipo',options:['repuesto','insumo','herramienta','equipo','servicio','otro']},{key:'unidad',label:'Unidad',options:['unidad','litro','metro','kg','gramo','juego','caja','par']},{key:'categoria_id',label:'Categoría',options:['',...(lookups.categorias||[]).map((x:Row)=>x.id)]},{key:'proveedor_principal_id',label:'Proveedor principal',options:['',...(lookups.proveedores||[]).map((x:Row)=>x.id)]},{key:'costo_unitario',label:'Costo unitario (CLP)',type:'number'},{key:'precio_venta',label:'Precio de venta (CLP)',type:'number'},{key:'stock_minimo',label:'Stock mínimo',type:'number'},{key:'stock_maximo',label:'Stock máximo',type:'number'},{key:'controla_stock',label:'Controla stock',options:['true','false']}],
 Clientes:[{key:'nombre',label:'Nombre / razón social',wide:true,required:true},{key:'tipo_persona',label:'Tipo',options:['natural','empresa']},{key:'rut',label:'RUT'},{key:'telefono',label:'Teléfono'},{key:'telefono_secundario',label:'Teléfono secundario'},{key:'email',label:'Correo electrónico'},{key:'direccion',label:'Dirección',wide:true},{key:'ciudad',label:'Ciudad'},{key:'notas',label:'Notas',wide:true}],
 Vehículos:[{key:'cliente_id',label:'Cliente',options:(lookups.clientes||[]).map((x:Row)=>x.id),required:true},{key:'patente',label:'Patente',required:true},{key:'vin',label:'VIN / Chasis'},{key:'marca',label:'Marca'},{key:'modelo',label:'Modelo'},{key:'anio',label:'Año',type:'number'},{key:'color',label:'Color'},{key:'motor',label:'Motor'},{key:'combustible',label:'Combustible',options:['Gasolina','Diésel','Híbrido','Eléctrico','Otro']},{key:'transmision',label:'Transmisión',options:['Manual','Automática','CVT','Otra']},{key:'kilometraje',label:'Kilometraje',type:'number'}],
 Proveedores:[{key:'razon_social',label:'Razón social',wide:true,required:true},{key:'rut',label:'RUT'},{key:'contacto',label:'Contacto'},{key:'telefono',label:'Teléfono'},{key:'email',label:'Correo electrónico'},{key:'direccion',label:'Dirección',wide:true},{key:'notas',label:'Notas',wide:true}],
 Categorías:[{key:'nombre',label:'Nombre',required:true},{key:'tipo',label:'Tipo',options:['repuesto','insumo','herramienta','equipo','servicio','otro']},{key:'descripcion',label:'Descripción',wide:true},{key:'color',label:'Color',type:'text'}],
 Bodegas:[{key:'nombre',label:'Nombre de bodega',required:true},{key:'ubicacion',label:'Ubicación'},{key:'es_principal',label:'Bodega principal',options:['true','false']}],
 Usuarios:[{key:'nombre_completo',label:'Nombre y apellido',wide:true,required:true},{key:'email',label:'Correo electrónico para invitación',wide:true,required:true},{key:'rol',label:'Rol',options:['administrador','gerente','jefe_taller','recepcionista','mecanico','bodeguero','administracion']},{key:'activo',label:'Membresía activa',options:['true','false']}],
 'Catálogo de trabajos':[{key:'nombre',label:'Nombre del trabajo',wide:true,required:true},{key:'descripcion',label:'Descripción',wide:true},{key:'precio',label:'Precio de referencia (CLP)',type:'number',required:true},{key:'estado',label:'Estado',options:['pendiente','aprobado','rechazado']}],
 Movimientos:[{key:'producto_id',label:'Producto',options:(lookups.productos||[]).map((x:Row)=>x.id),required:true},{key:'bodega_id',label:'Bodega',options:(lookups.bodegas||[]).map((x:Row)=>x.id),required:true},{key:'tipo',label:'Tipo de movimiento',options:['entrada','salida','ajuste']},{key:'cantidad',label:'Cantidad (ajuste admite negativo)',type:'number',required:true},{key:'costo_unitario',label:'Costo unitario (CLP)',type:'number'},{key:'motivo',label:'Motivo',wide:true,required:true},{key:'referencia',label:'Documento / referencia'}]
 }
 return f[s]||[]
}
function displayValue(row:Row,key:string,lookups:Row){
 if(key==='stock')return (row.stock||[]).reduce((a:number,x:Row)=>a+Number(x.cantidad||0),0)
 if(key==='cliente_id')return lookups.clientes?.find((x:Row)=>x.id===row[key])?.nombre||row[key]
 if(key==='producto_id')return lookups.productos?.find((x:Row)=>x.id===row[key])?.nombre||row[key]
 if(key==='bodega_id')return lookups.bodegas?.find((x:Row)=>x.id===row[key])?.nombre||row[key]
 if(key==='categoria_id')return lookups.categorias?.find((x:Row)=>x.id===row[key])?.nombre||'—'
 if(key==='proveedor_principal_id')return lookups.proveedores?.find((x:Row)=>x.id===row[key])?.razon_social||'—'
 if(key==='perfiles.nombre_completo')return row.perfiles?.nombre_completo||row.nombre_completo||'Usuario sin perfil'
 if(key==='estado'&&row[key])return ({pendiente:'Pendiente de revisión',aprobado:'Aprobado',rechazado:'Rechazado'} as Record<string,string>)[row[key]]||row[key]
 if(key==='created_at')return row[key]?new Date(row[key]).toLocaleString('es-CL'):'—'
 if(key==='detalle')return row[key]?JSON.stringify(row[key]):'—'
 if(key==='costo_unitario'||key==='precio_venta')return money(row[key])
 if(typeof row[key]==='boolean')return row[key]?'Sí':'No'
 return row[key]??'—'
}


const permissionModules=[{key:'resumen',label:'Resumen'},{key:'ordenes',label:'Órdenes de trabajo'},{key:'inventario',label:'Inventario'},{key:'movimientos',label:'Movimientos'},{key:'clientes',label:'Clientes'},{key:'vehiculos',label:'Vehículos'},{key:'proveedores',label:'Proveedores'},{key:'categorias',label:'Categorías'},{key:'bodegas',label:'Bodegas'},{key:'catalogo',label:'Catálogo de trabajos'},{key:'usuarios',label:'Usuarios'},{key:'auditoria',label:'Auditoría'},{key:'configuracion',label:'Configuración'}]
const sectionPermissionKey:Record<string,string>={Resumen:'resumen','Órdenes de trabajo':'ordenes',Inventario:'inventario',Movimientos:'movimientos',Clientes:'clientes',Vehículos:'vehiculos',Proveedores:'proveedores',Categorías:'categorias',Bodegas:'bodegas','Catálogo de trabajos':'catalogo',Usuarios:'usuarios',Auditoría:'auditoria',Configuración:'configuracion'}
function defaultRolePermissions(role:string){
 const all=role==='administrador'||role==='gerente'
 const rules:Record<string,string[]>={jefe_taller:['ordenes','inventario','movimientos','clientes','vehiculos','proveedores','categorias','bodegas'],recepcionista:['ordenes','clientes','vehiculos'],mecanico:['ordenes'],bodeguero:['inventario','movimientos','proveedores','categorias','bodegas'],administracion:['ordenes','clientes','vehiculos','proveedores']}
 const can=rules[role]||[]
 return Object.fromEntries(permissionModules.map(m=>{const view=all||m.key==='resumen'||can.includes(m.key)||(role==='administracion'&&m.key==='configuracion');const write=all||can.includes(m.key)&&(['jefe_taller','bodeguero'].includes(role)||['ordenes','clientes','vehiculos'].includes(m.key)&&['recepcionista','administracion'].includes(role));return [m.key,{ver:view,crear:all||write,editar:all||write,eliminar:all}] }))
}

export default function App(){
 const demoMode=!isSupabaseConfigured
 const [session,setSession]=useState<any>(demoMode?{user:{id:'demo-user',email:'demo@taller.local',user_metadata:{nombre_completo:'Administrador Demo'}}}:null)
 const [workshop,setWorkshop]=useState<Row|null>(demoMode?{taller_id:'demo-taller',nombre:'Taller Patagonia',rol:'administrador'}:null)
 const [section,setSection]=useState<Section>('Resumen')
 const [theme,setTheme]=useState(localStorage.getItem('taller-theme')||'dark')
 const [rows,setRows]=useState<Row[]>([])
 const [lookups,setLookups]=useState<Row>({})
 const [stats,setStats]=useState({products:0,clients:0,vehicles:0,low:0,value:0,movements:0})
 const [loading,setLoading]=useState(false)
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 const [search,setSearch]=useState('')
 const [modal,setModal]=useState(false)
 const [editing,setEditing]=useState<Row|null>(null)
 const [saving,setSaving]=useState(false)
 const [form,setForm]=useState<Row>({})
 const [loginMode,setLoginMode]=useState<'login'|'signup'>('login')
 const [credentials,setCredentials]=useState({email:'',password:'',name:''})
 const [setup,setSetup]=useState({nombre:'',telefono:'',email:''})
 const [demoData,setDemoData]=useState<Row>(demoMode?loadDemo():{})
 const [config,setConfig]=useState<Row>(demoMode?loadDemo().config:{prefijo_ot:'OT',proximo_folio_ot:1,stock_negativo_permitido:false,impuesto_porcentaje:19,tema_preferido:'dark'})
 const [workshopForm,setWorkshopForm]=useState<Row>(demoMode?loadDemo().taller:{})
 const [rolePermissions,setRolePermissions]=useState<Row>(demoMode?(loadDemo().rolePermissions||{}):{})
 const [permissionRole,setPermissionRole]=useState('mecanico')

 useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('taller-theme',theme)},[theme])
 useEffect(()=>{if(!demoMode){supabase.auth.getSession().then(({data})=>setSession(data.session));const {data}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>data.subscription.unsubscribe()}},[])
 useEffect(()=>{if(!session||demoMode)return;void loadWorkshop()},[session])
 useEffect(()=>{if(workshop){setWorkshopForm({nombre:workshop.nombre||'',rut:workshop.rut||'',telefono:workshop.telefono||'',email:workshop.email||'',direccion:workshop.direccion||'',ciudad:workshop.ciudad||'',zona_horaria:workshop.zona_horaria||'America/Santiago',moneda:workshop.moneda||'CLP'});void loadSection()}},[workshop,section])
 useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key==='Escape')setModal(false);if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();document.getElementById('global-search')?.focus()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='n'&&section!=='Resumen'&&section!=='Auditoría'&&section!=='Configuración'&&section!=='Órdenes de trabajo'){e.preventDefault();openNew()}};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[section,lookups])

 function persistDemo(next:Row){setDemoData(next);saveDemo(next)}
 function demoLookups(data:Row){return {productos:data.productos,clientes:data.clientes,proveedores:data.proveedores,bodegas:data.bodegas,categorias:data.categorias}}
 async function loadWorkshop(){
  setLoading(true);setError('')
  const {data,error}=await supabase.from('usuarios_taller').select('taller_id,rol,talleres(*)').eq('usuario_id',session.user.id).eq('activo',true).limit(1).maybeSingle()
  if(error)setError(error.message)
  setWorkshop(data?{...data,...(Array.isArray(data.talleres)?data.talleres[0]:data.talleres)}:null)
  setLoading(false)
 }
 async function loadSection(){
  if(!workshop)return
  if(section==='Órdenes de trabajo'){setRows([]);setLoading(false);return}
  setLoading(true);setError('')
  if(demoMode){
   const d=demoData;setLookups(demoLookups(d))
   if(section==='Configuración'){setConfig(d.config||config);setWorkshopForm(d.taller||workshopForm);setRolePermissions(d.rolePermissions||{});setRows([]);setLoading(false);return}
   if(section==='Resumen'){const active=d.productos.filter((x:Row)=>x.activo);const low=active.filter((x:Row)=>(x.stock||[]).reduce((a:number,y:Row)=>a+Number(y.cantidad),0)<=Number(x.stock_minimo)).length;setStats({products:active.length,clients:d.clientes.filter((x:Row)=>x.activo).length,vehicles:d.vehiculos.filter((x:Row)=>x.activo).length,low,value:active.reduce((a:number,x:Row)=>a+Number(x.costo_unitario)*((x.stock||[]).reduce((b:number,y:Row)=>b+Number(y.cantidad),0)),0),movements:d.movimientos.length});setRows([])}
   else setRows((d[({Inventario:'productos',Clientes:'clientes',Vehículos:'vehiculos',Proveedores:'proveedores',Categorías:'categorias',Bodegas:'bodegas',Movimientos:'movimientos',Usuarios:'usuarios',Auditoría:'auditoria','Catálogo de trabajos':'servicios_taller'} as Record<string,string>)[section]]||[]).filter((x:Row)=>x.activo!==false||section==='Movimientos'))
   setLoading(false);return
  }
  const id=workshop.taller_id
  if(section==='Configuración'){const [cfg,perms]=await Promise.all([supabase.from('configuracion_taller').select('*').eq('taller_id',id).maybeSingle(),supabase.from('permisos_rol_taller').select('rol,permisos').eq('taller_id',id)]);if(cfg.error)setError(cfg.error.message);if(perms.error)setError(perms.error.message);setConfig(cfg.data||{prefijo_ot:'OT',proximo_folio_ot:1,stock_negativo_permitido:false,impuesto_porcentaje:19,tema_preferido:'system'});setRolePermissions(Object.fromEntries((perms.data||[]).map((x:Row)=>[x.rol,x.permisos])));setRows([]);setLoading(false);return}
  const [cats,provs,bods,clients,products]=await Promise.all([
   supabase.from('categorias_productos').select('id,nombre,tipo,activo').eq('taller_id',id).eq('activo',true),
   supabase.from('proveedores').select('id,razon_social,activo').eq('taller_id',id).eq('activo',true),
   supabase.from('bodegas').select('id,nombre,es_principal,activo').eq('taller_id',id).eq('activo',true),
   supabase.from('clientes').select('id,nombre,activo').eq('taller_id',id).eq('activo',true),
   supabase.from('productos').select('id,nombre,sku,activo').eq('taller_id',id).eq('activo',true)
  ])
  setLookups({categorias:cats.data||[],proveedores:provs.data||[],bodegas:bods.data||[],clientes:clients.data||[],productos:products.data||[]})
  if(section==='Resumen'){
   const [p,c,v,m]=await Promise.all([
    supabase.from('productos').select('id,stock_minimo,costo_unitario,stock(cantidad)',{count:'exact'}).eq('taller_id',id).eq('activo',true),
    supabase.from('clientes').select('id',{count:'exact',head:true}).eq('taller_id',id).eq('activo',true),
    supabase.from('vehiculos').select('id',{count:'exact',head:true}).eq('taller_id',id).eq('activo',true),
    supabase.from('movimientos_stock').select('id',{count:'exact',head:true}).eq('taller_id',id)
   ])
   const active=p.data||[];setStats({products:p.count||0,clients:c.count||0,vehicles:v.count||0,low:active.filter((x:Row)=>(x.stock||[]).reduce((a:number,y:Row)=>a+Number(y.cantidad),0)<=Number(x.stock_minimo)).length,value:active.reduce((a:number,x:Row)=>a+Number(x.costo_unitario)*(x.stock||[]).reduce((b:number,y:Row)=>b+Number(y.cantidad),0),0),movements:m.count||0});setRows([])
   const e=[p.error,c.error,v.error,m.error].find(Boolean);if(e)setError(e.message)
  }else{
   const table=tableName(section)
   const select=section==='Inventario'?'*,stock(cantidad,reservado,bodega_id),categorias_productos(nombre),proveedores(razon_social)':section==='Usuarios'?'id,usuario_id,rol,activo,created_at,perfiles!usuarios_taller_perfiles_fkey(nombre_completo)':section==='Auditoría'?'id,taller_id,usuario_id,entidad,entidad_id,accion,detalle,created_at,perfiles!auditoria_perfiles_fkey(nombre_completo)':'*'
   const {data,error}=await supabase.from(table).select(select).eq('taller_id',id).order('created_at',{ascending:false}).limit(500)
   if(error)setError(error.message)
   setRows(data||[])
  }
  setLoading(false)
 }
 function openNew(){setEditing(null);setForm(section==='Catálogo de trabajos'?{nombre:'',descripcion:'',precio:0,estado:'aprobado'}:section==='Movimientos'?{tipo:'entrada',cantidad:1,costo_unitario:0,motivo:'',producto_id:lookups.productos?.[0]?.id,bodega_id:lookups.bodegas?.[0]?.id}:section==='Inventario'?{tipo:'repuesto',unidad:'unidad',costo_unitario:0,precio_venta:0,stock_minimo:0,controla_stock:'true'}:section==='Clientes'?{tipo_persona:'natural'}:section==='Vehículos'?{cliente_id:lookups.clientes?.[0]?.id,kilometraje:0}:section==='Categorías'?{tipo:'repuesto',color:'#64748b'}:section==='Bodegas'?{es_principal:'false'}:section==='Usuarios'?{rol:'mecanico',activo:'true'}:{});setModal(true)}
 function openEdit(row:Row){setEditing(row);setForm({...row,nombre_completo:row.perfiles?.nombre_completo||row.nombre_completo||''});setModal(true)}
 async function saveRecord(){
  if(!workshop)return
  setSaving(true);setError('');setNotice('')
  try{
   if(demoMode){
    const d={...demoData};d.servicios_taller=d.servicios_taller||[];const collection=({Inventario:'productos',Clientes:'clientes',Vehículos:'vehiculos',Proveedores:'proveedores',Categorías:'categorias',Bodegas:'bodegas',Movimientos:'movimientos',Usuarios:'usuarios',Auditoría:'auditoria'} as Record<string,string>)[section]
    if(section==='Movimientos'){
     const qty=Number(form.cantidad);const delta=form.tipo==='entrada'?Math.abs(qty):form.tipo==='salida'?-Math.abs(qty):qty
     const p=d.productos.find((x:Row)=>x.id===form.producto_id);if(!p)throw new Error('Selecciona un producto válido.')
     p.stock=p.stock||[];let s=p.stock.find((x:Row)=>x.bodega_id===form.bodega_id);if(!s){s={cantidad:0,reservado:0,bodega_id:form.bodega_id};p.stock.push(s)}
     if(Number(s.cantidad)+delta<0)throw new Error('Stock insuficiente. Disponible: '+s.cantidad)
     s.cantidad=Number(s.cantidad)+delta;d.movimientos.unshift({id:crypto.randomUUID(),created_at:new Date().toISOString(),producto_id:form.producto_id,bodega_id:form.bodega_id,tipo:form.tipo,cantidad_delta:delta,costo_unitario:Number(form.costo_unitario)||0,motivo:form.motivo,referencia:form.referencia})
    }else if(section==='Inventario'&&!editing){
     const id=crypto.randomUUID();const row={...form,id,activo:true,stock:[{cantidad:0,reservado:0,bodega_id:d.bodegas[0]?.id||'b1'}]};d.productos.unshift(row)
    }else{
     const index=d[collection].findIndex((x:Row)=>x.id===editing?.id)
     if(editing&&index>=0)d[collection][index]={...d[collection][index],...form}
     else d[collection].unshift({...form,id:crypto.randomUUID(),activo:true})
    }
    persistDemo(d);setModal(false);setNotice('Cambios guardados correctamente.');await loadSection()
   }else{
    const table=tableName(section)
    if(section==='Usuarios'&&!editing){
     const {data,error}=await supabase.functions.invoke('invitar-usuario',{body:{taller_id:workshop.taller_id,nombre_completo:form.nombre_completo,email:form.email,rol:form.rol}})
     if(error)throw error
     if(data?.error)throw new Error(data.error)
    }else if(section==='Usuarios'&&editing){
     const {error}=await supabase.from('usuarios_taller').update({rol:form.rol,activo:form.activo==='true'||form.activo===true}).eq('id',editing.id).eq('taller_id',workshop.taller_id)
     if(error)throw error
     if(form.nombre_completo&&form.nombre_completo!==editing.perfiles?.nombre_completo){const profile=await supabase.from('perfiles').update({nombre_completo:form.nombre_completo}).eq('id',editing.usuario_id);if(profile.error)throw profile.error}
    }else if(section==='Catálogo de trabajos'){
     const payload={taller_id:workshop.taller_id,nombre:form.nombre,descripcion:form.descripcion||null,precio:Number(form.precio)||0,estado:form.estado||'aprobado',creado_por:session.user.id,revisado_por:form.estado==='aprobado'?session.user.id:null,revisado_at:form.estado==='aprobado'?new Date().toISOString():null}
     const result=editing?await supabase.from('servicios_taller').update(payload).eq('id',editing.id):await supabase.from('servicios_taller').insert(payload)
     if(result.error)throw result.error
    }else if(section==='Movimientos'){
     const {error}=await supabase.rpc('registrar_movimiento_stock',{p_taller_id:workshop.taller_id,p_producto_id:form.producto_id,p_bodega_id:form.bodega_id,p_tipo:form.tipo,p_cantidad:Number(form.cantidad),p_costo_unitario:Number(form.costo_unitario)||0,p_motivo:form.motivo,p_referencia:form.referencia||null})
     if(error)throw error
    }else{
     const payload={...form,taller_id:workshop.taller_id};delete payload.id;delete payload.created_at;delete payload.updated_at;delete payload.stock;delete payload.categorias_productos;delete payload.proveedores
     for(const key of ['controla_stock','es_principal','activo'])if(typeof payload[key]==='string')payload[key]=payload[key]==='true'
     const result=editing?await supabase.from(table).update(payload).eq('id',editing.id).eq('taller_id',workshop.taller_id):await supabase.from(table).insert(payload)
     if(result.error)throw result.error
    }
    setModal(false);setNotice('Cambios guardados correctamente.');await loadSection()
   }
  }catch(e:any){setError(e.message||'No se pudo guardar el registro.')}
  setSaving(false)
 }
 async function saveSettings(){
  if(!workshop)return
  setSaving(true);setError('');setNotice('')
  try{
   const company={nombre:workshopForm.nombre,rut:workshopForm.rut||null,telefono:workshopForm.telefono||null,email:workshopForm.email||null,direccion:workshopForm.direccion||null,ciudad:workshopForm.ciudad||null,zona_horaria:'America/Santiago',moneda:'CLP'}
   const cfg={prefijo_ot:config.prefijo_ot,proximo_folio_ot:Number(config.proximo_folio_ot)||1,stock_negativo_permitido:Boolean(config.stock_negativo_permitido),impuesto_porcentaje:Number(config.impuesto_porcentaje)||0,tema_preferido:config.tema_preferido}
   if(demoMode){const d={...demoData,taller:company,config:cfg};persistDemo(d);setWorkshop({...workshop,...company});setConfig(cfg)}
   else{const a=await supabase.from('talleres').update(company).eq('id',workshop.taller_id);if(a.error)throw a.error;const b=await supabase.from('configuracion_taller').update(cfg).eq('taller_id',workshop.taller_id);if(b.error)throw b.error;await loadWorkshop();setConfig(cfg)}
   if(cfg.tema_preferido==='light'||cfg.tema_preferido==='dark')setTheme(cfg.tema_preferido)
   setNotice('Configuración guardada.')
  }catch(e:any){setError(e.message||'No se pudo guardar la configuración.')}
  setSaving(false)
 }
 async function reviewService(row:Row,estado:'aprobado'|'rechazado'){
  if(demoMode){const d={...demoData};const svc=(d.servicios_taller||[]).find((x:Row)=>x.id===row.id);if(svc)Object.assign(svc,{estado,revisado_at:new Date().toISOString()});persistDemo(d);await loadSection();return}
  const {error}=await supabase.from('servicios_taller').update({estado,revisado_por:session.user.id,revisado_at:new Date().toISOString()}).eq('id',row.id).eq('taller_id',workshop.taller_id)
  if(error)setError(error.message);else{setNotice(estado==='aprobado'?'Trabajo aprobado y disponible en las OT.':'Propuesta rechazada.');await loadSection()}
 }

 async function saveRolePermissions(){
  if(!workshop||!['administrador','gerente','administracion'].includes(workshop.rol||''))return
  if(permissionRole==='administrador'){setNotice('Los permisos del rol administrador permanecen completos para evitar bloquear la administración.');return}
  setSaving(true);setError('')
  const permisos=rolePermissions[permissionRole]||defaultRolePermissions(permissionRole)
  try{
   if(demoMode){const d={...demoData,rolePermissions:{...(demoData.rolePermissions||{}),[permissionRole]:permisos}};persistDemo(d)}
   else{const {error}=await supabase.from('permisos_rol_taller').upsert({taller_id:workshop.taller_id,rol:permissionRole,permisos,updated_by:session.user.id},{onConflict:'taller_id,rol'});if(error)throw error}
   setRolePermissions((current:Row)=>({...current,[permissionRole]:permisos}));setNotice('Permisos del rol actualizados.')
  }catch(e:any){setError(e.message||'No se pudieron guardar los permisos.')}
  setSaving(false)
 }
 const canManagePermissions=['administrador','gerente','administracion'].includes(workshop?.rol||'')
 function toggleRolePermission(module:string,action:string,value:boolean){
  const base=rolePermissions[permissionRole]||defaultRolePermissions(permissionRole)
  setRolePermissions((current:Row)=>({...current,[permissionRole]:{...base,[module]:{...(base[module]||{}),[action]:value}}}))
 }
 async function archive(row:Row){
  if(!confirm('¿Deseas desactivar este registro? Se conservará el historial.'))return
  setError('')
  if(demoMode){const d={...demoData};const col=({Inventario:'productos',Clientes:'clientes',Vehículos:'vehiculos',Proveedores:'proveedores',Categorías:'categorias',Bodegas:'bodegas',Usuarios:'usuarios'} as Record<string,string>)[section];const r=d[col].find((x:Row)=>x.id===row.id);if(r)r.activo=false;persistDemo(d);await loadSection();return}
  const {error}=await supabase.from(tableName(section)).update({activo:false}).eq('id',row.id).eq('taller_id',workshop.taller_id)
  if(error)setError(error.message);else await loadSection()
 }
 async function authenticate(){
  setSaving(true);setError('')
  const r=loginMode==='login'?await supabase.auth.signInWithPassword({email:credentials.email,password:credentials.password}):await supabase.auth.signUp({email:credentials.email,password:credentials.password,options:{data:{nombre_completo:credentials.name},emailRedirectTo:`${window.location.origin}/Taller/`}})
  if(r.error)setError(r.error.message);else if(loginMode==='signup'&&!r.data.session)setError('Cuenta creada. Revisa tu correo si la confirmación está habilitada.')
  setSaving(false)
 }
 async function createWorkshop(){
  setSaving(true);setError('')
  const {error}=await supabase.rpc('crear_taller_inicial',{p_nombre:setup.nombre,p_telefono:setup.telefono||null,p_email:setup.email||null,p_cargar_demo:true})
  if(error)setError(error.message);else await loadWorkshop()
  setSaving(false)
 }
 const filtered=useMemo(()=>rows.filter(r=>JSON.stringify(r).toLowerCase().includes(search.toLowerCase())),[rows,search])
 const columns:Record<Section,string[]>={Resumen:[],'Órdenes de trabajo':[],Inventario:['sku','nombre','marca','tipo','stock','stock_minimo','costo_unitario','precio_venta'],Clientes:['nombre','rut','telefono','email','ciudad'],Vehículos:['patente','marca','modelo','anio','kilometraje','cliente_id'],Proveedores:['razon_social','rut','contacto','telefono','email'],Categorías:['nombre','tipo','descripcion'],Bodegas:['nombre','ubicacion','es_principal'],Movimientos:['created_at','tipo','producto_id','cantidad_delta','costo_unitario','motivo','referencia'],Usuarios:['perfiles.nombre_completo','rol','activo','created_at'],Auditoría:['created_at','entidad','accion','entidad_id','perfiles.nombre_completo','detalle'],'Catálogo de trabajos':['nombre','descripcion','precio','estado','created_at'],Configuración:[]}
 const permissionFor=(sectionName:string,action:'ver'|'crear'|'editar'|'eliminar')=>{const role=workshop?.rol||'administrador';const module=sectionPermissionKey[sectionName]||'resumen';const defaults=defaultRolePermissions(role);return (rolePermissions[role]?.[module]?.[action]??defaults[module]?.[action]??false)}
 const canWrite:Record<Section,boolean>=Object.fromEntries((navigation.map(n=>n.label) as Section[]).map(name=>[name,permissionFor(name,'crear')||permissionFor(name,'editar')])) as Record<Section,boolean>
 const stockFor=(r:Row)=>(r.stock||[]).reduce((a:number,x:Row)=>a+Number(x.cantidad||0),0)
 if(!demoMode&&!session)return <div className="setup-screen"><div className="login-card"><Brand/><span className="eyebrow">PLATAFORMA DE GESTIÓN</span><h1>{loginMode==='login'?'Bienvenido de vuelta':'Crea tu cuenta'}</h1><p>Administra tu taller desde un solo lugar.</p>{loginMode==='signup'&&<input placeholder="Nombre completo" value={credentials.name} onChange={e=>setCredentials({...credentials,name:e.target.value})}/>}<input type="email" placeholder="Correo electrónico" value={credentials.email} onChange={e=>setCredentials({...credentials,email:e.target.value})}/><input type="password" placeholder="Contraseña" value={credentials.password} onChange={e=>setCredentials({...credentials,password:e.target.value})}/>{error&&<div className="error">{error}</div>}<button className="primary full" disabled={saving} onClick={authenticate}>{saving?'Procesando…':loginMode==='login'?'Iniciar sesión':'Crear cuenta'}</button><button className="link-button" onClick={()=>setLoginMode(loginMode==='login'?'signup':'login')}>{loginMode==='login'?'¿No tienes cuenta? Crear una':'Ya tengo cuenta'}</button></div></div>
 if(loading&&!workshop)return <div className="loading-screen"><div className="spinner"/><span>Preparando tu espacio de trabajo…</span></div>
 if(!demoMode&&!workshop)return <div className="setup-screen"><div className="login-card"><Brand/><span className="eyebrow">CONFIGURACIÓN INICIAL</span><h1>Tu taller comienza aquí</h1><p>Configura tu espacio y carga datos realistas de demostración.</p><input placeholder="Nombre del taller" value={setup.nombre} onChange={e=>setSetup({...setup,nombre:e.target.value})}/><input placeholder="Teléfono (opcional)" value={setup.telefono} onChange={e=>setSetup({...setup,telefono:e.target.value})}/><input placeholder="Correo del taller (opcional)" value={setup.email} onChange={e=>setSetup({...setup,email:e.target.value})}/>{error&&<div className="error">{error}</div>}<button className="primary full" disabled={saving||setup.nombre.trim().length<2} onClick={createWorkshop}>{saving?'Creando…':'Crear taller y cargar demostración'}</button></div></div>
 return <div className="app-shell">
  <aside className="sidebar"><Brand/><div className="workspace"><div className="workspace-mark">T</div><div><b>{workshop?.nombre}</b><small>{demoMode?'Entorno demostración':'Espacio de trabajo'}</small></div><ChevronDown size={15}/></div><div className="nav-label">ESPACIO DE TRABAJO</div><nav>{navigation.filter(n=>permissionFor(n.label,'ver')).map(n=><button key={n.label} className={section===n.label?'nav-item active':'nav-item'} onClick={()=>{setSection(n.label);setSearch('')}}><n.icon size={18}/><span>{n.label}</span>{n.label==='Inventario'&&stats.low>0&&<i>{stats.low}</i>}</button>)}</nav><div className="sidebar-bottom"><div className="user-row"><div className="avatar">{(session?.user?.user_metadata?.nombre_completo||session?.user?.email||'A').slice(0,1).toUpperCase()}</div><div><b>{session?.user?.user_metadata?.nombre_completo||session?.user?.email||'Administrador'}</b><small>{workshop?.rol||'administrador'}</small></div>{demoMode?<span className="demo-pill">DEMO</span>:<button title="Cerrar sesión" onClick={()=>supabase.auth.signOut()}><LogOut size={16}/></button>}</div></div></aside>
  <main className="main-area"><header className="topbar"><div className="crumb">Taller <span>/</span> <b>{section}</b></div><div className="top-actions"><div className="searchbox"><Search size={16}/><input id="global-search" placeholder="Buscar en el módulo…" value={search} onChange={e=>setSearch(e.target.value)}/><kbd>Ctrl K</kbd></div><button className="icon-button" title="Cambiar tema" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button><button className="icon-button" title="Actualizar" onClick={()=>void loadSection()}><RefreshCw size={16}/></button></div></header>
   <div className="content"><div className="page-heading"><div><span className="eyebrow">{section==='Resumen'?'VISTA GENERAL':'GESTIÓN DEL TALLER'}</span><h1>{section==='Resumen'?'Resumen del taller':section}</h1><p>{section==='Resumen'?'Indicadores principales y estado de tu operación.':'Consulta, registra y administra '+section.toLowerCase()+'.'}</p></div>{section!=='Resumen'&&section!=='Configuración'&&section!=='Órdenes de trabajo'&&permissionFor(section,'crear')&&<button className="primary" onClick={openNew}><Plus size={17}/>{section==='Movimientos'?'Registrar movimiento':'Nuevo '+titleFor(section).toLowerCase()}</button>}</div>
   {demoMode&&<div className="demo-banner"><Command size={15}/> Estás explorando datos ficticios en modo demostración. Los cambios se guardan en este navegador.</div>}
   {error&&<div className="error banner"><AlertTriangle size={17}/>{error}<button onClick={()=>setError('')}><X size={15}/></button></div>}{notice&&<div className="success banner"><Check size={16}/>{notice}<button onClick={()=>setNotice('')}><X size={15}/></button></div>}
   {section==='Órdenes de trabajo'?<WorkOrders workshop={workshop} userId={session?.user?.id} role={workshop?.rol||'recepcionista'} demoMode={demoMode} permissions={{view:permissionFor('Órdenes de trabajo','ver'),create:permissionFor('Órdenes de trabajo','crear'),edit:permissionFor('Órdenes de trabajo','editar')}}/>:section==='Configuración'?<div className="settings-grid"><div className="panel settings-panel"><div className="panel-head"><div><h3>Datos del taller</h3><p>Información general y localización</p></div><Settings2 size={18}/></div><div className="settings-form">{[{key:'nombre',label:'Nombre del taller'},{key:'rut',label:'RUT'},{key:'telefono',label:'Teléfono'},{key:'email',label:'Correo electrónico'},{key:'direccion',label:'Dirección'},{key:'ciudad',label:'Ciudad'}].map(x=><label key={x.key}>{x.label}<input disabled={!canWrite.Configuración} value={workshopForm[x.key]||''} onChange={e=>setWorkshopForm({...workshopForm,[x.key]:e.target.value})}/></label>)}<div className="settings-readonly"><span>Zona horaria</span><b>America/Santiago</b><span>Moneda</span><b>CLP — Peso chileno</b></div></div></div><div className="panel settings-panel"><div className="panel-head"><div><h3>Parámetros operativos</h3><p>Preferencias y valores iniciales</p></div><Wrench size={18}/></div><div className="settings-form">{[{key:'prefijo_ot',label:'Prefijo de órdenes de trabajo',type:'text'},{key:'proximo_folio_ot',label:'Próximo folio OT',type:'number'},{key:'impuesto_porcentaje',label:'Impuesto (%)',type:'number'}].map(x=><label key={x.key}>{x.label}<input disabled={!canWrite.Configuración} type={x.type} value={config[x.key]??''} onChange={e=>setConfig({...config,[x.key]:x.type==='number'?Number(e.target.value):e.target.value})}/></label>)}<label>Permitir stock negativo<select disabled={!canWrite.Configuración} value={String(config.stock_negativo_permitido)} onChange={e=>setConfig({...config,stock_negativo_permitido:e.target.value==='true'})}><option value="false">No</option><option value="true">Sí</option></select></label><label>Tema predeterminado<select disabled={!canWrite.Configuración} value={config.tema_preferido||'system'} onChange={e=>setConfig({...config,tema_preferido:e.target.value})}><option value="system">Sistema</option><option value="light">Claro</option><option value="dark">Oscuro</option></select></label></div>{canWrite.Configuración&&<div className="settings-actions"><button className="primary" disabled={saving} onClick={()=>void saveSettings()}>{saving?'Guardando…':<><Check size={16}/> Guardar configuración</>}</button></div>}</div><div className="panel settings-panel role-permissions-panel"><div className="panel-head"><div><h3>Permisos por rol</h3><p>Define qué puede ver, crear, editar o eliminar cada perfil del taller.</p></div><Users size={18}/></div><label className="role-select">Rol a configurar<select value={permissionRole} onChange={e=>setPermissionRole(e.target.value)}><option value="gerente">Gerencia</option><option value="jefe_taller">Jefe de taller</option><option value="recepcionista">Recepción</option><option value="mecanico">Mecánico</option><option value="bodeguero">Bodeguero</option><option value="administracion">Administración</option><option value="administrador">Administrador (protegido)</option></select></label><div className="permission-table"><div className="permission-row permission-head"><b>Módulo</b><b>Ver</b><b>Crear</b><b>Editar</b><b>Eliminar</b></div>{permissionModules.map(m=>{const current=rolePermissions[permissionRole]||defaultRolePermissions(permissionRole);const p=current[m.key]||defaultRolePermissions(permissionRole)[m.key];return <div className="permission-row" key={m.key}><span>{m.label}</span>{(['ver','crear','editar','eliminar'] as const).map(action=><label key={action}><input type="checkbox" checked={Boolean(p[action])} disabled={!canManagePermissions||permissionRole==='administrador'||(action!=='ver'&&!p.ver)} onChange={e=>toggleRolePermission(m.key,action,e.target.checked)}/></label>)}</div>})}</div><div className="settings-actions"><button className="primary" disabled={saving||!canManagePermissions||permissionRole==='administrador'} onClick={()=>void saveRolePermissions()}>{saving?'Guardando…':<><Check size={16}/> Guardar permisos del rol</>}</button></div></div></div>:section==='Resumen'?<><div className="stat-grid"><Stat icon={Package} label="Productos activos" value={stats.products} hint="En catálogo"/><Stat icon={Users} label="Clientes" value={stats.clients} hint="Registrados"/><Stat icon={CarFront} label="Vehículos" value={stats.vehicles} hint="En historial"/><Stat icon={AlertTriangle} label="Stock bajo" value={stats.low} hint="Requieren reposición" alert={stats.low>0}/></div><div className="stat-grid second-stats"><Stat icon={CircleDollarSign} label="Valor del inventario" value={stats.value} hint="Costo valorizado" currency/><Stat icon={Activity} label="Movimientos" value={stats.movements} hint="Kardex registrado"/></div><div className="dashboard-grid"><div className="panel"><div className="panel-head"><div><h3>Alertas de inventario</h3><p>Productos iguales o bajo el stock mínimo</p></div><button className="subtle" onClick={()=>setSection('Inventario')}>Ver inventario</button></div><div className="alert-list">{(demoMode?demoData.productos.filter((x:Row)=>x.activo&&stockFor(x)<=Number(x.stock_minimo)):[]).map((p:Row)=><div className="alert-row" key={p.id}><div className="quick-icon warning"><AlertTriangle size={17}/></div><div><b>{p.nombre}</b><small>{p.sku} · Mínimo {p.stock_minimo}</small></div><strong>{stockFor(p)} {p.unidad}</strong></div>)}{stats.low===0&&<div className="empty-state compact"><Check size={23}/><b>Todo bajo control</b><p>No hay productos bajo el mínimo.</p></div>}</div></div><div className="panel"><div className="panel-head"><div><h3>Accesos rápidos</h3><p>Operaciones habituales</p></div><Command size={18}/></div><div className="quick-list"><Quick icon={Package} title="Agregar producto" desc="Crear un repuesto o insumo" onClick={()=>{setSection('Inventario');setEditing(null);setForm({tipo:'repuesto',unidad:'unidad',costo_unitario:0,precio_venta:0,stock_minimo:0,controla_stock:'true'});setModal(true)}}/><Quick icon={ArrowDownToLine} title="Registrar entrada" desc="Recibir productos en bodega" onClick={()=>{setSection('Movimientos');setEditing(null);setForm({tipo:'entrada',cantidad:1,costo_unitario:0,motivo:'Recepción de compra',producto_id:lookups.productos?.[0]?.id,bodega_id:lookups.bodegas?.[0]?.id});setModal(true)}}/><Quick icon={Users} title="Registrar cliente" desc="Crear ficha de cliente" onClick={()=>{setSection('Clientes');setEditing(null);setForm({tipo_persona:'natural'});setModal(true)}}/></div></div></div></>:<div className="panel table-panel"><div className="table-toolbar"><div><b>{filtered.length} registros</b><span> · {section==='Movimientos'?'Kardex completo':'Hasta 500 registros'}</span></div><button className="subtle" onClick={()=>void loadSection()}><RefreshCw size={15}/> Actualizar</button></div>{loading?<div className="empty-state">Cargando información…</div>:filtered.length===0?<div className="empty-state"><div className="empty-icon"><Wrench size={22}/></div><b>No hay registros todavía</b><p>Agrega información con el botón superior para comenzar.</p></div>:<div className="table-wrap"><table><thead><tr>{columns[section].map(c=><th key={c}>{c==='stock'?'Stock actual':c.replaceAll('_',' ')}</th>)}{section!=='Movimientos'&&section!=='Auditoría'&&(permissionFor(section,'editar')||permissionFor(section,'eliminar')||section==='Catálogo de trabajos')&&<th>Acciones</th>}</tr></thead><tbody>{filtered.map((r,i)=><tr key={r.id||i} className={section==='Inventario'&&stockFor(r)<=Number(r.stock_minimo)?'inventory-row-alert':''}>{columns[section].map(c=><td key={c}>{section==='Inventario'&&c==='stock'?(<span className={stockFor(r)<=Number(r.stock_minimo)?'stock-alert-badge':'stock-normal-badge'}>{stockFor(r)<=Number(r.stock_minimo)&&<AlertTriangle size={13}/>} {stockFor(r)} {r.unidad||'unidades'}{stockFor(r)<=Number(r.stock_minimo)?' · Stock bajo':' · Disponible'}</span>):c==='perfiles.nombre_completo'?displayValue(r,c,lookups):c==='precio'?money(r.precio):displayValue(r,c,lookups)}</td>)}{section!=='Movimientos'&&section!=='Auditoría'&&(permissionFor(section,'editar')||permissionFor(section,'eliminar')||section==='Catálogo de trabajos')&&<td><div className="row-actions">{section==='Catálogo de trabajos'&&r.estado==='pendiente'&&<><button className="review-approve" title="Aprobar propuesta" onClick={()=>void reviewService(r,'aprobado')}><Check size={15}/></button><button className="review-reject" title="Rechazar propuesta" onClick={()=>void reviewService(r,'rechazado')}><X size={15}/></button></>}{permissionFor(section,'editar')&&<button title="Editar" onClick={()=>openEdit(r)}><Pencil size={15}/></button>}{permissionFor(section,'eliminar')&&section!=='Bodegas'&&section!=='Catálogo de trabajos'&&<button title="Desactivar" onClick={()=>void archive(r)}><Trash2 size={15}/></button>}</div></td>}</tr>)}</tbody></table></div>}</div>}
   <footer>Taller <span>·</span> Gestión inteligente <span className="footer-right">Fase 2 · v0.4.0</span></footer></div>
  </main>
  {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}><div className="modal"><div className="modal-head"><div><span className="eyebrow">{editing?'EDITAR REGISTRO':'NUEVO REGISTRO'}</span><h2>{editing?'Editar '+titleFor(section).toLowerCase():section==='Movimientos'?'Registrar movimiento':titleFor(section)}</h2></div><button className="icon-button" onClick={()=>setModal(false)}><X size={18}/></button></div><div className="form-grid">{fieldsFor(section,lookups).filter(field=>!(section==='Usuarios'&&editing&&field.key==='email')).map(field=><label key={field.key} className={field.wide?'wide':''}>{field.label}{field.options?<select value={String(form[field.key]??field.options[0]??'')} onChange={e=>setForm({...form,[field.key]:e.target.value})}>{field.options.map(o=><option key={o} value={o}>{o===''?'— Sin asignar —':(['cliente_id','producto_id','categoria_id','proveedor_principal_id','bodega_id'].includes(field.key)?(lookups.clientes||[]).concat(lookups.productos||[],lookups.categorias||[],lookups.proveedores||[],lookups.bodegas||[]).find((x:Row)=>x.id===o)?.nombre||(lookups.proveedores||[]).find((x:Row)=>x.id===o)?.razon_social||o:o)}</option>)}</select>:<input type={field.type||'text'} required={field.required} placeholder={field.placeholder||field.label} value={form[field.key]??''} onChange={e=>setForm({...form,[field.key]:field.type==='number'?(e.target.value===''?'':Number(e.target.value)):e.target.value})}/>}</label>)}</div>{error&&<div className="error">{error}</div>}<div className="modal-actions"><button className="secondary" onClick={()=>setModal(false)}>Cancelar</button><button className="primary" disabled={saving} onClick={()=>void saveRecord()}>{saving?'Guardando…':<><Check size={16}/> Guardar</>}</button></div></div></div>}
 </div>
}
function Brand(){return <div className="brand"><div className="brand-icon"><Wrench size={19}/></div><span>Taller<small>MANAGEMENT SYSTEM</small></span></div>}
function Stat({icon:Icon,label,value,hint,alert,currency}:{icon:any;label:string;value:number;hint:string;alert?:boolean;currency?:boolean}){return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className={alert?'stat-icon warning':'stat-icon'}><Icon size={18}/></div></div><strong>{currency?money(value):value.toLocaleString('es-CL')}</strong><small>{hint}</small></div>}
function Quick({icon:Icon,title,desc,onClick}:{icon:any;title:string;desc:string;onClick:()=>void}){return <button className="quick-item" onClick={onClick}><div className="quick-icon"><Icon size={18}/></div><div><b>{title}</b><small>{desc}</small></div><ArrowDownToLine size={15}/></button>}
