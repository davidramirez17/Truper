type ModuloErrorProps = {
  proyecto: string;
  message: string;
};

export function ModuloError({ proyecto, message }: ModuloErrorProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950" role="status">
      <div className="flex items-start gap-3">
        <span className="text-xl" aria-hidden="true">!</span>
        <div>
          <p className="font-bold">{proyecto} está pausado</p>
          <p className="mt-1 text-sm leading-6">{message} El resto de la plataforma continúa disponible.</p>
        </div>
      </div>
    </div>
  );
}
