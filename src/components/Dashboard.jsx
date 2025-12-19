import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Check, Trash2, LogOut, ArrowRight, Link as LinkIcon, Plus } from 'lucide-react'

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
                category: 'personal'
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
            setItems(items.map(item => item.id === id ? { ...item, status: newStatus } : item))
        } catch (error) {
            console.error('Error updating status:', error)
            fetchItems()
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
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* 2. HEADER - FULL REBUILD */}
            <header className="glass" style={{
                height: 'var(--header-height)',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center'
            }}>
                <div className="container" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Brand Dominance */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(245, 158, 11, 0.15))',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                            <img src="/logo.svg" alt="Latero" style={{ width: '24px', height: '24px' }} />
                        </div>
                        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Latero</h1>
                    </div>

                    {/* Nav actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem', fontWeight: 500 }} className="desktop-only">
                            {user.email}
                        </span>
                        <button onClick={signOut} className="btn-icon" title="Sign Out">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="container" style={{ flex: 1, paddingTop: '3rem', paddingBottom: '6rem' }}>

                {/* 3. PRIMARY ACTION - COMMAND BAR */}
                <section style={{ marginBottom: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <form onSubmit={addItem} style={{ width: '100%', position: 'relative', zIndex: 10 }}>
                        <div className="input-wrapper">
                            <input
                                type="url"
                                className="input-field"
                                placeholder="Paste a link to save for later..."
                                value={newItemUrl}
                                onChange={(e) => setNewItemUrl(e.target.value)}
                                autoFocus
                            />
                            <div style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <button type="submit" className="btn-primary" disabled={adding}>
                                    {adding ? (
                                        <span>Saving...</span>
                                    ) : (
                                        <>
                                            <span style={{ marginRight: '0.5rem' }}>Save for Later</span>
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </section>

                {/* CONTENT AREA */}
                {loading ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', marginTop: '4rem' }}>Loading workspace...</div>
                ) : items.length === 0 ? (
                    /* 5. EMPTY STATE - BIG & EMOTIONAL */
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        padding: '4rem 0',
                        marginTop: '2rem'
                    }}>
                        {/* Watermark Logo */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '300px',
                            height: '300px',
                            opacity: 0.03,
                            zIndex: 0,
                            pointerEvents: 'none'
                        }}>
                            <img src="/logo.svg" alt="" style={{ width: '100%', height: '100%' }} />
                        </div>

                        <div style={{ zIndex: 1, textAlign: 'center' }}>
                            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                You haven't saved anything yet.
                            </h2>
                            <p style={{ fontSize: '1.125rem', color: 'var(--color-text-tertiary)' }}>
                                Latero remembers what you don't. Paste a link above to get started.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* 4. ITEM CARDS - REDESIGN */
                    <div className="card-grid">
                        <section>
                            <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', marginBottom: '1.5rem', paddingLeft: '0.5rem' }}>
                                Your Queue
                            </h3>
                            <div style={{ display: 'grid', gap: '1.25rem' }}>
                                {items.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className={`item-card animate-enter ${item.status === 'done' ? 'done' : ''}`}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                        onClick={() => window.open(item.content, '_blank')}
                                    >
                                        {/* Status Toggle (Left) */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleStatus(item.id, item.status); }}
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '50%',
                                                border: item.status === 'done' ? 'none' : '2px solid var(--color-text-tertiary)',
                                                background: item.status === 'done' ? 'var(--color-success)' : 'transparent',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            title={item.status === 'done' ? "Mark as Pending" : "Mark as Done"}
                                        >
                                            {item.status === 'done' && <Check size={16} />}
                                        </button>

                                        {/* Main Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h4 style={{
                                                fontSize: '1.125rem',
                                                marginBottom: '0.5rem',
                                                fontWeight: 600,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                textDecoration: item.status === 'done' ? 'line-through' : 'none',
                                                color: item.status === 'done' ? 'var(--color-text-tertiary)' : 'var(--color-text)'
                                            }}>
                                                {item.title || item.content}
                                            </h4>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>
                                                {/* Domain / Source */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <LinkIcon size={14} />
                                                    <span>{getDomain(item.content)}</span>
                                                </div>
                                                <span>•</span>
                                                <span>{getRelativeTime(item.created_at)}</span>
                                            </div>
                                        </div>

                                        {/* Hover Actions (Right) */}
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => deleteItem(item.id)}
                                                className="btn-icon delete-action"
                                                style={{ color: '#EF4444' }}
                                                title="Delete"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}
            </main>

            <style>{`
                .desktop-only { display: block; }
                @media (max-width: 640px) {
                    .desktop-only { display: none; }
                    .input-field {
                        padding-right: 1rem;
                    }
                    /* Move button out of input on small screens if needed, 
                       but floating inside is cleaner. We'll adjust padding. */
                }
                
                /* Hover Action Logic */
                .delete-action {
                    opacity: 0;
                    transform: translateX(10px);
                }
                
                .item-card:hover .delete-action {
                    opacity: 1;
                    transform: translateX(0);
                }
                
                /* On touch devices, always show actions or handle differently. 
                   For now, we assume hover capability or tap to generic area */
                @media (hover: none) {
                    .delete-action { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    )
}

// Helpers
const getDomain = (url) => {
    try {
        return new URL(url).hostname.replace('www.', '')
    } catch {
        return 'link'
    }
}

const getRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)

    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return 'yesterday' // simpler for now
}
