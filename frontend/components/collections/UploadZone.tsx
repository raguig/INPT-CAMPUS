"use client";

import { CheckCircle2, FileUp, Loader2, XCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";

import type { UploadProgressState } from "@/lib/collections-types";

type UploadZoneProps = {
  uploads: UploadProgressState[];
  onUpload: (files: File[]) => Promise<void> | void;
};

const acceptedFormatsLabel = "PDF, DOCX, TXT, MD, CSV";

export function UploadZone({ uploads, onUpload }: UploadZoneProps) {
  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    multiple: true,
    maxSize: 20 * 1024 * 1024,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        ".docx",
      ],
      "text/plain": [".txt", ".md", ".csv"],
      "text/markdown": [".md"],
      "text/csv": [".csv"],
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        void onUpload(acceptedFiles);
      }
    },
  });

  return (
    <section className="space-y-3">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-[1.5rem] border-2 border-dashed p-6 text-center transition ${
          isDragActive
            ? "border-teal-500 bg-teal-50"
            : "border-slate-300 bg-white hover:border-teal-300"
        }`}
      >
        <input {...getInputProps()} />
        <div className="mx-auto mb-3 inline-flex rounded-2xl bg-slate-100 p-3 text-slate-700">
          <FileUp className="h-5 w-5" />
        </div>
        <p className="font-semibold text-slate-900">
          {isDragActive ? "Déposez vos fichiers ici" : "Glissez-déposez vos documents ici"}
        </p>
        <p className="mt-2 text-sm text-slate-600">Formats acceptés: {acceptedFormatsLabel}</p>
      </div>

      {uploads.length > 0 ? (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
          {uploads.map((upload) => (
            <div key={upload.fileName} className="rounded-xl border border-slate-100 p-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-slate-800">{upload.fileName}</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold">
                  {upload.status === "uploading" ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
                      En cours
                    </>
                  ) : null}
                  {upload.status === "success" ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      OK
                    </>
                  ) : null}
                  {upload.status === "error" ? (
                    <>
                      <XCircle className="h-3.5 w-3.5 text-rose-600" />
                      Erreur
                    </>
                  ) : null}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    upload.status === "error" ? "bg-rose-500" : "bg-teal-500"
                  }`}
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
              {upload.errorMessage ? (
                <p className="mt-1 text-xs text-rose-600">{upload.errorMessage}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
