import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // Check for a stored redirect (e.g., /squads?code=ABC123)
    const redirectParam = searchParams.get('redirect')

    if (code) {
        const supabase = await createClient()
        const { error, data: { user } } = await supabase.auth.exchangeCodeForSession(code)
        if (!error && user) {
            // Check if user exists in the public.users table (meaning they completed setup)
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single()

            const isNewUser = !profile;

            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'

            // Use stored redirect if available, otherwise default to nutrition/setup
            let destination = isNewUser ? '/setup' : '/nutrition'
            if (!isNewUser && redirectParam) {
                destination = redirectParam
            }

            const baseUrl = isLocalEnv ? origin : (forwardedHost ? `https://${forwardedHost}` : origin)

            // Build the response with a script that checks localStorage for redirect
            // (since localStorage is only accessible client-side, we use a small HTML page)
            if (!isNewUser && !redirectParam) {
                // Return a small HTML page that checks localStorage for redirect
                return new NextResponse(
                    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body>
                    <script>
                        var r = localStorage.getItem('trak_auth_redirect');
                        localStorage.removeItem('trak_auth_redirect');
                        window.location.href = r ? '${baseUrl}' + r : '${baseUrl}${destination}';
                    </script>
                    <noscript><meta http-equiv="refresh" content="0;url=${baseUrl}${destination}"></noscript>
                    </body></html>`,
                    { status: 200, headers: { 'Content-Type': 'text/html' } }
                )
            }

            return NextResponse.redirect(`${baseUrl}${destination}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
