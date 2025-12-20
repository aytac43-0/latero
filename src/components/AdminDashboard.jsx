import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, CreditCard, Activity } from 'lucide-react'

export default function AdminDashboard() {
    const { user, profile, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [stats, setStats] = useState({ total: 0, premium: 0, revenue: 0 })
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    const [activeTab, setActiveTab] = useState('overview')
    const [payments, setPayments] = useState([])
    const [plans, setPlans] = useState([
        { id: 'free', name: 'Free Tier', price: 0, active: true, features: ['50 Items', 'Basic Support'] },
        { id: 'premium', name: 'Premium', price: 5, active: true, features: ['Unlimited Items', 'Reminders', 'Priority Support'] }
    ])

    // Protect Route
    useEffect(() => {
        if (!authLoading) {
            if (!user || profile?.role !== 'admin') {
                navigate('/')
            } else {
                fetchData()
            }
        }
    }, [user, profile, authLoading, navigate])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch Profiles
            const { data: profilesData, error: profilesError, count: profilesCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact' })

            if (profilesError) throw profilesError
            setUsers(profilesData || [])

            // Fetch Items Count
            const { count: itemsCount, error: itemsError } = await supabase
                .from('items')
                .select('*', { count: 'exact', head: true })

            if (itemsError) throw itemsError

            const premiumCount = profilesData.filter(u => u.plan === 'premium').length
            const revenue = premiumCount * 5 // Mock revenue logic based on premium count

            setStats({
                total: profilesCount || 0,
                premium: premiumCount,
                revenue: revenue,
                items: itemsCount || 0
            })

            // Mock payments for now as there's no payments table confirmed yet, 
            // but we'll use a try-catch for a future-proof check
            try {
                const { data: paymentsData } = await supabase.from('payments').select('*').limit(10)
                if (paymentsData) setPayments(paymentsData)
            } catch (err) {
                console.log('Payments table likely not created yet, skipping.')
            }

        } catch (error) {
            console.error('Admin fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    const togglePlan = async (userId, currentPlan) => {
        const newPlan = currentPlan === 'premium' ? 'free' : 'premium'
        if (!confirm(`Change user plan to ${newPlan}?`)) return

        try {
            const { error } = await supabase.from('profiles').update({ plan: newPlan }).eq('id', userId)
            if (error) throw error

            // Optimistic update
            setUsers(users.map(u => u.id === userId ? { ...u, plan: newPlan } : u))
            // Update stats
            const diff = newPlan === 'premium' ? 1 : -1
            setStats(prev => ({
                ...prev,
                premium: prev.premium + diff,
                revenue: (prev.premium + diff) * 5
            }))

        } catch (error) {
            alert('Error updating plan: ' + error.message)
        }
    }

    if (authLoading || (loading && !users.length)) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading Admin Panel...</div>

    return (
        <div style={{ minHeight: '100vh', background: '#0f172a' }}>
            {/* ADMIN BANNER */}
            <div style={{
                background: 'linear-gradient(90deg, #dc2626, #991b1b)',
                color: 'white',
                padding: '0.5rem 2rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span>ADMINISTRATION MODE</span>
                <span>SECURE ENVIRONMENT</span>
            </div>

            <div className="container" style={{ padding: '2rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate('/')} className="btn-icon">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 style={{ marginBottom: 0 }}>Dashboard</h1>
                    </div>
                    <div className="glass" style={{ padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px' }}>
                        {['overview', 'payments', 'plans'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={activeTab === tab ? 'btn-primary' : 'btn-ghost'}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    textTransform: 'capitalize',
                                    color: activeTab === tab ? 'white' : 'var(--color-text-secondary)'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'overview' && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
                            <StatCard icon={<Users />} title="Total Users" value={stats.total} />
                            <StatCard icon={<Activity />} title="Total Items" value={stats.items} />
                            <StatCard icon={<CreditCard />} title="Premium Subs" value={stats.premium} />
                            <StatCard icon={<Activity />} title="Est. MRR" value={`$${stats.revenue}`} />
                        </div>

                        <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', fontWeight: 600 }}>User Management</div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                                            <th style={{ padding: '1rem', fontWeight: 500 }}>Email</th>
                                            <th style={{ padding: '1rem', fontWeight: 500 }}>Plan</th>
                                            <th style={{ padding: '1rem', fontWeight: 500 }}>Role</th>
                                            <th style={{ padding: '1rem', fontWeight: 500 }}>Joined</th>
                                            <th style={{ padding: '1rem', fontWeight: 500 }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '1rem' }}>{user.email || 'No Email (Auth only)'}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span className={`pill ${user.plan === 'premium' ? 'pill-read' : 'pill-personal'}`}>
                                                        {user.plan}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>{user.role}</td>
                                                <td style={{ padding: '1rem', color: 'var(--color-text-tertiary)' }}>
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button
                                                        onClick={() => togglePlan(user.id, user.plan)}
                                                        className="btn-outline"
                                                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                                                    >
                                                        {user.plan === 'premium' ? 'Downgrade' : 'Upgrade'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'payments' && (
                    <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                            <span>Recent Transactions</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>Simulated from Live Data</span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                                        <th style={{ padding: '1rem', fontWeight: 500 }}>Transaction ID</th>
                                        <th style={{ padding: '1rem', fontWeight: 500 }}>User</th>
                                        <th style={{ padding: '1rem', fontWeight: 500 }}>Amount</th>
                                        <th style={{ padding: '1rem', fontWeight: 500 }}>Date</th>
                                        <th style={{ padding: '1rem', fontWeight: 500 }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.length === 0 ? (
                                        <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No payments found in mock data.</td></tr>
                                    ) : payments.map(pay => (
                                        <tr key={pay.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{pay.id}</td>
                                            <td style={{ padding: '1rem' }}>{pay.user_email}</td>
                                            <td style={{ padding: '1rem' }}>${pay.amount.toFixed(2)}</td>
                                            <td style={{ padding: '1rem', color: 'var(--color-text-tertiary)' }}>{new Date(pay.created_at).toLocaleDateString()}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span className="pill pill-read" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', border: 'none' }}>Success</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'plans' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        {plans.map(plan => (
                            <div key={plan.id} className="card glass" style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <h3 style={{ fontSize: '1.5rem' }}>{plan.name}</h3>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${plan.price}<span style={{ fontSize: '0.9rem', color: 'var(--color-text-tertiary)' }}>/mo</span></div>
                                </div>
                                <ul style={{ listStyle: 'none', marginBottom: '2rem', color: 'var(--color-text-secondary)' }}>
                                    {plan.features.map((f, i) => (
                                        <li key={i} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }}></div>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button className="btn-outline" style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)' }}>Edit Plan</button>
                                    <button className="btn-outline" style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px', color: '#EF4444' }}>{plan.active ? 'Deactivate' : 'Activate'}</button>
                                </div>
                            </div>
                        ))}
                        <div className="card glass" style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', cursor: 'pointer', minHeight: '300px' }}>
                            <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>+</div>
                                Create New Plan
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function StatCard({ icon, title, value }) {
    return (
        <div className="card glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-primary)'
            }}>
                {icon}
            </div>
            <div>
                <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>{title}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
            </div>
        </div>
    )
}
