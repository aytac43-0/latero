import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Auth() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
      }

      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      flexDirection: 'column',
      background: 'radial-gradient(circle at 50% 10%, rgba(79, 70, 229, 0.15) 0%, transparent 40%)'
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="card glass" style={{
          width: '100%',
          maxWidth: '440px', /* Wider card */
          padding: '2.5rem', /* Larger padding */
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {/* Header / Brand */}
          <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(245, 158, 11, 0.15))',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <img src="/logo.svg" alt="Latero" style={{ width: '36px', height: '36px' }} />
            </div>
            <h1 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
              {isLogin ? 'Welcome back' : 'Join Latero'}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
              {isLogin ? 'Sign in to access your saved items' : 'Start saving the web for later'}
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              width: '100%',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
            <div>
              <input
                type="email"
                placeholder="name@example.com"
                className="input-field" /* Use new input class */
                style={{ height: '52px' }} /* Override specific height for auth */
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                className="input-field"
                style={{ height: '52px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.94rem', color: 'var(--color-text-tertiary)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              style={{
                border: 'none',
                padding: 0,
                fontWeight: 500,
                color: 'var(--color-primary)',
                background: 'none',
                cursor: 'pointer'
              }}
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
