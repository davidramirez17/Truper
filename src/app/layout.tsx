import type { Metadata } from 'next';
import '@fontsource-variable/inter';
import '@fontsource-variable/manrope';
import './globals.css';
import './platform.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Truper · Inteligencia comercial',
  description: 'De tus archivos a una operación conectada. Proyectos, indicadores y fuentes de información en un mismo espacio.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
