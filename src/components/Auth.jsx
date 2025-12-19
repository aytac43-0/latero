export default function Auth() {
  return (
    <div style={{ padding: '4rem', color: 'white' }}>
      <h1>AUTH PAGE LOADED</h1>
    </div>
  )
}

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Auth() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLogin, setIsLogin] = useState(true)
    const [error, setError] = useState(null)
    const { signIn, signUp } = useAuth()
    const navigate = useNavigate()

    const handleAuth = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            if (isLogin) {
                const { error } = await signIn({ email, password })
                if (error) throw error
                navigate('/')
            } else {
                const { error } = await signUp({ email, password })
                if (error) throw error
                alert('Check your email for the login link!')
            }
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <div className="card glass" style={{ width: '100%', maxWidth: '400px' }}>
                <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    {isLogin ? 'Welcome Back' : 'Join Latero'}
                </h1>

                {error && (
                    <div style={{
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius)',
                        marginBottom: '1rem',
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Processsing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>

                <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        className="btn-outline"
                        style={{ border: 'none', padding: 0, textDecoration: 'underline', color: 'var(--color-primary)' }}
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </div>
            </div>
        </div>
    )
}
