"use client";

type PDFPreviewProps = {
  url: string;
};

export function PDFPreview({ url }: PDFPreviewProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-inner">
      <iframe
        src={url}
        title="Aperçu du document"
        className="h-[400px] w-full border-0"
      />
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
    </div>
  );
}
