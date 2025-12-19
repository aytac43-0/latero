import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [configError, setConfigError] = useState(false)

    useEffect(() => {
        if (!supabase) {
            console.error('Supabase client is not initialized. Check your environment variables.')
            setConfigError(true)
            setLoading(false)
            return
        }

        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
        }).catch((error) => {
            console.error('Error fetching session:', error)
        }).finally(() => {
            setLoading(false)
        })

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const value = {
        signUp: (data) => supabase ? supabase.auth.signUp(data) : Promise.resolve({ error: { message: 'Supabase client not initialized' } }),
        signIn: (data) => supabase ? supabase.auth.signInWithPassword(data) : Promise.resolve({ error: { message: 'Supabase client not initialized' } }),
        signOut: () => supabase ? supabase.auth.signOut() : Promise.resolve({ error: { message: 'Supabase client not initialized' } }),
        user,
        loading
    }

    if (configError) {
        return (
            <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
                <h1>Configuration Error</h1>
                <p>Missing or invalid Supabase environment variables.</p>
                <p>Please check your .env file.</p>
            </div>
        )
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
