import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextFetchEvent } from "next/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const withClerk = clerkMiddleware({
  contentSecurityPolicy: {
    strict: process.env.NODE_ENV === "production",
    directives: {
      "worker-src": ["'self'", "blob:"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "blob:", "https://img.clerk.com", "https://images.clerk.dev"],
      "connect-src": [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://api.groq.com",
        "https://generativelanguage.googleapis.com",
      ],
      "base-uri": ["'self'"],
      "frame-ancestors": ["'self'"],
    },
  },
});

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  if (process.env.LABRIX_IDENTITY_MODE === "demo") {
    if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  return withClerk(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
