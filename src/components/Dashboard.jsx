import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Check, Trash2, LogOut, ArrowRight, Link as LinkIcon, Plus, FileText, Pin, Search as SearchIcon, X, Calendar } from 'lucide-react'

export default function Dashboard() {
    const { user, signOut } = useAuth()
    const [newItemContent, setNewItemContent] = useState('')
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
    const searchInputRef = useRef(null)

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('theme', theme)
    }, [theme])

    // Keyboard Shortcut for Search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsSearchOpen(true)
                setTimeout(() => searchInputRef.current?.focus(), 10)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

    useEffect(() => {
        fetchItems()
    }, [user])

    const fetchItems = async () => {
        try {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('user_id', user.id)
                .order('is_pinned', { ascending: false }) // Pinned first
                .order('created_at', { ascending: false })

            if (error) throw error
            setItems(data || [])
        } catch (error) {
            console.error('Error fetching items:', error)
        } finally {
            setLoading(false)
        }
    }

    const isUrl = (string) => {
        try {
            const url = new URL(string.includes('://') ? string : `https://${string}`)
            return url.hostname.includes('.')
        } catch (_) {
            return false
        }
    }

    const addItem = async (e) => {
        e.preventDefault()
        if (!newItemContent.trim()) return

        setAdding(true)
        const content = newItemContent.trim()

        // Flexible Logic: Check if it's a URL, otherwise Note
        const isNote = !isUrl(content)
        const finalContent = isNote ? content : (content.includes('://') ? content : `https://${content}`)
        const title = isNote ? content : finalContent

        try {
            const { error } = await supabase.from('items').insert({
                user_id: user.id,
                content: finalContent,
                title: title,
                status: 'pending',
                category: isNote ? 'note' : 'personal',
                is_pinned: false
            })

            if (error) throw error
            setNewItemContent('')
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
            // Optimistic
            setItems(items.map(item => item.id === id ? { ...item, status: newStatus } : item))

            // Inbox Zero Check could go here
        } catch (error) {
            console.error('Error updating status:', error)
            fetchItems()
        }
    }

    const togglePin = async (id, currentPinned) => {
        const newPinned = !currentPinned
        try {
            await supabase.from('items').update({ is_pinned: newPinned }).eq('id', id)
            // Optimistic: Update and Re-sort
            const updatedItems = items.map(item => item.id === id ? { ...item, is_pinned: newPinned } : item)
                .sort((a, b) => {
                    if (a.is_pinned === b.is_pinned) return new Date(b.created_at) - new Date(a.created_at);
                    return a.is_pinned ? -1 : 1;
                });
            setItems(updatedItems)
        } catch (error) {
            console.error('Error pinnning:', error)
            fetchItems()
        }
    }

    const updateItem = async (id, updates) => {
        try {
            const { error } = await supabase.from('items').update(updates).eq('id', id)
            if (error) throw error
            setItems(items.map(item => item.id === id ? { ...item, ...updates } : item))
        } catch (error) {
            console.error('Error updating item:', error)
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

    // Filter Items
    const filteredItems = items.filter(item => {
        const term = searchTerm.toLowerCase()
        return (item.title && item.title.toLowerCase().includes(term)) ||
            (item.content && item.content.toLowerCase().includes(term))
    })

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* HEADER */}
            <header className="glass" style={{
                height: 'var(--header-height)',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center'
            }}>
                <div className="container" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                        <h1 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 700 }} className="brand-text">Latero</h1>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Search Toggle (Mobile) or Bar */}
                        <div className={`search-wrapper ${isSearchOpen ? 'open' : ''}`}>
                            <div style={{ position: 'relative' }}>
                                <SearchIcon size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: "translateY(-50%)", color: 'var(--color-text-tertiary)' }} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        padding: '0.4rem 0.5rem 0.4rem 2.2rem',
                                        color: 'var(--color-text)',
                                        fontSize: '0.9rem',
                                        width: isSearchOpen ? '200px' : '0px',
                                        opacity: isSearchOpen ? 1 : 0,
                                        transition: 'all 0.2s',
                                        cursor: isSearchOpen ? 'text' : 'pointer'
                                    }}
                                    ref={(input) => {
                                        searchInputRef.current = input;
                                        if (isSearchOpen && input) input.focus()
                                    }}
                                />
                            </div>
                        </div>
                        <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="btn-icon mobile-only">
                            {isSearchOpen ? <X size={20} /> : <SearchIcon size={20} />}
                        </button>

                        <button onClick={toggleTheme} className="btn-icon" title="Toggle Theme">
                            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <button onClick={signOut} className="btn-icon" title="Sign Out">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="container" style={{ flex: 1, paddingTop: '3rem', paddingBottom: '6rem' }}>

                {/* COMMAND BAR */}
                <section style={{ marginBottom: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <form onSubmit={addItem} style={{ width: '100%', position: 'relative', zIndex: 10 }}>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Paste a link or write a note..."
                                value={newItemContent}
                                onChange={(e) => setNewItemContent(e.target.value)}
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
                                            <span style={{ marginRight: '0.5rem', display: 'none' }} className="desktop-inline">Save</span>
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </section>

                {/* CONTENT */}
                {loading ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', marginTop: '4rem' }}>Loading...</div>
                ) : filteredItems.length === 0 ? (
                    searchTerm ? (
                        <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No matches found.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', position: 'relative' }}>
                            <div style={{ position: 'absolute', opacity: 0.03, zIndex: 0, pointerEvents: 'none' }}>
                                <img src="/logo.svg" alt="" style={{ width: '300px', height: '300px' }} />
                            </div>
                            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center' }}>
                                Latero remembers what you don't.
                            </h2>
                        </div>
                    )
                ) : (
                    <div className="card-grid">
                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            {filteredItems.map((item, index) => (
                                <ItemRow
                                    key={item.id}
                                    item={item}
                                    toggleStatus={toggleStatus}
                                    deleteItem={deleteItem}
                                    togglePin={togglePin}
                                    updateItem={updateItem}
                                    index={index}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <style>{`
                .desktop-inline { display: inline; }
                .mobile-only { display: none; }
                
                @media (max-width: 640px) {
                    .desktop-inline { display: none; }
                    .mobile-only { display: flex; }
                    .brand-text { display: none; } /* Hide text on small mobile if needed, or keep */
                    .search-wrapper { display: none; }
                    .search-wrapper.open { display: block; position: absolute; top: 80px; left: 0; right: 0; padding: 1rem; background: var(--color-bg); z-index: 90; }
                    .search-wrapper.open input { width: 100% !important; }
                }

                @media (min-width: 641px) {
                    .search-wrapper input { width: 200px !important; opacity: 1 !important; }
                }
            `}</style>
        </div>
    )
}

function ItemRow({ item, toggleStatus, deleteItem, togglePin, updateItem, index }) {
    const isNote = item.category === 'note' || !item.category
    const isDone = item.status === 'done'
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(item.title)
    const [editContent, setEditContent] = useState(item.content)

    const handleSave = () => {
        updateItem(item.id, { title: editTitle, content: editContent })
        setIsEditing(false)
    }

    const handleRowClick = () => {
        if (!isEditing && !isNote) {
            window.open(item.content, '_blank')
        }
    }

    // Domain helper
    const getDomain = (url) => {
        try { return new URL(url).hostname.replace('www.', '') } catch { return 'link' }
    }

    if (isEditing) {
        return (
            <div className="item-card highlighting" style={{ cursor: 'default', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="input-field"
                    style={{ height: '40px', fontSize: '1rem', padding: '0 0.75rem' }}
                    placeholder="Title"
                    autoFocus
                />
                <input
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="input-field"
                    style={{ height: '36px', fontSize: '0.875rem', padding: '0 0.75rem', fontFamily: 'monospace' }}
                    placeholder="Content (URL or Note)"
                />
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => setIsEditing(false)} className="btn-outline" style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>Cancel</button>
                    <button onClick={handleSave} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>Save</button>
                </div>
            </div>
        )
    }

    return (
        <div
            onClick={handleRowClick}
            className={`item-card animate-enter ${isDone ? 'done' : ''}`}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            {/* Left Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                <button
                    onClick={(e) => { e.stopPropagation(); toggleStatus(item.id, item.status); }}
                    className="action-btn status-btn"
                    style={{
                        background: isDone ? 'var(--color-success, #10B981)' : 'transparent',
                        borderColor: isDone ? 'transparent' : 'var(--color-text-tertiary)',
                        color: 'white'
                    }}
                >
                    {isDone && <Check size={14} />}
                </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0, paddingLeft: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <h4 style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        textDecoration: isDone ? 'line-through' : 'none',
                        color: isDone ? 'var(--color-text-tertiary)' : 'var(--color-text)',
                        marginBottom: '0.25rem',
                        lineHeight: 1.4
                    }}>
                        {item.title || item.content}
                    </h4>
                    {/* Pin Action (Top Right of Card) */}
                    <button
                        onClick={(e) => { e.stopPropagation(); togglePin(item.id, item.is_pinned); }}
                        style={{
                            opacity: item.is_pinned ? 1 : 0.2,
                            color: item.is_pinned ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                            background: 'none', border: 'none', padding: 4, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', transition: 'all 0.2s'
                        }}
                        className="pin-btn"
                        title={item.is_pinned ? "Unpin" : "Pin to top"}
                    >
                        <Pin size={16} fill={item.is_pinned ? "currentColor" : "none"} />
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-tertiary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {!isNote && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <LinkIcon size={12} />
                            <span>{getDomain(item.content)}</span>
                        </div>
                    )}
                    {isNote && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <FileText size={12} />
                            <span>Note</span>
                        </div>
                    )}

                    {/* Category Pill */}
                    {item.category && item.category !== 'personal' && (
                        <span className={`pill pill-${item.category}`}>
                            {item.category}
                        </span>
                    )}
                </div>
            </div>

            {/* Hover Actions */}
            <div onClick={(e) => e.stopPropagation()} className="row-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                {/* Reminder Action - Using a hidden date input for MVP or simple presets if requested. 
                    User requested Presets (Today, Tomorrow). 
                    I'll implement a simple cyclic toggle or a long-press menu? 
                    Let's simpler: Click -> Set for Tomorrow. Long Click -> Custom? 
                    Actually, a native select with opacity 0 over the icon is a clever hack for mobile menus without UI libs.
                 */}
                <div style={{ position: 'relative', width: '20px', height: '20px', overflow: 'hidden' }}>
                    <Calendar size={18} style={{ color: item.reminder_at ? 'var(--color-primary)' : 'var(--color-text-secondary)', position: 'absolute', pointerEvents: 'none' }} />
                    <select
                        style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (!val) return;
                            let date = new Date();
                            if (val === 'tomorrow') date.setDate(date.getDate() + 1);
                            if (val === 'next-week') date.setDate(date.getDate() + 7);
                            // If custom, we could trigger a modal, but let's stick to presets for this robust pass
                            updateItem(item.id, { reminder_at: date.toISOString() })
                        }}
                        defaultValue=""
                    >
                        <option value="" disabled>Remind me...</option>
                        <option value="tomorrow">Tomorrow</option>
                        <option value="next-week">Next Week</option>
                    </select>
                </div>

                <button
                    onClick={() => setIsEditing(true)}
                    className="btn-icon delete-action"
                    style={{ color: 'var(--color-text-secondary)' }}
                    title="Edit"
                >
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Edit</span>
                </button>
                <button
                    onClick={() => deleteItem(item.id)}
                    className="btn-icon delete-action"
                    style={{ color: '#EF4444' }}
                >
                    <Trash2 size={18} />
            </div>

            <style>{`
                .action-btn {
                    width: 24px; height: 24px; border-radius: 50%;
                    border: 2px solid; display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.2s; padding: 0;
                }
                .pin-btn:hover { opacity: 1 !important; transform: scale(1.1); }
                
                /* Mobile Touch Target Fixes */
                @media (max-width: 640px) {
                    .delete-action { opacity: 1 !important; transform: none !important; padding: 12px; }
                    .row-actions { display: flex; align-items: center; }
                    .status-btn { width: 28px; height: 28px; } /* Larger touch target */
                }
            `}</style>
        </div>
    )
}
