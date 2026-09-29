'use client';

import { FileDown } from 'lucide-react';

export function PdfButton({ compact = false }: { compact?: boolean }) {
  return <button type="button" className={compact ? 'icon-button pdf-button' : 'button secondary pdf-button'} onClick={() => window.print()} aria-label="Guardar vista como PDF" title="Guardar vista como PDF">
    <FileDown size={compact ? 17 : 16} />
    {!compact && 'Guardar PDF'}
  </button>;
}
