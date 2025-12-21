import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'

export default function AddItem() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { user, loading } = useAuth()
    const processedRef = useRef(false)

    useEffect(() => {
        // If auth is still loading, do nothing yet
        if (loading) return

        // If not authenticated, redirect to auth page
        if (!user) {
            // We could optionally pass the current URL as a 'next' param to redirect back after login
            // But for now, requirements just say redirect to /auth
            navigate('/auth')
            return
        }

        const url = searchParams.get('url')
        const title = searchParams.get('title')
        const note = searchParams.get('note')
        const reminder = searchParams.get('reminder')

        // If no URL and no note, just go home
        if (!url && !note) {
            navigate('/')
            return
        }

        // Prevent double-submission in strict mode
        if (processedRef.current) return
        processedRef.current = true

        const saveItem = async () => {
            try {
                const payload = {
                    user_id: user.id,
                    title: title || (url ? 'Saved from Extension' : (note?.slice(0, 50) || 'New Note')),
                    content: url || note || '',
                    status: 'pending',
                    user_note: note || '',
                    reminder_at: reminder || null
                }
                const { error } = await supabase.from('items').insert(payload)
                if (error) throw error
            } catch (error) {
                console.error('Error saving item:', error)
            } finally {
                navigate('/')
            }
        }

        saveItem()

    }, [user, loading, searchParams, navigate])

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            <div className="spinner" style={{
                width: '30px',
                height: '30px',
                border: '3px solid var(--color-border)',
                borderTopColor: 'var(--color-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }}></div>
            <p>Saving to Latero...</p>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}
