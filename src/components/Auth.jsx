import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Auth() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [view, setView] = useState('login') // 'login', 'signup', 'forgot'
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      if (view === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password',
        })
        if (error) throw error
        setSuccessMsg('Passowrd reset email sent! Check your inbox.')
      } else if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/')
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        navigate('/') // Or show "Check email" msg if required by Supabase config
      }
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
      <div className="container" style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '1rem' }}>
        <div className="card glass auth-card" style={{
          width: '100%',
          maxWidth: '440px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {/* Brand */}
          <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '64px', height: '64px',
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(245, 158, 11, 0.15))',
              borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <img src="/logo.png" alt="Latero" style={{ width: '36px', height: '36px' }} />
            </div>
            <h1 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
              {view === 'forgot' ? 'Reset Password' : (view === 'login' ? 'Welcome back' : 'Join Latero')}
            </h1>
          </div>

          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444',
              padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', width: '100%',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>{error}</div>
          )}

          {successMsg && (
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981',
              padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', width: '100%',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>{successMsg}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
            <div>
              <input type="email" placeholder="name@example.com" className="input-field" style={{ height: '52px' }} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {view !== 'forgot' && (
              <div>
                <input type="password" placeholder="Password" className="input-field" style={{ height: '52px' }} value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Processing...' : (view === 'forgot' ? 'Send Reset Link' : (view === 'login' ? 'Sign In' : 'Create Account'))}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.94rem', color: 'var(--color-text-tertiary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {view === 'login' && (
              <>
                <button className="text-link" onClick={() => setView('signup')}>Don't have an account? Sign up</button>
                <button className="text-link" onClick={() => setView('forgot')} style={{ fontSize: '0.85rem' }}>Forgot password?</button>
              </>
            )}
            {view === 'signup' && (
              <button className="text-link" onClick={() => setView('login')}>Already have an account? Log in</button>
            )}
            {view === 'forgot' && (
              <button className="text-link" onClick={() => setView('login')}>Back to Sign In</button>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .auth-card { padding: 2.5rem; width: 100%; box-sizing: border-box; }
        @media (max-width: 480px) {
            .auth-card { padding: 1.5rem; }
            .container { padding: 1rem; }
        }
        .text-link {
            border: none; padding: 0; background: none; cursor: pointer;
            color: var(--color-text-secondary); transition: color 0.2s;
        }
        .text-link:hover { color: var(--color-primary); text-decoration: underline; }
      `}</style>
    </div>
  )
}
