export function InptLogo() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/18 shadow-[0_22px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl">
        <div className="absolute inset-1 rounded-[1.35rem] bg-[linear-gradient(145deg,rgba(15,118,110,0.95),rgba(19,78,74,0.92)_46%,rgba(249,115,22,0.8))]" />
        <span className="relative font-serif text-lg font-semibold tracking-[0.22em] text-white">
          INPT
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
          Campus numérique
        </p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900">
          Campus INPT
        </h1>
        <p className="max-w-xs text-sm leading-6 text-slate-600">
          L&apos;assistant IA pensé pour la vie académique à l&apos;université.
        </p>
      </div>
    </div>
  );
}
