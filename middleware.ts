import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir acceso libre a login y acerca-de
  if (pathname.startsWith('/login') || pathname.startsWith('/acerca-de')) {
    return NextResponse.next()
  }

  // Leer la cookie de sesión (Se puede cambiar el nombre de la cookie)
  const isLoggedIn = request.cookies.get('isLoggedIn')?.value

  if (!isLoggedIn) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|api|static|favicon.ico|images|placeholder).*)',
  ],
}
