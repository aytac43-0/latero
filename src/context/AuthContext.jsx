import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [configError, setConfigError] = useState(false)

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
                console.error('Error fetching profile:', error)
            }

            // Fallback for users without profile rows (migration safety)
            setProfile(data || { id: userId, role: 'user', plan: 'free' })
        } catch (error) {
            console.error('Profile fetch error:', error)
            setProfile({ id: userId, role: 'user', plan: 'free' })
        }
    }

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
            if (session?.user) {
                fetchProfile(session.user.id).finally(() => setLoading(false))
            } else {
                setLoading(false) // No user, stop loading
            }
        }).catch((error) => {
            console.error('Error fetching session:', error)
            setLoading(false)
        })

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null
            setUser(currentUser)

            if (currentUser) {
                // If switching users or logging in, fetch profile
                fetchProfile(currentUser.id).finally(() => setLoading(false))
            } else {
                setProfile(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const value = {
        signUp: (data) => supabase ? supabase.auth.signUp(data) : Promise.resolve({ error: { message: 'Supabase client not initialized' } }),
        signIn: (data) => supabase ? supabase.auth.signInWithPassword(data) : Promise.resolve({ error: { message: 'Supabase client not initialized' } }),
        signOut: () => supabase ? supabase.auth.signOut() : Promise.resolve({ error: { message: 'Supabase client not initialized' } }),
        user,
        profile,
        loading,
        isAdmin: profile?.role === 'admin',
        isPremium: profile?.plan === 'premium'
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
            {children}
        </AuthContext.Provider>
    )
}
