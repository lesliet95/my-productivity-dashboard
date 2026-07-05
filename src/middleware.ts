import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Routes the partner is allowed to access
const PARTNER_ALLOWED = ["/music-lovers", "/wedding", "/tasks"];

export default withAuth(
  function middleware(req) {
    const role = (req.nextauth.token as { role?: string })?.role;
    const { pathname } = req.nextUrl;

    if (role === "partner") {
      const allowed = PARTNER_ALLOWED.some((p) => pathname === p || pathname.startsWith(p + "/"));
      if (!allowed) {
        return NextResponse.redirect(new URL("/music-lovers", req.url));
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => token !== null,
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|icons|manifest.json|favicon.ico).*)"],
};
