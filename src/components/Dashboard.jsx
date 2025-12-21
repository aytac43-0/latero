import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Check, Trash2, ArrowRight, Link as LinkIcon, FileText, Search as SearchIcon, X, Calendar, Settings as SettingsIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { saveItemHelper } from '../utils/supabaseHelpers'

export default function Dashboard() {
    const { user, profile } = useAuth()
    const navigate = useNavigate()
    const [newItemContent, setNewItemContent] = useState('')
    const [newItemReminder, setNewItemReminder] = useState('')
    const [showAddDetails, setShowAddDetails] = useState(false)
    const [toast, setToast] = useState(null)
    const [editingItem, setEditingItem] = useState(null)

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
        if (e) e.preventDefault()
        const content = newItemContent.trim()
        if (!content) return

        setAdding(true)
        try {
            const payload = {
                content,
                title: content.slice(0, 100),
                reminder_at: newItemReminder || null
            }

            await saveItemHelper(user, payload)
            setNewItemContent('')
            setNewItemReminder('')
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

    const filteredItems = items.filter(item => {
        const term = searchTerm.toLowerCase()
        return (item.title && item.title.toLowerCase().includes(term)) ||
            (item.content && item.content.toLowerCase().includes(term))
    })

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header className="glass" style={{ height: 'var(--header-height)', position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center' }}>
                <div className="container" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(245, 158, 11, 0.15))', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <img src="/logo.svg" alt="Latero" style={{ width: '24px', height: '24px' }} />
                        </div>
                        <h1 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 700 }} className="brand-text">Latero</h1>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className={`search-wrapper ${isSearchOpen ? 'open' : ''}`}>
                            <div style={{ position: 'relative' }}>
                                <SearchIcon size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: "translateY(-50%)", color: 'var(--color-text-tertiary)' }} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    ref={searchInputRef}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.4rem 0.5rem 0.4rem 2.2rem', color: 'var(--color-text)', fontSize: '0.9rem', width: isSearchOpen ? '200px' : '0px', opacity: isSearchOpen ? 1 : 0, transition: 'all 0.2s'
                                    }}
                                />
                            </div>
                        </div>
                        <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="btn-icon mobile-only">
                            {isSearchOpen ? <X size={20} /> : <SearchIcon size={20} />}
                        </button>
                        <button onClick={toggleTheme} className="btn-icon" title="Toggle Theme" style={{ fontSize: '1.2rem' }}>
                            {theme === 'dark' ? '🌙' : '☀️'}
                        </button>
                        <button onClick={() => navigate('/settings')} className="btn-icon" title="Settings">
                            <SettingsIcon size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="container" style={{ flex: 1, paddingTop: '3rem', paddingBottom: '6rem' }}>
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
                                    width: '100%', minHeight: showAddDetails ? '100px' : '40px', background: 'transparent', border: 'none', fontSize: '1.25rem', color: 'var(--color-text)', outline: 'none', resize: 'none', padding: '0.5rem 0'
                                }}
                            />
                            {showAddDetails && (
                                <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ position: 'relative' }}>
                                                <button type="button" className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem', borderRadius: '10px' }}>
                                                    <Calendar size={16} />
                                                    {newItemReminder ? new Date(newItemReminder).toLocaleDateString() : 'Set Reminder'}
                                                </button>
                                                <input type="datetime-local" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} onChange={(e) => setNewItemReminder(e.target.value)} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto' }}>
                                            <button onClick={() => { setShowAddDetails(false); setNewItemContent(''); setNewItemReminder(''); }} className="btn-ghost" style={{ fontSize: '0.9rem' }}>Cancel</button>
                                            <button onClick={addItem} className="btn-primary" disabled={adding || !newItemContent.trim()} style={{ padding: '0.5rem 2rem', height: '44px', fontWeight: 600 }}>
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

                {loading ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', marginTop: '4rem' }}>Loading...</div>
                ) : filteredItems.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', marginTop: '4rem' }}>{searchTerm ? 'No matches found.' : 'Latero remembers what you don\'t.'}</div>
                ) : (
                    <div className="card-grid">
                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            {filteredItems.map((item, index) => (
                                <ItemRow key={item.id} item={item} toggleStatus={toggleStatus} deleteItem={deleteItem} updateItem={updateItem} onEdit={() => setEditingItem(item)} index={index} />
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {editingItem && (
                <EditModal item={editingItem} onClose={() => setEditingItem(null)} onSave={(updates) => { updateItem(editingItem.id, updates); setEditingItem(null); }} />
            )}
            {toast && <div className="toast"> {toast.type === 'success' ? '✅' : '❌'} {toast.message} </div>}

            <style>{`
                .desktop-inline { display: inline; }
                .mobile-only { display: none; }
                @media (max-width: 640px) {
                    .desktop-inline { display: none; }
                    .mobile-only { display: flex; }
                    .brand-text { display: none; }
                    .search-wrapper { display: none; }
                    .search-wrapper.open { display: block; position: absolute; top: 80px; left: 0; right: 0; padding: 1rem; background: var(--color-bg); z-index: 90; }
                    .search-wrapper.open input { width: 100% !important; }
                }
                @media (min-width: 641px) { .search-wrapper input { width: 200px !important; opacity: 1 !important; } }
            `}</style>
        </div>
    )
}

function EditModal({ item, onClose, onSave }) {
    const [title, setTitle] = useState(item.title || '')
    const [content, setContent] = useState(item.content || '')
    const [reminder, setReminder] = useState(item.reminder_at || '')

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="card glass animate-enter" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3>Edit Item</h3>
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: '0.4rem' }}>Title</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" style={{ height: '48px', padding: '0 1rem', fontSize: '1rem', width: '100%' }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: '0.4rem' }}>Content / URL</label>
                    <input value={content} onChange={(e) => setContent(e.target.value)} className="input-field" style={{ height: '48px', padding: '0 1rem', fontSize: '1rem', width: '100%' }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: '0.4rem' }}>Reminder</label>
                    <input type="datetime-local" value={reminder ? new Date(new Date(reminder).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''} onChange={(e) => setReminder(e.target.value)} className="input-field" style={{ height: '44px', padding: '0 1rem', fontSize: '0.9rem', width: '100%' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button onClick={onClose} className="btn-outline" style={{ flex: 1, height: '48px' }}>Cancel</button>
                    <button onClick={() => onSave({ title, content, reminder_at: reminder })} className="btn-primary" style={{ flex: 1, height: '48px' }}>Save</button>
                </div>
            </div>
        </div>
    )
}

function ItemRow({ item, toggleStatus, deleteItem, updateItem, onEdit, index }) {
    const isDone = item.status === 'done'
    const [showReminderPicker, setShowReminderPicker] = useState(false)
    const setReminder = (isoDate) => { updateItem(item.id, { reminder_at: isoDate }); setShowReminderPicker(false); }

    return (
        <div className={`item-card animate-enter ${isDone ? 'done' : ''}`} style={{ animationDelay: `${index * 50}ms` }} onClick={() => { if (item.content?.includes('://')) window.open(item.content, '_blank') }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                <button onClick={() => toggleStatus(item.id, item.status)} className="action-btn status-btn" style={{ background: isDone ? '#10B981' : 'transparent', borderColor: isDone ? 'transparent' : '#64748B', color: 'white' }}>
                    {isDone && <Check size={14} />}
                </button>
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingLeft: '0.5rem' }}>
                <h4 style={{ fontSize: '1.125rem', fontWeight: 600, textDecoration: isDone ? 'line-through' : 'none', color: isDone ? '#64748B' : 'inherit', marginBottom: '0.25rem', lineHeight: 1.4, wordBreak: 'break-word' }}>
                    {item.title || item.content}
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', color: '#64748B', fontSize: '0.875rem' }}>
                    {item.content?.includes('://') ? <><LinkIcon size={12} /> <span style={{ color: 'var(--color-primary)' }}>{new URL(item.content).hostname.replace('www.', '')}</span></> : <><FileText size={12} /> <span>Note</span></>}
                    {item.reminder_at && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: new Date(item.reminder_at) < new Date() ? '#EF4444' : '#F59E0B' }}><Calendar size={10} /> {new Date(item.reminder_at).toLocaleDateString()}</span>}
                </div>
            </div>
            <div className="row-actions" style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                <div style={{ position: 'relative' }}>
                    <button onClick={() => setShowReminderPicker(!showReminderPicker)} className="btn-icon" style={{ color: item.reminder_at ? 'var(--color-primary)' : '#64748B' }}><Calendar size={18} /></button>
                    {showReminderPicker && (
                        <div className="glass" style={{ position: 'absolute', bottom: '100%', right: 0, padding: '1rem', borderRadius: '12px', zIndex: 50, minWidth: '200px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <button onClick={() => setReminder(new Date(Date.now() + 86400000).toISOString())} className="btn-outline" style={{ fontSize: '0.8rem' }}>Tomorrow</button>
                                <input type="datetime-local" onChange={(e) => setReminder(new Date(e.target.value).toISOString())} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--color-border)' }} />
                            </div>
                        </div>
                    )}
                </div>
                <button onClick={onEdit} className="btn-icon" style={{ color: '#64748B' }}>Edit</button>
                <button onClick={() => deleteItem(item.id)} className="btn-icon" style={{ color: '#EF4444' }}><Trash2 size={18} /></button>
            </div>
        </div>
    )
}
