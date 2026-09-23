import * as XLSX from 'xlsx';
import { validateRows } from './validation';

self.onmessage = (event: MessageEvent<ArrayBuffer>) => {
  try {
    const book = XLSX.read(event.data, { type: 'array', cellDates: true, sheetRows: 10002 });
    const sheet = book.Sheets[book.SheetNames[0]];
    if (!sheet) throw new Error('El archivo no contiene hojas.');
    const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, blankrows: false });
    if (!grid.length) throw new Error('La primera hoja está vacía.');
    self.postMessage({ ok: true, result: validateRows(grid[0], grid.slice(1)) });
  } catch {
    self.postMessage({ ok: false, error: 'No se pudo leer el archivo. Usa un Excel .xlsx sin contraseña o un archivo .csv.' });
  }
};
