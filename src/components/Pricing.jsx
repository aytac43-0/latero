import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Check, ArrowLeft, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Pricing() {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const [plans, setPlans] = useState([])
    const [loading, setLoading] = useState(true)
    const isPremium = profile?.plan === 'premium'

    useEffect(() => {
        const fetchPlans = async () => {
            const { data, error } = await supabase.from('plans').select('*').order('price', { ascending: true })
            if (!error && data) setPlans(data)
            setLoading(false)
        }
        fetchPlans()
    }, [])

    if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading plans...</div>

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

                {plans.map(plan => {
                    const isUserPlan = profile?.plan === plan.id
                    const isPremiumPlan = plan.id === 'premium'

                    return (
                        <div key={plan.id} className="card" style={{
                            padding: '2.5rem',
                            background: isPremiumPlan ? 'linear-gradient(145deg, var(--color-bg-card), rgba(79, 70, 229, 0.1))' : 'var(--color-bg-card)',
                            border: isPremiumPlan ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-lg)',
                            position: 'relative',
                            transform: isUserPlan ? 'scale(1.02)' : 'none',
                            boxShadow: isPremiumPlan ? 'var(--shadow-glow)' : 'none',
                            opacity: (isPremium && !isPremiumPlan) ? 0.7 : 1
                        }}>
                            {isUserPlan && <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--color-primary)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>ACTIVE</div>}

                            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: isPremiumPlan ? 'var(--color-primary)' : 'inherit' }}>{plan.name}</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '2rem' }}>${plan.price} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-tertiary)' }}>/ month</span></div>

                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                                {plan.features?.map((f, i) => (
                                    <li key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <Check size={18} color={isPremiumPlan ? "#10B981" : "var(--color-primary)"} />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={isPremiumPlan ? "btn-primary" : "btn-outline"}
                                style={{ width: '100%', padding: '1rem', borderRadius: '12px' }}
                                onClick={() => {
                                    if (isUserPlan) return
                                    if (!profile) return navigate('/auth')

                                    // PayTR Flow Override (Mock)
                                    const confirmed = confirm(`Proceed to upgrade to ${plan.name}? (Simulated PayTR)`)
                                    if (confirmed) {
                                        alert('Redirecting to Secure Payment Page...\n(No live keys configured)')
                                    }
                                }}
                                disabled={isUserPlan}
                            >
                                {isUserPlan ? 'Current Plan' : (plan.price === 0 ? 'Basic Access' : 'Upgrade Now')}
                            </button>
                        </div>
                    )
                })}

            </div>
        </div>
    )
}
