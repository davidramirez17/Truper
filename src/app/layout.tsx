import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Panel Global de Ventas',
  description: 'Reportes e indicadores de ventas.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
