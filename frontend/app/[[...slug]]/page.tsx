import { notFound, redirect } from "next/navigation";
import { legacyRouteDestination } from "@/features/navigation/legacy-routes";

export default async function LegacyRoutePage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const destination = legacyRouteDestination(slug);

  if (destination) redirect(destination);
  notFound();
}
