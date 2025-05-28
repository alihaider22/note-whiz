import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    const client = createServerClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                    }
                },
            },
        }
    )

    return client;
}

export async function getUser() {
    try {
        const client = await createClient()
        const { data, error } = await client.auth.getUser()

        if (error) {
            if (error.message?.includes('Auth session missing') ||
                error.name === 'AuthSessionMissingError') {
                return null
            }

            console.error('Error getting user:', error)
            return null
        }

        return data.user
    } catch (error) {
        console.error('Error in getUser:', error)
        return null
    }
}