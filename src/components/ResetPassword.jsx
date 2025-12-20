import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function ResetPassword() {
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        // Basic check to see if we have a session (hash frag) that Supabase handled
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // If accessed directly without link, might show error or redirect
                // But usually this route is hit after clicking email link which sets session in URL fragment
            }
        })
    }, [])

    const handleReset = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error
            setMessage('Password updated successfully! Redirecting...')
            setTimeout(() => navigate('/'), 2000)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column' }}>
            <div className="glass" style={{ padding: '2.5rem', width: '100%', maxWidth: '400px', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>Set New Password</h1>

                {message && <div style={{ color: '#10B981', marginBottom: '1rem', textAlign: 'center' }}>{message}</div>}
                {error && <div style={{ color: '#EF4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        type="password"
                        placeholder="New Password"
                        className="input-field"
                        style={{ height: '52px' }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button className="btn-primary" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    )
}
