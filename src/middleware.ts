import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que devem redirecionar para dashboard se autenticado
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Obter token do cookie OU do header Authorization
  const tokenFromCookie = request.cookies.get('brazuca_auth_token')?.value;
  const tokenFromHeader = request.headers.get('authorization')?.replace('Bearer ', '');
  const token = tokenFromCookie || tokenFromHeader;
  const isAuthenticated = !!token;

  // Debug logging
  console.log('[Middleware] Path:', pathname);
  console.log('[Middleware] Token from cookie:', tokenFromCookie ? 'present' : 'missing');
  console.log('[Middleware] isAuthenticated:', isAuthenticated);
  console.log('[Middleware] All cookies:', request.cookies.getAll().map(c => c.name).join(', '));

  // Verificar se é uma rota de autenticação
  const isAuthRoute = authRoutes.some((route) => pathname === route);
  
  // Verificar se é uma rota do dashboard
  const isDashboardRoute = pathname.startsWith('/dashboard');

  // Se autenticado e tentando acessar rotas de auth, redirecionar para dashboard
  if (isAuthenticated && isAuthRoute) {
    console.log('[Middleware] Redirecting authenticated user from auth route to dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Se não autenticado e tentando acessar dashboard, redirecionar para login
  if (!isAuthenticated && isDashboardRoute) {
    console.log('[Middleware] Redirecting unauthenticated user to login');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
