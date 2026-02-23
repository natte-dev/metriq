import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes accessible only by manager
const MANAGER_ONLY_ROUTES = [
  "/",
  "/parametros",
  "/listas",
  "/erros",
  "/atendimento",
  "/score",
  "/ranking",
];

// Routes accessible by both roles
const COORD_ROUTES = ["/cronograma", "/visitas"];

// Public routes (no auth required)
const PUBLIC_ROUTES = ["/entrar", "/api/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and Next.js internals
  if (
    PUBLIC_ROUTES.some((r) => pathname.startsWith(r)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const role = request.cookies.get("role")?.value;

  // No role — redirect to /entrar
  if (!role || (role !== "manager" && role !== "coord")) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    return NextResponse.redirect(url);
  }

  // Coord role: require coord_department_id cookie + only allow coord routes
  if (role === "coord") {
    const coordDeptId = request.cookies.get("coord_department_id")?.value;
    if (!coordDeptId) {
      const url = request.nextUrl.clone();
      url.pathname = "/entrar";
      return NextResponse.redirect(url);
    }
    const allowed = COORD_ROUTES.some(
      (r) => pathname === r || pathname.startsWith(r + "/")
    );
    if (!allowed) {
      const url = request.nextUrl.clone();
      url.pathname = "/cronograma";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
