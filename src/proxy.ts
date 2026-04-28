import { NextResponse, type NextRequest } from "next/server";

const noop = (_req: NextRequest): NextResponse => NextResponse.next();

let handler: (req: NextRequest) => NextResponse | Promise<NextResponse> = noop;

if (process.env.CLERK_SECRET_KEY) {
  try {
    const mod = await import("@clerk/nextjs/server");
    handler = mod.clerkMiddleware() as never;
  } catch (err) {
    console.error("[proxy] failed to load Clerk middleware:", err);
  }
}

export default handler;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
