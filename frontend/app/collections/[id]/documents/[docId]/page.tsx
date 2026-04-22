import { notFound } from "next/navigation";

import { DocumentInspectorPageClient } from "@/components/collections/DocumentInspectorPageClient";
import { getServerAuthOrRedirect } from "@/lib/server-auth";

type DocumentInspectorPageProps = {
  params: Promise<{
    id: string;
    docId: string;
  }>;
};

export default async function DocumentInspectorPage({ params }: DocumentInspectorPageProps) {
  const { id, docId } = await params;
  const collectionId = Number(id);
  const numericDocId = Number(docId);

  if (!Number.isFinite(collectionId) || !Number.isFinite(numericDocId)) {
    notFound();
  }

  const { token } = await getServerAuthOrRedirect();

  return (
    <DocumentInspectorPageClient
      token={token}
      collectionId={collectionId}
      docId={numericDocId}
    />
  );
}
