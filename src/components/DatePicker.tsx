import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'

type Props={value?:string|null;onChange:(value:string)=>void;placeholder?:string;disabled?:boolean;clearable?:boolean;min?:string}
const pad=(n:number)=>String(n).padStart(2,'0')
const iso=(d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
export default function DatePicker({value,onChange,placeholder='Seleccionar fecha',disabled=false,clearable=true,min}:Props){
 const initial=value?new Date(value+'T12:00:00'):new Date()
 const [open,setOpen]=useState(false)
 const [month,setMonth]=useState(new Date(initial.getFullYear(),initial.getMonth(),1))
 const days=useMemo(()=>{const first=new Date(month.getFullYear(),month.getMonth(),1);const offset=(first.getDay()+6)%7;const count=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();return [...Array(offset).fill(null),...Array.from({length:count},(_,i)=>i+1)]},[month])
 const selected=value?new Date(value+'T12:00:00'):null
 const label=selected&&!Number.isNaN(selected.getTime())?selected.toLocaleDateString('es-CL',{day:'2-digit',month:'long',year:'numeric'}):placeholder
 return <div className="custom-date">
  <button type="button" className="custom-date-trigger" disabled={disabled} onClick={()=>{setMonth(new Date((selected||new Date()).getFullYear(),(selected||new Date()).getMonth(),1));setOpen(!open)}}><CalendarDays size={15}/><span>{label}</span>{clearable&&value&&<span role="button" className="date-clear" onClick={e=>{e.stopPropagation();onChange('')}}><X size={13}/></span>}</button>
  {open&&!disabled&&<div className="custom-date-popover">
   <div className="custom-date-head"><button type="button" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}><ChevronLeft size={16}/></button><b>{month.toLocaleDateString('es-CL',{month:'long',year:'numeric'})}</b><button type="button" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}><ChevronRight size={16}/></button></div>
   <div className="custom-date-grid">{['Lu','Ma','Mi','Ju','Vi','Sá','Do'].map(d=><span className="date-weekday" key={d}>{d}</span>)}{days.map((day,i)=>{if(!day)return <span key={'e'+i}/>;const d=new Date(month.getFullYear(),month.getMonth(),day);const key=iso(d);const active=key===value;const disabledDay=Boolean(min&&key<min);return <button type="button" key={key} disabled={disabledDay} className={active?'selected':''} onClick={()=>{onChange(key);setOpen(false)}}>{day}</button>})}</div>
   <div className="custom-date-foot"><button type="button" onClick={()=>{onChange(iso(new Date()));setOpen(false)}}>Hoy</button><button type="button" onClick={()=>setOpen(false)}>Cerrar</button></div>
  </div>}
 </div>
}