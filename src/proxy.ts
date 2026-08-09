import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getIdentityMode } from "@/server/actors/identity-mode";

const publicPaths = [
  "/sign-in",
  "/sign-up",
  "/unlinked-account",
  "/disabled-account",
  "/unauthorized",
];

const persistedRoutePrefixes = ["/classes", "/tasks", "/submissions"];

function isPublicPath(pathname: string) {
  return publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

const clerkProxy = clerkMiddleware(async (auth, request) => {
  if (isPublicPath(request.nextUrl.pathname)) return NextResponse.next();
  await auth.protect({
    unauthenticatedUrl: new URL("/sign-in", request.url).toString(),
  });
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/classes", request.url));
  }
  if (
    !persistedRoutePrefixes.some(
      (path) =>
        request.nextUrl.pathname === path ||
        request.nextUrl.pathname.startsWith(`${path}/`),
    )
  ) {
    return NextResponse.redirect(new URL("/classes", request.url));
  }
});

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (getIdentityMode() === "demo") return NextResponse.next();
  return clerkProxy(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
