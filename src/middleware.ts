import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE_NAME = "auth_token";

interface AuthPayload {
  userId: string;
  role: "teacher" | "student";
}

const publicRoutes = ["/login", "/register", "/"];
const teacherRoutes = ["/teacher"];
const studentRoutes = ["/student"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let payload: AuthPayload | null = null;

  if (token) {
    try {
      const { payload: verified } = await jwtVerify(token, secret);
      payload = verified as unknown as AuthPayload;
    } catch {
      payload = null;
    }
  }

  const isPublicRoute =
    publicRoutes.includes(pathname) || pathname.startsWith("/_next") || pathname.startsWith("/api");

  // Authenticated users on public auth routes → redirect to dashboard
  if (payload && (pathname === "/login" || pathname === "/register")) {
    const dashboard =
      payload.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard";
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // Unauthenticated users on protected routes → redirect to login
  if (!payload && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role-based access control
  if (payload) {
    const isTeacherRoute = teacherRoutes.some((r) => pathname.startsWith(r));
    const isStudentRoute = studentRoutes.some((r) => pathname.startsWith(r));

    if (isTeacherRoute && payload.role !== "teacher") {
      return NextResponse.redirect(new URL("/student/dashboard", request.url));
    }

    if (isStudentRoute && payload.role !== "student") {
      return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
