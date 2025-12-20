import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard, User, Lock, LogOut, Activity } from 'lucide-react'

export default function Settings() {
    const { user, profile, signOut } = useAuth()
    const navigate = useNavigate()
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (user) setEmail(user.email)
    }, [user])

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
        document.documentElement.setAttribute('data-theme', newTheme)
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)
        setError(null)

        try {
            const updates = {}
            if (email !== user.email) updates.email = email
            if (password) updates.password = password

            if (Object.keys(updates).length === 0) return

            const { error } = await supabase.auth.updateUser(updates)

            if (error) throw error
            setMessage('Profile updated successfully!')
            setPassword('') // Clear password field
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await signOut()
        navigate('/auth')
    }

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
                <button onClick={() => navigate('/')} className="btn-icon">
                    <ArrowLeft size={24} />
                </button>
                <h1>Settings</h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* ACCOUNT */}
                <section className="settings-section">
                    <h2 className="section-title"><User size={20} /> Account</h2>
                    <div className="card glass" style={{ padding: '1.5rem' }}>
                        {message && <div style={{ color: '#10B981', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>{message}</div>}
                        {error && <div style={{ color: '#EF4444', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}

                        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Email</label>
                                <input
                                    className="input-field"
                                    style={{ height: '48px', paddingRight: '1rem' }}
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>New Password</label>
                                <input
                                    className="input-field"
                                    style={{ height: '48px', paddingRight: '1rem' }}
                                    type="password"
                                    placeholder="Leave blank to keep current"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <button className="btn-primary" disabled={loading} style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
                                {loading ? 'Saving...' : 'Update Account'}
                            </button>
                        </form>
                    </div>
                </section>

                {/* APPEARANCE */}
                <section className="settings-section">
                    <h2 className="section-title">✨ Appearance</h2>
                    <div className="card glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ fontSize: '1rem' }}>Theme</h3>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                            </p>
                        </div>
                        <button onClick={toggleTheme} className="btn-icon" style={{ border: '1px solid var(--color-border)', fontSize: '1.2rem' }}>
                            {theme === 'dark' ? '🌙' : '☀️'}
                        </button>
                    </div>
                </section>

                {/* SUBSCRIPTION */}
                <section className="settings-section">
                    <h2 className="section-title"><CreditCard size={20} /> Plan</h2>
                    <div className="card glass" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ textTransform: 'capitalize', fontSize: '1.25rem' }}>{profile?.plan || 'Free'} Plan</h3>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                    {profile?.plan === 'premium' ? 'You have access to all features.' : 'Limited to 50 items. No reminders.'}
                                </p>
                            </div>
                            {profile?.plan === 'premium' ? (
                                <span className="pill pill-read">Active</span>
                            ) : (
                                <span className="pill pill-personal">Free</span>
                            )}
                        </div>
                        {profile?.plan !== 'premium' && (
                            <button onClick={() => navigate('/pricing')} className="btn-primary" style={{ width: '100%' }}>
                                Upgrade to Premium
                            </button>
                        )}
                        {profile?.plan === 'premium' && (
                            <button className="btn-outline" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                                Manage Subscription
                            </button>
                        )}
                    </div>
                </section>

                {profile?.role === 'admin' && (
                    <section className="settings-section">
                        <h2 className="section-title"><Activity size={20} /> Administration</h2>
                        <button
                            onClick={() => navigate('/admin')}
                            className="btn-outline"
                            style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            <Activity size={18} /> Open Admin Dashboard
                        </button>
                    </section>
                )}

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
                    <button onClick={handleLogout} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EF4444', padding: '0.75rem 1.5rem', border: '1px solid currentColor', borderRadius: '8px' }}>
                        <LogOut size={18} /> Log Out
                    </button>
                </div>

            </div>

            <style>{`
                .section-title {
                    font-size: 1.1rem;
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--color-text-tertiary);
                    font-weight: 500;
                }
            `}</style>
        </div>
    )
}
