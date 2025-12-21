import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, CreditCard, Activity, Plus, Edit2, Trash2 } from 'lucide-react'

export default function AdminDashboard() {
    const { user, profile, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [stats, setStats] = useState({ total: 0, premium: 0, revenue: 0, items: 0 })
    const [users, setUsers] = useState([])
    const [plans, setPlans] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [editingPlan, setEditingPlan] = useState(null)
    const [isAddingPlan, setIsAddingPlan] = useState(false)

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
            // Fetch Plans
            const { data: plansData, error: plansError } = await supabase.from('plans').select('*').order('price', { ascending: true })
            if (plansError) throw plansError
            setPlans(plansData || [])

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

            if (itemsError) throw itemsError

            const freeCount = profilesData.filter(u => u.plan === 'free').length
            const paidCount = profilesData.filter(u => u.plan === 'premium' || u.plan === 'pro').length
            const revenue = profilesData.reduce((acc, u) => acc + (u.plan === 'premium' ? 5 : (u.plan === 'pro' ? 2 : 0)), 0)

            setStats({
                total: profilesCount || 0,
                free: freeCount,
                paid: paidCount,
                revenue: revenue,
                items: itemsCount || 0
            })

        } catch (error) {
            console.error('Admin fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleUserPlan = async (userId, currentPlan) => {
        const newPlan = currentPlan === 'premium' ? 'free' : 'premium'
        if (!confirm(`Change user plan to ${newPlan}?`)) return

        try {
            const { error } = await supabase.from('profiles').update({ plan: newPlan }).eq('id', userId)
            if (error) throw error
            setUsers(users.map(u => u.id === userId ? { ...u, plan: newPlan } : u))
            fetchData() // Refresh stats
        } catch (error) {
            alert('Error updating user plan: ' + error.message)
        }
    }

    const savePlan = async (planData) => {
        try {
            const { error } = await supabase.from('plans').upsert(planData)
            if (error) throw error
            setEditingPlan(null)
            setIsAddingPlan(false)
            fetchData()
        } catch (error) {
            alert('Error saving plan: ' + error.message)
        }
    }

    const deletePlan = async (id) => {
        if (!confirm('Delete this plan?')) return
        try {
            const { error } = await supabase.from('plans').delete().eq('id', id)
            if (error) throw error
            fetchData()
        } catch (error) {
            alert('Error deleting plan: ' + error.message)
        }
    }

    if (authLoading || (loading && !users.length)) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading Admin Panel...</div>

    return (
        <div style={{ minHeight: '100vh', background: '#0f172a' }}>
            <div style={{
                background: 'linear-gradient(90deg, #dc2626, #991b1b)',
                color: 'white',
                padding: '0.5rem 2rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span>ADMINISTRATION MODE</span>
                <span>SECURE</span>
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
                        {['overview', 'users', 'plans'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={activeTab === tab ? 'btn-primary' : 'btn-ghost'}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
                        <StatCard icon={<Users />} title="Total Users" value={stats.total} />
                        <StatCard icon={<Activity />} title="Free Users" value={stats.free} />
                        <StatCard icon={<CreditCard />} title="Paid Users" value={stats.paid} />
                        <StatCard icon={<Activity />} title="Est. MRR" value={`$${stats.revenue}`} />
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', fontWeight: 600 }}>User Management</div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                                        <th style={{ padding: '1rem' }}>Email</th>
                                        <th style={{ padding: '1rem' }}>Plan</th>
                                        <th style={{ padding: '1rem' }}>Role</th>
                                        <th style={{ padding: '1rem' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '1rem' }}>{u.email}</td>
                                            <td style={{ padding: '1rem' }}>{u.plan}</td>
                                            <td style={{ padding: '1rem' }}>{u.role}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <button onClick={() => toggleUserPlan(u.id, u.plan)} className="btn-outline" style={{ fontSize: '0.75rem' }}>Toggle Plan</button>
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
                            <div key={plan.id} className="card glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <h3 style={{ fontSize: '1.5rem' }}>{plan.name}</h3>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${plan.price}</div>
                                </div>
                                <ul style={{ flex: 1, listStyle: 'none', marginBottom: '2rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                    {plan.features?.map((f, i) => (
                                        <li key={i} style={{ marginBottom: '0.4rem' }}>• {f}</li>
                                    ))}
                                </ul>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button onClick={() => setEditingPlan(plan)} className="btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Edit2 size={14} /> Edit</button>
                                    <button onClick={() => deletePlan(plan.id)} className="btn-outline" style={{ color: '#EF4444' }}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                        <div
                            onClick={() => setIsAddingPlan(true)}
                            className="card glass"
                            style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', cursor: 'pointer', minHeight: '200px' }}
                        >
                            <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                                <Plus size={32} style={{ marginBottom: '0.5rem' }} />
                                <div>Add New Plan</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {(editingPlan || isAddingPlan) && (
                <PlanModal
                    plan={editingPlan}
                    onClose={() => { setEditingPlan(null); setIsAddingPlan(false); }}
                    onSave={savePlan}
                />
            )}
        </div>
    )
}

function PlanModal({ plan, onClose, onSave }) {
    const [formData, setFormData] = useState(plan || { id: '', name: '', price: 0, features: [] })
    const [featureInput, setFeatureInput] = useState('')

    const addFeature = () => {
        if (!featureInput.trim()) return
        setFormData({ ...formData, features: [...formData.features, featureInput.trim()] })
        setFeatureInput('')
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="card glass" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                <h3>{plan ? 'Edit Plan' : 'New Plan'}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                    <input placeholder="Plan ID (e.g. premium)" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} disabled={!!plan} className="input-field" />
                    <input placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-field" />
                    <input type="number" placeholder="Price" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="input-field" />

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input placeholder="Feature" value={featureInput} onChange={e => setFeatureInput(e.target.value)} className="input-field" />
                        <button onClick={addFeature} className="btn-primary" style={{ padding: '0 1rem' }}><Plus size={18} /></button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {formData.features.map((f, i) => (
                            <span key={i} className="pill pill-personal" style={{ fontSize: '0.7rem' }}>{f}</span>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button onClick={onClose} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
                        <button onClick={() => onSave(formData)} className="btn-primary" style={{ flex: 1 }}>Save</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ icon, title, value }) {
    return (
        <div className="card glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ color: 'var(--color-primary)' }}>{icon}</div>
            <div>
                <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>{title}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
            </div>
        </div>
    )
}
