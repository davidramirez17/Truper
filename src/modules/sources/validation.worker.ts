import * as XLSX from 'xlsx';
self.onmessage = (event: MessageEvent<{buffer:ArrayBuffer;sheetIndex:number}>) => {
  try {
    const book = XLSX.read(event.data.buffer,{type:'array',cellDates:true,sheetRows:10002});
    const sheet = book.Sheets[book.SheetNames[event.data.sheetIndex]];
    if (!sheet) throw new Error('Missing sheet');
    const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet,{header:1,defval:null,blankrows:true});
    if (!grid.length) throw new Error('Empty sheet');
    if (grid[0].length>100) throw new Error('Too many columns');
    self.postMessage({ok:true,headers:grid[0].map((value,index)=>String(value??`Columna ${index+1}`)),rows:grid.slice(1),sheets:book.SheetNames});
  } catch {
    self.postMessage({ok:false,error:'No pudimos leer esa hoja. Usa un Excel sin contraseña o CSV, con encabezados en la primera fila y hasta 100 columnas.'});
  }
};
