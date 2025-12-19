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
    <div className="auth-page">
      <form className="card" onSubmit={handleSubmit}>
        <h2>{isLogin ? 'Login' : 'Create account'}</h2>

        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Please wait…' : isLogin ? 'Login' : 'Sign up'}
        </button>

        <button
          type="button"
          className="btn btn-outline"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? 'Create an account' : 'I already have an account'}
        </button>
      </form>
    </div>
  )
}
