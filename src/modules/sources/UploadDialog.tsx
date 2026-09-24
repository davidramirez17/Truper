'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Download, FileSpreadsheet, LoaderCircle, UploadCloud } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { money, number } from '../analytics/selectors';
import type { Project } from '../analytics/types';
import { importSales } from '../platform/actions';
import { inferMapping, requiredHeaders, validateRows, type ColumnMapping } from './validation';

type Parsed = { headers:string[]; rows:unknown[][]; sheets:string[] };
type ReadState = {status:'idle'} | {status:'reading'} | {status:'error';message:string} | {status:'ready';parsed:Parsed};
export function downloadText(content:string,name:string,type='text/csv;charset=utf-8;') { const url=URL.createObjectURL(new Blob([content],{type})); const anchor=document.createElement('a'); anchor.href=url; anchor.download=name; anchor.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); }

export function UploadDialog({onClose,projects,defaultProjectId,onImported}:{onClose:()=>void;projects:Project[];defaultProjectId?:string;onImported:(id:string)=>void}) {
  const [state,setState]=useState<ReadState>({status:'idle'});
  const [file,setFile]=useState<File|null>(null);
  const [sheetIndex,setSheetIndex]=useState(0);
  const [mapping,setMapping]=useState<ColumnMapping>({Cliente:-1,Fecha:-1,Importe:-1,'Zona de ventas':-1});
  const [projectId,setProjectId]=useState(projects.some(project=>project.id===defaultProjectId)?defaultProjectId!:projects[0]?.id??'');
  const [confirmed,setConfirmed]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [dragging,setDragging]=useState(false);
  const workerRef=useRef<Worker|null>(null); const timerRef=useRef<ReturnType<typeof setTimeout>|null>(null); const generation=useRef(0); const requestKey=useRef<string|null>(null);
  useEffect(()=>()=>{generation.current++;workerRef.current?.terminate();if(timerRef.current)clearTimeout(timerRef.current);},[]);
  const result=useMemo(()=>state.status==='ready'?validateRows(state.parsed.headers,state.parsed.rows,mapping):null,[state,mapping]);
  const success=!!result&&!result.invalid&&!result.missing.length&&!result.limited&&result.count>0;
  const selected=projects.find(project=>project.id===projectId);
  function resetRequest(){requestKey.current=null;setConfirmed(false);setError('');}
  async function read(next?:File,index=0){
    if(!next||busy)return;resetRequest(); const current=++generation.current;workerRef.current?.terminate();if(timerRef.current)clearTimeout(timerRef.current);
    if(!/\.(xlsx|csv)$/i.test(next.name)||next.size>5*1024*1024||!next.size){setState({status:'error',message:'Usa un archivo .xlsx o .csv no vacío, de hasta 5 MB.'});return;}
    setFile(next);setSheetIndex(index);setState({status:'reading'});
    try { const buffer=await next.arrayBuffer();if(current!==generation.current)return;
      const worker=new Worker(new URL('./validation.worker.ts',import.meta.url));workerRef.current=worker;
      const cleanup=()=>{worker.terminate();if(timerRef.current)clearTimeout(timerRef.current);};
      worker.onmessage=(event:MessageEvent<Parsed&{ok:boolean;error:string}>)=>{cleanup();if(current!==generation.current)return;if(event.data.ok){setMapping(inferMapping(event.data.headers));setState({status:'ready',parsed:event.data});}else setState({status:'error',message:event.data.error});};
      worker.onerror=()=>{cleanup();setState({status:'error',message:'No se completó la lectura. Prueba con un archivo más pequeño.'});};
      timerRef.current=setTimeout(()=>{cleanup();setState({status:'error',message:'El archivo tardó demasiado. Divide la información en archivos más pequeños.'});},10000);
      worker.postMessage({buffer,sheetIndex:index},[buffer]);
    }catch{setState({status:'error',message:'No se pudo abrir el archivo. Vuelve a seleccionarlo.'});}
  }
  async function save(){
    if(!success||!result||!file||!projectId||!confirmed||busy)return;
    setBusy(true);setError('');requestKey.current??=crypto.randomUUID();
    try { const response=await importSales({projectId,requestId:requestKey.current,filename:file.name,records:result.rows.map(row=>({date:row.date,client:row.client,region:row.region,amountCents:Math.round(row.amount!*100)}))});
      if(!response.ok){setError(response.error);setBusy(false);return;}onImported(projectId);
    }catch{setError('No pudimos confirmar el resultado. Reintenta sin cambiar el archivo para comprobar la misma operación.');setBusy(false);}
  }
  return <Dialog title="De tu archivo a tus indicadores" wide onClose={()=>{if(!busy)onClose();}}><div className="dialog-body upload-body"><div className="stepper"><span className="current"><b>1</b>Archivo</span><i/><span className={state.status==='ready'?'current':''}><b>2</b>Columnas</span><i/><span className={success?'current':''}><b>3</b>Guardar</span></div><label className="form-field">Proyecto a actualizar<select value={projectId} disabled={busy} onChange={event=>{setProjectId(event.target.value);resetRequest();}}>{projects.map(project=><option value={project.id} key={project.id}>{project.name}</option>)}</select></label><label className={`dropzone ${dragging?'dragging':''}`} onDragOver={event=>{event.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={event=>{event.preventDefault();setDragging(false);void read(event.dataTransfer.files[0]);}}><input type="file" accept=".xlsx,.csv" disabled={busy} aria-label="Seleccionar archivo Excel o CSV" onChange={event=>{void read(event.target.files?.[0]);event.target.value='';}}/><span className="upload-icon">{state.status==='reading'?<LoaderCircle className="spin" size={25}/>:<UploadCloud size={25}/>}</span><strong>{state.status==='reading'?'Leyendo tu archivo…':file?.name??'Arrastra tu Excel o haz clic para buscar'}</strong><span>Excel o CSV · Hasta 5 MB · 10,000 filas por carga</span></label><div className="template-row"><span><FileSpreadsheet size={17}/>Empieza con la estructura correcta</span><button className="text-button" disabled={busy} onClick={()=>downloadText('\uFEFFCliente,Fecha,Importe,Zona de ventas\r\n','plantilla-ventas.csv')}><Download size={15}/>Plantilla vacía</button></div>
  {state.status==='ready'&&<><label className="form-field">Hoja del archivo<select value={sheetIndex} disabled={busy} onChange={event=>void read(file??undefined,Number(event.target.value))}>{state.parsed.sheets.map((sheet,index)=><option key={sheet} value={index}>{sheet}</option>)}</select></label><h3 className="mapping-title">Relaciona las columnas de tu archivo</h3><div className="mapping-grid">{requiredHeaders.map(header=><label className="form-field" key={header}>{header}<select value={mapping[header]} disabled={busy} onChange={event=>{setMapping({...mapping,[header]:Number(event.target.value)});resetRequest();}}><option value={-1}>Selecciona una columna</option>{state.parsed.headers.map((name,index)=><option key={index} value={index}>{name||`Columna ${index+1}`}</option>)}</select></label>)}</div><p className="privacy-note">Fechas en formato AAAA-MM-DD o fechas nativas de Excel. Importes numéricos, sin símbolos, con hasta 2 decimales. Una fila representa un movimiento.</p></>}
  <div aria-live="polite">{state.status==='error'&&<div className="notice error"><AlertCircle size={19}/><p>{state.message}</p></div>}{result&&<><div className={`notice ${success?'success':'warning'}`}>{success?<CheckCircle2 size={21}/>:<AlertCircle size={21}/>}<div><strong>{success?'Tu información está lista para guardarse':'Revisa estos detalles antes de continuar'}</strong><p>{number(result.count)} filas · {number(result.valid)} válidas · {number(result.invalid)} con errores</p>{!!result.missing.length&&<p>Selecciona columnas diferentes para: {result.missing.join(', ')}.</p>}{result.limited&&<p>El archivo supera 10,000 filas. Divide la carga; no se guardarán resultados parciales.</p>}{!result.count&&<p>La hoja no contiene movimientos.</p>}</div></div>{!!result.rows.length&&<div className="table-scroll preview-table"><table><caption>Vista previa · {result.invalid?'errores primero':'primeras filas'}</caption><thead><tr><th>FILA</th><th>CLIENTE</th><th>FECHA</th><th>IMPORTE</th><th>REVISIÓN</th></tr></thead><tbody>{[...result.rows].sort((a,b)=>b.errors.length-a.errors.length).slice(0,5).map(row=><tr key={row.row}><td>{row.row}</td><td>{row.client||'—'}</td><td>{row.date||'—'}</td><td>{row.amount===null?'—':money(Math.round(row.amount*100))}</td><td>{row.errors.join(' · ')||'Correcto'}</td></tr>)}</tbody></table></div>}</>}{error&&<p className="notice error" role="alert">{error}</p>}</div>
  {success&&<label className="check-field"><input type="checkbox" checked={confirmed} disabled={busy} onChange={event=>setConfirmed(event.target.checked)}/><span>Guardar {number(result!.count)} movimientos en <strong>{selected?.name}</strong>. {selected?.activeBatchId?'Esta carga sustituirá los datos activos del proyecto. La carga anterior se conservará en el historial.':'Será la primera carga de este proyecto.'}</span></label>}<p className="privacy-note">La revisión sucede en tu navegador. Al guardar, se envían los registros normalizados a Supabase con tu sesión y permisos. El archivo original no se almacena.</p></div><div className="dialog-footer"><button className="button secondary" disabled={busy} onClick={onClose}>Cancelar</button><button className="button primary" disabled={!success||!confirmed||busy||!projectId} onClick={save}>{busy?<LoaderCircle className="spin" size={17}/>:<ArrowRight size={17}/>} {busy?'Guardando información…':'Guardar y ver indicadores'}</button></div></Dialog>;
}
