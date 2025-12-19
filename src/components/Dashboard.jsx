import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Plus, Check, ExternalLink, Trash2, LogOut, CheckCircle } from 'lucide-react'

export default function Dashboard() {
    const { user, signOut } = useAuth()
    const [newItemUrl, setNewItemUrl] = useState('')
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)

    useEffect(() => {
        fetchItems()
    }, [user])

    const fetchItems = async () => {
        try {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setItems(data || [])
        } catch (error) {
            console.error('Error fetching items:', error)
        } finally {
            setLoading(false)
        }
    }

    const addItem = async (e) => {
        e.preventDefault()
        if (!newItemUrl.trim()) return

        setAdding(true)
        try {
            const { error } = await supabase.from('items').insert({
                user_id: user.id,
                content: newItemUrl,
                title: newItemUrl,
                status: 'pending',
                category: 'personal' // Default category
            })

            if (error) throw error
            setNewItemUrl('')
            fetchItems()
        } catch (error) {
            console.error('Error adding item:', error)
        } finally {
            setAdding(false)
        }
    }

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'pending' ? 'done' : 'pending'
        try {
            await supabase.from('items').update({ status: newStatus }).eq('id', id)
            // Optimistic update
            setItems(items.map(item => item.id === id ? { ...item, status: newStatus } : item))
        } catch (error) {
            console.error('Error updating status:', error)
            fetchItems() // Revert on error
        }
    }

    const deleteItem = async (id) => {
        if (!confirm('Delete this item?')) return
        try {
            await supabase.from('items').delete().eq('id', id)
            setItems(items.filter(item => item.id !== id))
        } catch (error) {
            console.error('Error deleting item:', error)
        }
    }

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
            {/* Header */}
            <header className="glass" style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                padding: '1rem 0',
                marginBottom: '2rem'
            }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src="/logo.png" alt="Latero" style={{ width: '32px', height: '32px' }} />
                        <span style={{ fontWeight: '700', fontSize: '1.25rem', letterSpacing: '-0.03em' }}>Latero</span>
                    </div>
                    <button onClick={signOut} className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Sign Out">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <main className="container">
                {/* Input Area */}
                <div style={{ marginBottom: '3rem' }}>
                    <form onSubmit={addItem} style={{ position: 'relative' }}>
                        <input
                            type="url"
                            placeholder="Paste a link to save for later..."
                            className="input"
                            style={{
                                paddingRight: '140px',
                                height: '52px',
                                fontSize: '1rem',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                            value={newItemUrl}
                            onChange={(e) => setNewItemUrl(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={adding}
                            style={{
                                position: 'absolute',
                                right: '6px',
                                top: '6px',
                                bottom: '6px',
                                borderRadius: '6px'
                            }}
                        >
                            {adding ? 'Saving...' : 'Save for Later'}
                        </button>
                    </form>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-tertiary)' }}>Loading...</div>
                ) : items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', opacity: 0.8 }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: 'var(--color-bg-subtle)',
                            borderRadius: '50%',
                            margin: '0 auto 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-text-tertiary)'
                        }}>
                            <Plus size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>You haven't saved anything yet</h3>
                        <p style={{ color: 'var(--color-text-secondary)' }}>Latero remembers for you.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {items.map(item => (
                            <ItemRow
                                key={item.id}
                                item={item}
                                toggleStatus={toggleStatus}
                                deleteItem={deleteItem}
                            />
                        ))}
                    </div>
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

    const getRelativeTime = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInSeconds = Math.floor((now - date) / 1000)

        if (diffInSeconds < 60) return 'just now'
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
        if (diffInSeconds < 172800) return 'yesterday'
        return date.toLocaleDateString()
    }

    const isDone = item.status === 'done'

    const handleRowClick = () => {
        if (isUrl(item.content)) {
            window.open(item.content, '_blank')
        }
    }

    return (
        <div
            onClick={handleRowClick}
            className={`card ${isDone ? 'card-done' : 'card-interactive cursor-pointer'}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isDone ? 'scale(0.98)' : 'scale(1)',
                position: 'relative',
                paddingRight: '1rem'
            }}
        >
            <button
                onClick={(e) => { e.stopPropagation(); toggleStatus(item.id, item.status); }}
                className="btn-outline"
                style={{
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: isDone ? 'var(--color-success)' : 'var(--color-border)',
                    borderColor: isDone ? 'var(--color-success)' : 'var(--color-border)',
                    background: isDone ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    transition: 'all 0.2s ease'
                }}
            >
                {isDone ? <Check size={14} /> : null}
            </button>

            <div style={{ flex: 1, minWidth: 0, opacity: isDone ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                <h3 style={{
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    textDecoration: isDone ? 'line-through' : 'none',
                    color: 'var(--color-text)',
                    marginBottom: '0.125rem',
                    lineHeight: 1.4,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {item.title || item.content}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }}>
                    {isUrl(item.content) && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: 0.8 }}>
                            {new URL(item.content).hostname.replace('www.', '')}
                        </span>
                    )}
                    <span>• {getRelativeTime(item.created_at)}</span>
                </div>
            </div>

            <div className="actions-group" style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                    onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                    className="btn-secondary"
                    style={{ padding: '0.35rem', borderRadius: '6px', color: 'var(--color-text-tertiary)' }}
                    title="Delete"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    )
}
