import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, ArrowDownLeft, ArrowUpRight, Boxes, CarFront, Check, ChevronDown, ClipboardList, Command, Gauge, LayoutDashboard, LogOut, Moon, Package, Plus, Search, Settings, Sun, Users, Warehouse, Wrench, X } from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type Section = 'Resumen' | 'Inventario' | 'Clientes' | 'Vehículos' | 'Proveedores' | 'Bodegas' | 'Movimientos'
type Row = Record<string, any>
const nav: { label: Section; icon: typeof LayoutDashboard }[] = [
  { label: 'Resumen', icon: LayoutDashboard }, { label: 'Inventario', icon: Package },
  { label: 'Clientes', icon: Users }, { label: 'Vehículos', icon: CarFront },
  { label: 'Proveedores', icon: Boxes }, { label: 'Bodegas', icon: Warehouse },
  { label: 'Movimientos', icon: Activity }
]
const money = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0)

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [section, setSection] = useState<Section>('Resumen')
  const [rows, setRows] = useState<Row[]>([])
  const [stats, setStats] = useState({ products: 0, clients: 0, vehicles: 0, low: 0 })
  const [workshop, setWorkshop] = useState<Row | null>(null)
  const [theme, setTheme] = useState(localStorage.getItem('taller-theme') || 'dark')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Row>({})
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('login')
  const [credentials, setCredentials] = useState({ email: '', password: '', name: '' })
  const [setup, setSetup] = useState({ nombre: '', telefono: '', email: '' })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('taller-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setLoading(false); return }
    void loadWorkshop()
  }, [session])

  useEffect(() => {
    if (workshop) void loadSection()
  }, [workshop, section])

  async function loadWorkshop() {
    setLoading(true); setError('')
    const { data, error } = await supabase.from('usuarios_taller').select('taller_id, rol, talleres(*)').eq('usuario_id', session.user.id).eq('activo', true).limit(1).maybeSingle()
    if (error) setError(error.message)
    setWorkshop(data ? { ...data, ...(Array.isArray(data.talleres) ? data.talleres[0] : data.talleres) } : null)
    setLoading(false)
  }

  async function loadSection() {
    if (!workshop?.taller_id) return
    setLoading(true); setError('')
    const id = workshop.taller_id
    const table: Record<Section, string> = { Resumen: 'productos', Inventario: 'productos', Clientes: 'clientes', Vehículos: 'vehiculos', Proveedores: 'proveedores', Bodegas: 'bodegas', Movimientos: 'movimientos_stock' }
    if (section === 'Resumen') {
      const [p,c,v,s] = await Promise.all([
        supabase.from('productos').select('id,stock_minimo,stock(id,cantidad)', { count: 'exact' }).eq('taller_id',id).eq('activo',true),
        supabase.from('clientes').select('id',{count:'exact',head:true}).eq('taller_id',id).eq('activo',true),
        supabase.from('vehiculos').select('id',{count:'exact',head:true}).eq('taller_id',id).eq('activo',true),
        supabase.from('movimientos_stock').select('id',{count:'exact',head:true}).eq('taller_id',id)
      ])
      const low = (p.data || []).filter((x:any) => (x.stock || []).reduce((a:number,b:any)=>a+Number(b.cantidad),0) <= Number(x.stock_minimo)).length
      setStats({ products:p.count || 0, clients:c.count || 0, vehicles:v.count || 0, low })
      setRows([])
      if (p.error || c.error || v.error || s.error) setError([p.error,c.error,v.error,s.error].find(Boolean)?.message || '')
    } else {
      const { data, error } = await supabase.from(table[section]).select('*').eq('taller_id',id).order('created_at',{ascending:false}).limit(100)
      if (error) setError(error.message)
      setRows(data || [])
    }
    setLoading(false)
  }

  async function authenticate() {
    setSaving(true); setError('')
    const result = loginMode === 'login'
      ? await supabase.auth.signInWithPassword({ email: credentials.email, password: credentials.password })
      : await supabase.auth.signUp({ email: credentials.email, password: credentials.password, options: { data: { nombre_completo: credentials.name } } })
    if (result.error) setError(result.error.message)
    else if (loginMode === 'signup' && !result.data.session) setError('Cuenta creada. Revisa tu correo si la confirmación está habilitada.')
    setSaving(false)
  }

  async function createWorkshop() {
    setSaving(true); setError('')
    const { error } = await supabase.rpc('crear_taller_inicial', { p_nombre: setup.nombre, p_telefono: setup.telefono || null, p_email: setup.email || null, p_cargar_demo: true })
    if (error) setError(error.message)
    else await loadWorkshop()
    setSaving(false)
  }

  async function saveRecord() {
    if (!workshop?.taller_id) return
    setSaving(true); setError('')
    const payload = { ...form, taller_id: workshop.taller_id }
    delete payload.id
    const { error } = await supabase.from(({Inventario:'productos',Clientes:'clientes',Vehículos:'vehiculos',Proveedores:'proveedores',Bodegas:'bodegas'} as Record<string,string>)[section]).insert(payload)
    if (error) setError(error.message)
    else { setModal(false); setForm({}); await loadSection() }
    setSaving(false)
  }

  const filtered = useMemo(() => rows.filter(row => JSON.stringify(row).toLowerCase().includes(search.toLowerCase())), [rows, search])
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModal(false)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); document.getElementById('global-search')?.focus() }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n' && ['Inventario','Clientes','Vehículos','Proveedores','Bodegas'].includes(section)) { event.preventDefault(); setModal(true) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [section])

  if (!isSupabaseConfigured) return <div className="setup-screen"><div className="login-card"><Brand/><h1>Conecta tu taller</h1><p>Configura las variables de entorno de Supabase para comenzar.</p><code>VITE_SUPABASE_URL<br/>VITE_SUPABASE_ANON_KEY</code><p className="muted">Usa la clave publicable del proyecto. Nunca agregues la service_role al navegador.</p></div></div>
  if (!session) return <div className="setup-screen"><div className="login-card"><Brand/><span className="eyebrow">PLATAFORMA DE GESTIÓN</span><h1>{loginMode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}</h1><p>Administra tu taller desde un solo lugar.</p>{loginMode === 'signup' && <input placeholder="Nombre completo" value={credentials.name} onChange={e=>setCredentials({...credentials,name:e.target.value})}/>}<input type="email" placeholder="Correo electrónico" value={credentials.email} onChange={e=>setCredentials({...credentials,email:e.target.value})}/><input type="password" placeholder="Contraseña" value={credentials.password} onChange={e=>setCredentials({...credentials,password:e.target.value})}/>{error && <div className="error">{error}</div>}<button className="primary full" onClick={authenticate} disabled={saving}>{saving?'Procesando…':loginMode==='login'?'Iniciar sesión':'Crear cuenta'}</button><button className="link-button" onClick={()=>{setLoginMode(loginMode==='login'?'signup':'login');setError('')}}>{loginMode==='login'?'¿No tienes cuenta? Crear una':'Ya tengo cuenta'}</button></div></div>
  if (loading && !workshop) return <div className="loading-screen"><div className="spinner"/><span>Preparando tu espacio de trabajo…</span></div>
  if (!workshop) return <div className="setup-screen"><div className="login-card"><Brand/><span className="eyebrow">CONFIGURACIÓN INICIAL</span><h1>Tu taller comienza aquí</h1><p>Configura tu espacio. Incluiremos información de demostración para explorar el sistema.</p><input placeholder="Nombre del taller" value={setup.nombre} onChange={e=>setSetup({...setup,nombre:e.target.value})}/><input placeholder="Teléfono (opcional)" value={setup.telefono} onChange={e=>setSetup({...setup,telefono:e.target.value})}/><input placeholder="Correo del taller (opcional)" value={setup.email} onChange={e=>setSetup({...setup,email:e.target.value})}/>{error&&<div className="error">{error}</div>}<button className="primary full" disabled={saving || setup.nombre.trim().length<2} onClick={createWorkshop}>{saving?'Creando…':'Crear taller y cargar demostración'}</button></div></div>

  return <div className="app-shell">
    <aside className="sidebar"><Brand/><div className="workspace"><div className="workspace-mark">T</div><div><b>{workshop.nombre}</b><small>Plan demostración</small></div><ChevronDown size={15}/></div><div className="nav-label">ESPACIO DE TRABAJO</div><nav>{nav.map(item=><button key={item.label} className={section===item.label?'nav-item active':'nav-item'} onClick={()=>{setSection(item.label);setSearch('')}}><item.icon size={18}/><span>{item.label}</span>{item.label==='Inventario'&&stats.low>0&&<i>{stats.low}</i>}</button>)}</nav><div className="sidebar-bottom"><div className="user-row"><div className="avatar">{(session.user.email||'U')[0].toUpperCase()}</div><div><b>{session.user.user_metadata?.nombre_completo || session.user.email}</b><small>{workshop.rol}</small></div><button title="Cerrar sesión" onClick={()=>supabase.auth.signOut()}><LogOut size={16}/></button></div></div></aside>
    <main className="main-area"><header className="topbar"><div className="crumb">Taller <span>/</span> <b>{section}</b></div><div className="top-actions"><div className="searchbox"><Search size={16}/><input id="global-search" placeholder="Buscar en el sistema…" value={search} onChange={e=>setSearch(e.target.value)}/><kbd>⌘ K</kbd></div><button className="icon-button" title="Cambiar tema" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button><div className="avatar small">{(session.user.email||'U')[0].toUpperCase()}</div></div></header>
      <div className="content"><div className="page-heading"><div><span className="eyebrow">{section==='Resumen'?'VISTA GENERAL':'GESTIÓN DEL TALLER'}</span><h1>{section==='Resumen'?'Resumen del taller':section}</h1><p>{section==='Resumen'?'Esto es lo que está pasando hoy en tu taller.':'Administra y consulta la información de '+section.toLowerCase()+'.'}</p></div>{section!=='Resumen'&&section!=='Movimientos'&&<button className="primary" onClick={()=>{setForm({});setModal(true)}}><Plus size={17}/> Nuevo registro</button>}</div>
      {error&&<div className="error banner"><AlertTriangle size={17}/>{error}<button onClick={()=>setError('')}><X size={15}/></button></div>}
      {section==='Resumen'?<><div className="stat-grid"><Stat icon={Package} label="Productos activos" value={stats.products} hint="En catálogo"/><Stat icon={Users} label="Clientes" value={stats.clients} hint="Registrados"/><Stat icon={CarFront} label="Vehículos" value={stats.vehicles} hint="En historial"/><Stat icon={AlertTriangle} label="Stock bajo" value={stats.low} hint="Requieren revisión" alert={stats.low>0}/></div><div className="dashboard-grid"><div className="panel"><div className="panel-head"><div><h3>Actividad del inventario</h3><p>Resumen de tus existencias</p></div><button className="subtle" onClick={()=>setSection('Inventario')}>Ver inventario <ArrowUpRight size={15}/></button></div><div className="empty-state"><div className="empty-icon"><Warehouse size={23}/></div><b>Tu operación comienza aquí</b><p>Registra productos y controla entradas, salidas y niveles de stock desde un solo lugar.</p><button className="primary" onClick={()=>setSection('Inventario')}>Explorar inventario</button></div></div><div className="panel"><div className="panel-head"><div><h3>Accesos rápidos</h3><p>Acciones frecuentes</p></div><Command size={18}/></div><div className="quick-list"><Quick icon={Package} title="Agregar producto" desc="Incorpora un repuesto o insumo" onClick={()=>{setSection('Inventario');setModal(true)}}/><Quick icon={Users} title="Registrar cliente" desc="Crea una ficha de cliente" onClick={()=>{setSection('Clientes');setModal(true)}}/><Quick icon={CarFront} title="Registrar vehículo" desc="Asocia un vehículo a un cliente" onClick={()=>{setSection('Vehículos');setModal(true)}}/></div></div></div></>:<div className="panel table-panel"><div className="table-toolbar"><div><b>{filtered.length} registros</b><span> · Últimos 100</span></div><button className="subtle" onClick={()=>void loadSection()}><Activity size={15}/> Actualizar</button></div>{loading?<div className="empty-state">Cargando información…</div>:filtered.length===0?<div className="empty-state"><div className="empty-icon"><Wrench size={22}/></div><b>No hay registros todavía</b><p>Cuando agregues información, aparecerá aquí.</p></div>:<div className="table-wrap"><table><thead><tr>{columnsFor(section).map(c=><th key={c}>{c.replaceAll('_',' ')}</th>)}</tr></thead><tbody>{filtered.map((row,i)=><tr key={row.id||i}>{columnsFor(section).map(c=><td key={c}>{formatCell(row[c],c)}</td>)}</tr>)}</tbody></table></div>}</div>}
      <footer> Taller <span>·</span> Gestión inteligente <span className="footer-right">Fase 1 · v0.1.0</span></footer></div>
    </main>
    {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}><div className="modal"><div className="modal-head"><div><span className="eyebrow">NUEVO REGISTRO</span><h2>{section==='Inventario'?'Agregar producto':section==='Clientes'?'Nuevo cliente':section==='Vehículos'?'Nuevo vehículo':section==='Proveedores'?'Nuevo proveedor':'Nueva bodega'}</h2></div><button className="icon-button" onClick={()=>setModal(false)}><X size={18}/></button></div><div className="form-grid">{fieldsFor(section).map(field=><label key={field.key} className={field.wide?'wide':''}>{field.label}{field.options?<select value={form[field.key]||field.options[0]} onChange={e=>setForm({...form,[field.key]:e.target.value})}>{field.options.map(o=><option key={o}>{o}</option>)}</select>:<input type={field.type||'text'} placeholder={field.placeholder||field.label} value={form[field.key]??''} onChange={e=>setForm({...form,[field.key]:field.type==='number'?Number(e.target.value):e.target.value})}/>}</label>)}</div>{error&&<div className="error">{error}</div>}<div className="modal-actions"><button className="secondary" onClick={()=>setModal(false)}>Cancelar</button><button className="primary" disabled={saving} onClick={saveRecord}>{saving?'Guardando…':<><Check size={16}/> Guardar registro</>}</button></div></div></div>}
  </div>
}

function Brand(){return <div className="brand"><div className="brand-icon"><Wrench size={19}/></div><span>Taller<small>MANAGEMENT SYSTEM</small></span></div>}
function Stat({icon:Icon,label,value,hint,alert}:{icon:any,label:string,value:number,hint:string,alert?:boolean}){return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className={alert?'stat-icon warning':'stat-icon'}><Icon size={18}/></div></div><strong>{value.toLocaleString('es-CL')}</strong><small>{hint}</small></div>}
function Quick({icon:Icon,title,desc,onClick}:{icon:any,title:string,desc:string,onClick:()=>void}){return <button className="quick-item" onClick={onClick}><div className="quick-icon"><Icon size={18}/></div><div><b>{title}</b><small>{desc}</small></div><ArrowUpRight size={16}/></button>}
function columnsFor(section:Section){const map:Record<Section,string[]>={Resumen:[],Inventario:['sku','nombre','marca','tipo','costo_unitario','precio_venta','stock_minimo'],Clientes:['nombre','rut','telefono','email','ciudad'],Vehículos:['patente','marca','modelo','anio','kilometraje','combustible'],Proveedores:['razon_social','rut','contacto','telefono','email'],Bodegas:['nombre','ubicacion','es_principal','activo'],Movimientos:['created_at','tipo','producto_id','cantidad_delta','costo_unitario','motivo','referencia']};return map[section]}
function formatCell(value:any,key:string){if(value===null||value===undefined)return '—';if(key.includes('costo')||key.includes('precio'))return money(Number(value));if(key==='created_at')return new Date(value).toLocaleString('es-CL');if(typeof value==='boolean')return value?'Sí':'No';return String(value)}
function fieldsFor(section:Section){const maps:Record<string,{key:string,label:string,type?:string,placeholder?:string,options?:string[],wide?:boolean}[]>={Inventario:[{key:'nombre',label:'Nombre del producto',wide:true},{key:'sku',label:'SKU'},{key:'marca',label:'Marca'},{key:'tipo',label:'Tipo',options:['repuesto','insumo','herramienta','equipo','otro']},{key:'unidad',label:'Unidad'},{key:'costo_unitario',label:'Costo unitario',type:'number'},{key:'precio_venta',label:'Precio de venta',type:'number'},{key:'stock_minimo',label:'Stock mínimo',type:'number'}],Clientes:[{key:'nombre',label:'Nombre completo o razón social',wide:true},{key:'tipo_persona',label:'Tipo',options:['natural','empresa']},{key:'rut',label:'RUT'},{key:'telefono',label:'Teléfono'},{key:'email',label:'Correo electrónico'},{key:'ciudad',label:'Ciudad'}],Vehículos:[{key:'cliente_id',label:'ID del cliente',wide:true},{key:'patente',label:'Patente'},{key:'marca',label:'Marca'},{key:'modelo',label:'Modelo'},{key:'anio',label:'Año',type:'number'},{key:'kilometraje',label:'Kilometraje',type:'number'},{key:'combustible',label:'Combustible',options:['Gasolina','Diésel','Híbrido','Eléctrico','Otro']}],Proveedores:[{key:'razon_social',label:'Razón social',wide:true},{key:'rut',label:'RUT'},{key:'contacto',label:'Contacto'},{key:'telefono',label:'Teléfono'},{key:'email',label:'Correo electrónico'}],Bodegas:[{key:'nombre',label:'Nombre de bodega'},{key:'ubicacion',label:'Ubicación'}]};return maps[section]||[]}
