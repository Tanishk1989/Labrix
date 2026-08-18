import { auth } from "@clerk/nextjs/server";
import type { ExternalIdentitySource } from "./external-identity-source";

export const clerkIdentitySource: ExternalIdentitySource = {
  async getExternalIdentity() {
    const session = await auth();
    if (!session.isAuthenticated || !session.userId) return null;
    return { provider: "clerk", providerSubject: session.userId };
  },
};
