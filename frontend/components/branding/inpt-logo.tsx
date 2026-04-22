import Image from "next/image";

export function InptLogo() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="relative flex h-[5rem] w-[5rem] items-center justify-center overflow-hidden rounded-[1.75rem] border border-[#042747]/10 bg-white shadow-[0_16px_48px_rgba(4,39,71,0.12)]">
        <Image
          src="/image.png"
          alt="INPT Logo"
          width={64}
          height={64}
          className="object-contain"
          priority
        />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#042747]/50">
          Campus numérique
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[#042747]">
          Campus INPT
        </h1>
        <p className="max-w-xs text-sm leading-6 text-gray-500">
          L&apos;assistant IA pensé pour la vie académique à l&apos;université.
        </p>
      </div>
    </div>
  );
}
