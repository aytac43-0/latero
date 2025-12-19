import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { LogOut, Plus, Trash2, CheckCircle, ExternalLink, FileText, Check, X } from 'lucide-react'

export default function Dashboard() {
    const { user, signOut } = useAuth()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [newItem, setNewItem] = useState({ title: '', content: '', category: 'personal' })
    const [isAdding, setIsAdding] = useState(false)

    useEffect(() => {
        fetchItems()
    }, [])

    const fetchItems = async () => {
        try {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setItems(data)
        } catch (error) {
            console.error('Error fetching items:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleAddItem = async (e) => {
        e.preventDefault()
        if (!newItem.content) return

        try {
            const { data, error } = await supabase
                .from('items')
                .insert([{
                    user_id: user.id,
                    title: newItem.title || 'Untitled',
                    content: newItem.content,
                    category: newItem.category,
                    status: 'pending'
                }])
                .select()

            if (error) throw error
            setItems([data[0], ...items])
            setNewItem({ title: '', content: '', category: 'personal' })
            setIsAdding(false)
        } catch (error) {
            console.error('Error adding item:', error.message)
        }
    }

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'done' ? 'pending' : 'done'
        try {
            const { error } = await supabase
                .from('items')
                .update({ status: newStatus })
                .eq('id', id)

            if (error) throw error
            setItems(items.map(item => item.id === id ? { ...item, status: newStatus } : item))
        } catch (error) {
            console.error('Error updating item:', error.message)
        }
    }

    const deleteItem = async (id) => {
        if (!confirm('Are you sure you want to delete this item?')) return

        try {
            const { error } = await supabase
                .from('items')
                .delete()
                .eq('id', id)

            if (error) throw error
            setItems(items.filter(item => item.id !== id))
        } catch (error) {
            console.error('Error deleting item:', error.message)
        }
    }

    // Logic for Today View
    // "Today" items are Pending items created BEFORE today (00:00)
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const todayItems = items.filter(item => {
        if (item.status !== 'pending') return false
        const created = new Date(item.created_at)
        return created < startOfToday
    })

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid var(--color-border)', padding: '1.25rem 0' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        <h1 className="brand-title">Latero</h1>
                        <span className="brand-subtitle">Save it for later</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>{user.email}</span>
                        <button onClick={signOut} className="btn btn-outline" style={{ padding: '0.4rem' }} title="Logout">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="container" style={{ flex: 1, padding: '2rem 1rem' }}>

                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="btn btn-primary"
                        style={{ width: '100%', marginBottom: '3rem', padding: '1rem', fontSize: '1rem' }}
                    >
                        <Plus size={20} /> Add New Item
                    </button>
                )}

                {isAdding && (
                    <div className="card" style={{ marginBottom: '3rem' }}>
                        <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input
                                className="input"
                                placeholder="Content (URL or Note)"
                                value={newItem.content}
                                onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                                autoFocus
                                required
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    className="input"
                                    placeholder="Title (Optional)"
                                    value={newItem.title}
                                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                    style={{ flex: 2 }}
                                />
                                <select
                                    className="input"
                                    value={newItem.category}
                                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                    style={{ flex: 1 }}
                                >
                                    <option value="personal">Personal</option>
                                    <option value="work">Work</option>
                                    <option value="read">Read</option>
                                    <option value="watch">Watch</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setIsAdding(false)} className="btn btn-outline">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Item</button>
                            </div>
                        </form>
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-light)' }}>Loading items...</div>
                ) : (
                    <>
                        <section style={{ marginBottom: '4rem' }}>
                            <h2 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-light)', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Today <span style={{ background: 'var(--color-bg-card)', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.7rem', border: '1px solid var(--color-border)' }}>{todayItems.length}</span>
                            </h2>
                            {todayItems.length === 0 ? (
                                <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--color-text-light)', background: 'var(--color-bg-card)', borderRadius: 'var(--radius)', border: '1px dashed var(--color-border)' }}>
                                    <p style={{ fontWeight: 500 }}>You're all caught up. Nice.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {todayItems.map(item => (
                                        <ItemRow key={`today-${item.id}`} item={item} toggleStatus={toggleStatus} deleteItem={deleteItem} />
                                    ))}
                                </div>
                            )}
                        </section>

                        <section>
                            <h2 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-light)', fontWeight: 600, marginBottom: '1.5rem' }}>All Items</h2>
                            {items.length === 0 ? (
                                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-light)' }}>
                                    <p>Nothing here yet. Save something for later.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {items.map(item => (
                                        <ItemRow key={item.id} item={item} toggleStatus={toggleStatus} deleteItem={deleteItem} />
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    )
}

function ItemRow({ item, toggleStatus, deleteItem }) {
    const isUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    const isDone = item.status === 'done'

    return (
        <div className={`card ${isDone ? 'card-done' : 'card-interactive'}`} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
        }}>
            <button
                onClick={() => toggleStatus(item.id, item.status)}
                className="btn-outline"
                style={{
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: isDone ? 'var(--color-success)' : 'var(--color-text-light)',
                    borderColor: isDone ? 'var(--color-success)' : 'var(--color-border)'
                }}
            >
                {isDone ? <CheckCircle size={18} /> : null}
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: 500,
                    textDecoration: isDone ? 'line-through' : 'none',
                    color: isDone ? 'var(--color-text-light)' : 'var(--color-text)',
                    marginBottom: '0.35rem',
                    lineHeight: 1.4
                }}>
                    {item.title || 'Untitled'}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-light)', fontSize: '0.85rem' }}>
                    <span className="pill">
                        {item.category}
                    </span>
                    {isUrl(item.content) ? (
                        <a href={item.content} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-primary)' }}>
                            <ExternalLink size={12} /> {new URL(item.content).hostname}
                        </a>
                    ) : (
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>{item.content}</span>
                    )}
                </div>
            </div>

            <button
                onClick={() => deleteItem(item.id)}
                className="btn-outline"
                style={{ color: '#ef4444', border: 'none', padding: '0.5rem', opacity: 0.6 }}
                title="Delete"
                onMouseEnter={(e) => e.target.style.opacity = 1}
                onMouseLeave={(e) => e.target.style.opacity = 0.6}
            >
                <Trash2 size={18} />
            </button>
        </div>
    )
}
