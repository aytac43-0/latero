import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Check, Trash2, LogOut, ArrowRight, Link as LinkIcon, Plus, FileText, Pin, Search as SearchIcon, X, Calendar, Settings as SettingsIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { saveItemHelper } from '../utils/supabaseHelpers'

export default function Dashboard() {
    const { user, profile, signOut } = useAuth()
    const navigate = useNavigate()
    const [newItemContent, setNewItemContent] = useState('')
    const [newItemNote, setNewItemNote] = useState('')
    const [newItemReminder, setNewItemReminder] = useState('')
    const [newItemIsPinned, setNewItemIsPinned] = useState(false)
    const [showAddDetails, setShowAddDetails] = useState(false)
    const [toast, setToast] = useState(null)
    const [editingItem, setEditingItem] = useState(null)

    // ... existing items state ...
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
    const searchInputRef = useRef(null)

    const isPremium = profile?.plan === 'premium'
    const ITEM_LIMIT = 50

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
        if (user) fetchItems()
    }, [user])

    const fetchItems = async () => {
        try {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('user_id', user.id)
                .order('is_pinned', { ascending: false })
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
        if (e) e.preventDefault()

        const mainInput = newItemContent.trim()
        const userNote = newItemNote.trim()

        if (!mainInput && !userNote) return

        setAdding(true)

        // Title logic
        let title = mainInput || userNote.slice(0, 50) + (userNote.length > 50 ? '...' : '')
        let content = mainInput

        if (isUrl(mainInput)) {
            content = mainInput.includes('://') ? mainInput : `https://${mainInput}`
        } else if (!mainInput && userNote) {
            content = userNote
        }

        try {
            const payload = {
                content,
                title,
                user_note: userNote,
                reminder_at: newItemReminder || null,
                is_pinned: newItemIsPinned
            }

            await saveItemHelper(user, payload)

            // Reset
            setNewItemContent('')
            setNewItemNote('')
            setNewItemReminder('')
            setNewItemIsPinned(false)
            setShowAddDetails(false)
            setToast({ message: 'Saved successfully!', type: 'success' })
            fetchItems()
        } catch (error) {
            setToast({ message: `Failed: ${error.message || 'Error'}`, type: 'error' })
        } finally {
            setAdding(false)
            setTimeout(() => setToast(null), 3000)
        }
    }

    // ... (toggleStatus, togglePin, etc. remain the same) ...
    // we need to view the file to make sure I don't delete them or I need to include them if I am replacing the whole block.
    // The instructions say "Rewrite the addItem section (form and state)". 
    // I will target the code FROM `const [newItemContent` TO the end of `addItem` logic, 
    // BUT checking the line numbers, `addItem` ends at 114.
    // I will replace lines 10-114. Wait, that includes `fetchItems` and `useEffect`s. 
    // I need to be careful. The block above replaces lines 10-63 + addItem.
    // It seems safe to replace the big chunk.

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

    const togglePin = async (id, currentPinned) => {
        const newPinned = !currentPinned
        try {
            await supabase.from('items').update({ is_pinned: newPinned }).eq('id', id)
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
            setToast({ message: 'Changes saved!', type: 'success' })
        } catch (error) {
            console.error('Error updating item:', error)
            setToast({ message: 'Update failed', type: 'error' })
        } finally {
            setTimeout(() => setToast(null), 3000)
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
            (item.content && item.content.toLowerCase().includes(term)) ||
            (item.user_note && item.user_note.toLowerCase().includes(term))
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

                        <button onClick={toggleTheme} className="btn-icon" title="Toggle Theme" style={{ fontSize: '1.2rem' }}>
                            {/* Emoji-based theme toggle to avoid lucide-react ReferenceErrors */}
                            {theme === 'dark' ? '🌙' : '☀️'}
                        </button>

                        <button onClick={() => navigate('/settings')} className="btn-icon" title="Settings">
                            <SettingsIcon size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="container" style={{ flex: 1, paddingTop: '3rem', paddingBottom: '6rem' }}>

                {/* COMMAND BAR */}
                <section style={{ marginBottom: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="card glass" style={{ width: '100%', padding: '1.5rem', position: 'relative', zIndex: 10, borderRadius: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <textarea
                                placeholder="Paste a link or write a note..."
                                value={newItemContent}
                                onChange={(e) => setNewItemContent(e.target.value)}
                                onFocus={() => setShowAddDetails(true)}
                                className="input-field-clean"
                                style={{
                                    width: '100%',
                                    minHeight: showAddDetails ? '100px' : '40px',
                                    background: 'transparent',
                                    border: 'none',
                                    fontSize: '1.25rem',
                                    color: 'var(--color-text)',
                                    outline: 'none',
                                    resize: 'none',
                                    padding: '0.5rem 0'
                                }}
                            />

                            {showAddDetails && (
                                <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                                    <textarea
                                        placeholder="Add a detailed description or extra thoughts (optional)..."
                                        value={newItemNote}
                                        onChange={(e) => setNewItemNote(e.target.value)}
                                        style={{
                                            width: '100%', height: '80px', background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid var(--color-border)', borderRadius: '12px',
                                            padding: '0.75rem', color: 'var(--color-text)', resize: 'none',
                                            fontFamily: 'inherit', fontSize: '0.95rem'
                                        }}
                                    />

                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ position: 'relative' }}>
                                                <button type="button" className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem', borderRadius: '10px' }}>
                                                    <Calendar size={16} />
                                                    {newItemReminder ? new Date(newItemReminder).toLocaleDateString() : 'Set Reminder'}
                                                </button>
                                                <input
                                                    type="datetime-local"
                                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                                    onChange={(e) => setNewItemReminder(e.target.value)}
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setNewItemIsPinned(!newItemIsPinned)}
                                                className={newItemIsPinned ? 'btn-primary' : 'btn-outline'}
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem', borderRadius: '10px' }}
                                            >
                                                <Pin size={16} fill={newItemIsPinned ? 'currentColor' : 'none'} />
                                                {newItemIsPinned ? 'Pinned' : 'Pin'}
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto' }}>
                                            <button
                                                onClick={() => {
                                                    setShowAddDetails(false);
                                                    setNewItemContent('');
                                                    setNewItemNote('');
                                                    setNewItemReminder('');
                                                    setNewItemIsPinned(false);
                                                }}
                                                className="btn-ghost"
                                                style={{ fontSize: '0.9rem' }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={addItem}
                                                className="btn-primary"
                                                disabled={adding || (!newItemContent.trim() && !newItemNote.trim())}
                                                style={{ padding: '0.5rem 2rem', height: '44px', fontWeight: 600 }}
                                            >
                                                {adding ? 'Saving...' : 'Save to Latero'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {!showAddDetails && newItemContent.trim() && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button onClick={addItem} className="btn-primary" disabled={adding} style={{ borderRadius: '12px', padding: '0.5rem 1.5rem' }}>
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* CONTENT */}
                {loading ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', marginTop: '4rem' }}>Loading...</div>
                ) : filteredItems.length === 0 ? (
                    searchTerm ? (
                        <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No matches found.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', position: 'relative' }}>
                            <div style={{ position: 'absolute', opacity: 0.05, zIndex: 0, pointerEvents: 'none' }}>
                                <img src="/logo.svg" alt="" style={{ width: '300px', height: '300px', animation: 'float 6s ease-in-out infinite' }} />
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
                                    onEdit={() => setEditingItem(item)}
                                    index={index}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* MODALS & TOASTS */}
            {editingItem && (
                <EditModal
                    item={editingItem}
                    onClose={() => setEditingItem(null)}
                    onSave={(updates) => {
                        updateItem(editingItem.id, updates)
                        setEditingItem(null)
                    }}
                />
            )}

            {toast && (
                <div className="toast">
                    {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                </div>
            )}

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

                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                    100% { transform: translateY(0px); }
                }
            `}</style>
        </div>
    )
}

function EditModal({ item, onClose, onSave }) {
    const isNote = !item.content || !item.content.includes('://')
    const [title, setTitle] = useState(item.title || '')
    const [content, setContent] = useState(item.content || '')
    const [userNote, setUserNote] = useState(item.user_note || '')
    const [reminder, setReminder] = useState(item.reminder_at || '')

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="card glass animate-enter" onClick={e => e.stopPropagation()} style={{
                width: '100%', maxWidth: '500px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem'
            }}>
                <h3 style={{ marginBottom: '0.5rem' }}>Edit Item</h3>

                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: '0.4rem' }}>Title / URL</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="input-field"
                        style={{ height: '48px', padding: '0 1rem', fontSize: '1rem', width: '100%' }}
                        placeholder="Title"
                    />
                </div>

                {!isNote && (
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: '0.4rem' }}>Source Link</label>
                        <input
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="input-field"
                            style={{ height: '44px', padding: '0 1rem', fontSize: '0.9rem', fontFamily: 'monospace', width: '100%' }}
                            placeholder="URL"
                        />
                    </div>
                )}

                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: '0.4rem' }}>Personal Note</label>
                    <textarea
                        value={userNote}
                        onChange={(e) => setUserNote(e.target.value)}
                        className="input-field"
                        style={{ height: '100px', padding: '0.75rem', fontSize: '1rem', resize: 'vertical', width: '100%', fontFamily: 'inherit' }}
                        placeholder="Add your thoughts..."
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: '0.4rem' }}>Reminder</label>
                    <input
                        type="datetime-local"
                        value={reminder ? new Date(new Date(reminder).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setReminder(e.target.value)}
                        className="input-field"
                        style={{ height: '44px', padding: '0 1rem', fontSize: '0.9rem', width: '100%' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button onClick={onClose} className="btn-outline" style={{ flex: 1, height: '48px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>Cancel</button>
                    <button onClick={() => onSave({ title, content, user_note: userNote, reminder_at: reminder })} className="btn-primary" style={{ flex: 1, height: '48px' }}>Save Changes</button>
                </div>
            </div>
        </div>
    )
}

function ItemRow({ item, toggleStatus, deleteItem, togglePin, updateItem, onEdit, index }) {
    const isNote = !item.content || !item.content.includes('://')
    const isDone = item.status === 'done'

    // Reminder State
    const [showReminderPicker, setShowReminderPicker] = useState(false)

    const handleRowClick = (e) => {
        // If clicking input/button, ignore
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'TEXTAREA') return;

        if (!isNote) {
            // Open link
            window.open(item.content, '_blank')
        }
    }

    // Domain helper
    const getDomain = (url) => {
        try { return new URL(url).hostname.replace('www.', '') } catch { return 'link' }
    }

    // Save reminder
    const setReminder = (isoDate) => {
        updateItem(item.id, { reminder_at: isoDate })
        setShowReminderPicker(false)
    }

    return (
        <div
            onClick={handleRowClick}
            className={`item-card animate-enter ${isDone ? 'done' : ''}`}
            style={{
                animationDelay: `${index * 50}ms`,
                borderLeft: item.is_pinned ? '4px solid var(--color-primary)' : '1px solid var(--color-border)',
            }}
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
                        lineHeight: 1.4,
                        wordBreak: 'break-word'
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

                {/* Metadata Row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-tertiary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {!isNote && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <LinkIcon size={12} />
                            <span style={{ color: 'var(--color-primary)' }}>{getDomain(item.content)}</span>
                        </div>
                    )}
                    {isNote && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <FileText size={12} />
                            <span>Note</span>
                        </div>
                    )}

                    {/* Reminder Badge */}
                    {item.reminder_at && (
                        <span className="pill" style={{
                            background: new Date(item.reminder_at) < new Date() ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: new Date(item.reminder_at) < new Date() ? '#EF4444' : '#F59E0B',
                            border: `1px solid ${new Date(item.reminder_at) < new Date() ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                            display: 'flex', alignItems: 'center', gap: '4px'
                        }}>
                            <Calendar size={10} />
                            {new Date(item.reminder_at) < new Date() && 'Overdue: '}
                            {new Date(item.reminder_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    )}
                </div>

                {/* User Note Display */}
                {item.user_note && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '6px' }}>
                        {item.user_note}
                    </div>
                )}
            </div>

            {/* Hover Actions */}
            <div onClick={(e) => e.stopPropagation()} className="row-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>

                {/* Reminder Action */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowReminderPicker(!showReminderPicker)}
                        className="btn-icon delete-action"
                        style={{ color: item.reminder_at ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
                    >
                        <Calendar size={18} />
                    </button>

                    {showReminderPicker && (
                        <div className="glass" style={{
                            position: 'absolute',
                            bottom: '100%',
                            right: 0,
                            padding: '1rem',
                            borderRadius: '12px',
                            marginBottom: '0.5rem',
                            zIndex: 50,
                            boxShadow: 'var(--shadow-lg)',
                            minWidth: '200px'
                        }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Set Reminder</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <button onClick={() => setReminder(new Date(Date.now() + 86400000).toISOString())} className="btn-outline" style={{ justifyContent: 'flex-start', fontSize: '0.8rem' }}>Tomorrow</button>
                                <button onClick={() => setReminder(new Date(Date.now() + 604800000).toISOString())} className="btn-outline" style={{ justifyContent: 'flex-start', fontSize: '0.8rem' }}>Next Week</button>
                                <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.25rem 0' }}></div>
                                <input
                                    type="datetime-local"
                                    className="input-field"
                                    style={{ height: '36px', fontSize: '0.8rem', padding: '0 0.5rem' }}
                                    onChange={(e) => setReminder(new Date(e.target.value).toISOString())}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={onEdit}
                    className="btn-icon"
                    style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: 600, width: 'auto', padding: '0 0.5rem' }}
                    title="Edit"
                >
                    Edit
                </button>
                <button
                    onClick={() => deleteItem(item.id)}
                    className="btn-icon delete-action"
                    style={{ color: '#EF4444' }}
                >
                    <Trash2 size={18} />
                </button>
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
                    .status-btn { width: 28px; height: 28px; }
                }
            `}</style>
        </div>
    )
}
