export function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Ventas / Control</p>
          <h1 className="text-lg font-bold text-slate-950">Panel global</h1>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white" aria-label="Usuario administrador">
          A
        </div>
      </div>
    </header>
  );
}
