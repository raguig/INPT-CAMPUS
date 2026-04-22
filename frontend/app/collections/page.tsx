import { CollectionsPageClient } from "@/components/collections/CollectionsPageClient";
import { getServerAuthOrRedirect } from "@/lib/server-auth";

export default async function CollectionsPage() {
  const { token } = await getServerAuthOrRedirect();
  return <CollectionsPageClient token={token} />;
}
