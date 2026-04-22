import { notFound } from "next/navigation";

import { CollectionDetailPageClient } from "@/components/collections/CollectionDetailPageClient";
import { getServerAuthOrRedirect } from "@/lib/server-auth";

type CollectionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { id } = await params;
  const collectionId = Number(id);

  if (!Number.isFinite(collectionId)) {
    notFound();
  }

  const { token } = await getServerAuthOrRedirect();
  return <CollectionDetailPageClient token={token} collectionId={collectionId} />;
}
