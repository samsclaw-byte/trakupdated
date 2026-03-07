import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

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
            const baseUrl = isLocalEnv ? origin : (forwardedHost ? `https://${forwardedHost}` : origin)

            // New users always go to setup
            if (isNewUser) {
                return NextResponse.redirect(`${baseUrl}/setup`)
            }

            // Existing users: redirect to a client-side page that checks localStorage
            // for any pending invite redirect, then navigates accordingly
            return NextResponse.redirect(`${baseUrl}/nutrition`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
