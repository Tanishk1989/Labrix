import { redirect } from "next/navigation";
import { resolveCurrentActor } from "@/server/actors/current-actor";
import {
  parseSignInIntent,
  postSignInErrorDestination,
} from "@/server/actors/sign-in-intent";

export default async function AuthCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  const intent = parseSignInIntent((await searchParams).role);

  try {
    await resolveCurrentActor();
  } catch (error) {
    const destination = postSignInErrorDestination(error, intent);
    if (destination) redirect(destination);
    throw error;
  }

  // The persisted TRACE role remains authoritative. /dashboard renders the
  // teacher or student workspace from that verified role, never from the URL.
  redirect("/dashboard");
}
