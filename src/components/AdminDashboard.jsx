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
        try {
            // Fetch profiles
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            setUsers(profiles || [])

            // Calc stats
            const total = profiles.length
            const premium = profiles.filter(p => p.plan === 'premium').length
            const revenue = premium * 5 // Mock MRR

            setStats({ total, premium, revenue })
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
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <button onClick={() => navigate('/')} className="btn-icon" style={{ marginBottom: '1rem' }}>
                <ArrowLeft size={24} />
            </button>
            <h1 style={{ marginBottom: '2rem' }}>Admin Dashboard</h1>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
                <StatCard icon={<Users />} title="Total Users" value={stats.total} />
                <StatCard icon={<CreditCard />} title="Premium Subs" value={stats.premium} />
                <StatCard icon={<Activity />} title="Est. MRR" value={`$${stats.revenue}`} />
            </div>

            {/* User List */}
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
