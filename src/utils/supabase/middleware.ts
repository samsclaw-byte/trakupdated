import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    // ── DEV BYPASS ──────────────────────────────────────────────────────────
    // Set MIDDLEWARE_BYPASS=true in .env.local to skip auth (local testing only).
    // Remove or set to false to re-enable auth.
    if (process.env.MIDDLEWARE_BYPASS === 'true') {
        // Still honour legacy route redirects even in bypass mode
        if (request.nextUrl.pathname === '/dashboard' || request.nextUrl.pathname === '/trends') {
            const url = request.nextUrl.clone()
            url.pathname = '/nutrition'
            return NextResponse.redirect(url)
        }
        return NextResponse.next({ request })
    }
    // ────────────────────────────────────────────────────────────────────────
    try {
        let supabaseResponse = NextResponse.next({
            request,
        })

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
                        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                        supabaseResponse = NextResponse.next({
                            request,
                        })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            supabaseResponse.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )

        const {
            data: { user },
        } = await supabase.auth.getUser()

        // Redirect old routes to new structure
        if (request.nextUrl.pathname === '/dashboard' || request.nextUrl.pathname === '/trends') {
            const url = request.nextUrl.clone()
            url.pathname = '/nutrition'
            return NextResponse.redirect(url)
        }

        // Protect routes here. If unauthenticated, redirect to '/' unless it's a public route.
        if (
            !user &&
            !request.nextUrl.pathname.startsWith('/auth') &&
            request.nextUrl.pathname !== '/'
        ) {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }

        // If user exists and tries to access home page, redirect to nutrition
        if (user && request.nextUrl.pathname === '/') {
            const url = request.nextUrl.clone()
            url.pathname = '/nutrition'
            return NextResponse.redirect(url)
        }

        return supabaseResponse
    } catch {
        // If Supabase is unreachable or env vars are missing, fail open —
        // let the request pass through rather than crashing the entire app.
        console.warn('[middleware] Supabase unavailable, failing open.')
        return NextResponse.next({ request })
    }
}
