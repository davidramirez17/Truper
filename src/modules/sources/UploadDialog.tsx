'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, FileSpreadsheet, LoaderCircle, UploadCloud, AlertCircle } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { money, number } from '../analytics/selectors';
import { requiredHeaders, type ValidationResult } from './validation';

type State = { status: 'idle' } | { status: 'reading'; name: string } | { status: 'error'; message: string } | { status: 'done'; name: string; result: ValidationResult };

export function downloadText(content: string, name: string, type = 'text/csv;charset=utf-8;') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function UploadDialog({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<State>({ status: 'idle' });
  const [dragging, setDragging] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef(0);
  useEffect(() => () => { requestRef.current++; workerRef.current?.terminate(); if (timerRef.current) clearTimeout(timerRef.current); }, []);
  async function read(file?: File) {
    if (!file) return;
    const request = ++requestRef.current;
    workerRef.current?.terminate();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!/\.(xlsx|csv)$/i.test(file.name) || file.size > 5 * 1024 * 1024 || !file.size) {
      setState({ status: 'error', message: 'Selecciona un archivo .xlsx o .csv de hasta 5 MB que no esté vacío.' }); return;
    }
    setState({ status: 'reading', name: file.name });
    try {
      const buffer = await file.arrayBuffer();
      if (request !== requestRef.current) return;
      const worker = new Worker(new URL('./validation.worker.ts', import.meta.url)); workerRef.current = worker;
      const cleanup = () => { worker.terminate(); if (timerRef.current) clearTimeout(timerRef.current); };
      worker.onmessage = (event: MessageEvent<{ ok: boolean; result: ValidationResult; error: string }>) => {
        cleanup();
        setState(event.data.ok ? { status: 'done', name: file.name, result: event.data.result } : { status: 'error', message: event.data.error });
      };
      worker.onerror = () => { cleanup(); setState({ status: 'error', message: 'La validación no pudo completarse. Intenta con un archivo más pequeño.' }); };
      timerRef.current = setTimeout(() => { cleanup(); setState({ status: 'error', message: 'El archivo tardó demasiado en procesarse. Divide la información en archivos más pequeños.' }); }, 10000);
      worker.postMessage(buffer, [buffer]);
    } catch { setState({ status: 'error', message: 'No se pudo abrir el archivo. Vuelve a seleccionarlo.' }); }
  }
  const result = state.status === 'done' ? state.result : null;
  const success = result && !result.invalid && !result.missing.length && !result.limited && result.count > 0;
  return <Dialog title="Valida tu próximo archivo" onClose={onClose} wide>
    <div className="dialog-body upload-body">
      <div className="stepper"><span className="current"><b>1</b> Seleccionar archivo</span><i /><span className={state.status === 'done' ? 'current' : ''}><b>2</b> Revisar resultado</span></div>
      <p className="muted">Comprueba la estructura antes de incorporar información a tu operación.</p>
      <label className={`dropzone ${dragging ? 'dragging' : ''}`} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); void read(event.dataTransfer.files[0]); }}>
        <input type="file" accept=".xlsx,.csv" aria-label="Seleccionar archivo Excel o CSV" onChange={event => { void read(event.target.files?.[0]); event.target.value = ''; }} />
        <span className="upload-icon">{state.status === 'reading' ? <LoaderCircle className="spin" size={25} /> : <UploadCloud size={25} />}</span>
        <strong>{state.status === 'reading' ? 'Revisando tu archivo…' : 'Arrastra tu archivo o haz clic para buscar'}</strong>
        <span>Excel o CSV · Máximo 5 MB y 10,000 filas · Primera hoja</span>
      </label>
      <div className="template-row"><span><FileSpreadsheet size={17} /> ¿Empiezas desde cero?</span><button className="text-button" onClick={() => downloadText('\uFEFFCliente,Fecha,Importe,Zona de ventas\r\nCliente de ejemplo,2026-09-22,1250.50,Centro\r\n', 'plantilla-facturacion.csv')}><Download size={15} /> Descargar plantilla</button></div>
      <div className="schema"><span>Columnas necesarias</span><div>{requiredHeaders.map(header => <code key={header}>{header}</code>)}</div><small>Fechas: AAAA-MM-DD o fechas de Excel. Importes: números, sin símbolos ni separadores de miles.</small></div>
      <div aria-live="polite">
        {state.status === 'error' && <div className="notice error"><AlertCircle size={19} /><p>{state.message}</p></div>}
        {state.status === 'done' && result && <div className="validation-result">
          <div className={`notice ${success ? 'success' : 'warning'}`}>{success ? <CheckCircle2 size={21} /> : <AlertCircle size={21} />}<div><strong>{success ? 'Tu archivo pasó la revisión' : 'Hay detalles que necesitas revisar'}</strong><p>{state.name} · {number(result.count)} filas revisadas · {number(result.valid)} válidas · {number(result.invalid)} con errores</p>{result.missing.length > 0 && <p>Faltan columnas: {result.missing.join(', ')}.</p>}{result.limited && <p>Supera las 10,000 filas. Divide el archivo; esta revisión es parcial.</p>}{!result.count && <p>El archivo no contiene registros.</p>}</div></div>
          {!!result.rows.length && <div className="table-scroll preview-table"><table><caption>Vista previa · primeras {Math.min(result.rows.length, 5)} filas</caption><thead><tr><th>Fila</th><th>Cliente</th><th>Importe</th><th>Revisión</th></tr></thead><tbody>{result.rows.slice(0, 5).map(row => <tr key={row.row}><td>{row.row}</td><td>{row.client || 'Sin cliente'}</td><td>{row.amount === null ? '—' : money(Math.round(row.amount * 100))}</td><td>{row.errors.length ? row.errors.join(' · ') : 'Correcto'}</td></tr>)}</tbody></table></div>}
        </div>}
      </div>
      <p className="privacy-note">Validación local: el archivo permanece en tu navegador. Esta revisión no guarda ni modifica tus datos; la carga a proyectos se conectará en la siguiente fase.</p>
    </div>
    <div className="dialog-footer"><button className="button primary" onClick={onClose}>Terminar revisión</button></div>
  </Dialog>;
}
