import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Check, ArrowLeft } from 'lucide-react'

export default function Pricing() {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const isPremium = profile?.plan === 'premium'

    return (
        <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
            <button onClick={() => navigate(-1)} className="btn-icon" style={{ marginBottom: '2rem' }}>
                <ArrowLeft size={24} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: 800 }}>Simple, fair pricing.</h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem' }}>Start for free, upgrade for power.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '900px', margin: '0 auto' }}>

                {/* FREE TIER */}
                <div className="card" style={{
                    padding: '2.5rem',
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    position: 'relative',
                    opacity: isPremium ? 0.7 : 1
                }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Free</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '2rem' }}>$0 <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-tertiary)' }}>/ month</span></div>

                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                        <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><Check size={18} color="var(--color-primary)" /> 50 Saved Items</li>
                        <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><Check size={18} color="var(--color-primary)" /> Basic Categories</li>
                        <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><Check size={18} color="var(--color-primary)" /> Standard Support</li>
                        <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: 'var(--color-text-tertiary)' }}><XIcon /> No Reminders</li>
                        <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: 'var(--color-text-tertiary)' }}><XIcon /> No Editing Notes</li>
                    </ul>

                    <button
                        className="btn-outline"
                        style={{ width: '100%', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '12px', cursor: 'default' }}
                        disabled
                    >
                        {isPremium ? 'Downgrade' : 'Current Plan'}
                    </button>
                </div>

                {/* PREMIUM TIER */}
                <div className="card" style={{
                    padding: '2.5rem',
                    background: 'linear-gradient(145deg, var(--color-bg-card), rgba(79, 70, 229, 0.1))',
                    border: '1px solid var(--color-primary)',
                    borderRadius: 'var(--radius-lg)',
                    position: 'relative',
                    transform: isPremium ? 'scale(1.02)' : 'none',
                    boxShadow: 'var(--shadow-glow)'
                }}>
                    {isPremium && <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--color-primary)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>ACTIVE</div>}

                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Premium</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '2rem' }}>$5 <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-tertiary)' }}>/ month</span></div>

                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                        <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><Check size={18} color="#10B981" /> <strong>Unlimited Items</strong></li>
                        <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><Check size={18} color="#10B981" /> <strong>Smart Reminders</strong></li>
                        <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><Check size={18} color="#10B981" /> Inline Note Editing</li>
                        <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><Check size={18} color="#10B981" /> Priority Support</li>
                        <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><Check size={18} color="#10B981" /> Early Access Features</li>
                    </ul>

                    <button
                        className="btn-primary"
                        style={{ width: '100%', padding: '1rem', borderRadius: '12px' }}
                        onClick={() => {
                            if (isPremium) return
                            if (!profile) return navigate('/auth')

                            // PayTR Flow Override
                            const confirmed = confirm('Proceed to Payment? (Simulated PayTR HPP)')
                            if (confirmed) {
                                alert('Redirecting to PayTR Secure Payment Page...\n(No live keys configured, this is a mock redirection)')
                                // In real app: window.location.href = data.paytr_token_url
                            }
                        }}
                        disabled={isPremium}
                    >
                        {isPremium ? 'Plan Active' : 'Upgrade Now'}
                    </button>
                </div>

            </div>
        </div>
    )
}

function XIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
    )
}
