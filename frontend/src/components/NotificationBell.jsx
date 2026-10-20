import React, { useEffect, useRef, useState } from 'react';
import {
    Bell, CheckCheck, X, Info, CheckCircle2, AlertTriangle, AlertCircle,
} from 'lucide-react';
import { notificationService } from '../services/notificationService';

const NotificationBell = () => {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef(null);

    const load = async () => {
        try {
            setLoading(true);
            const res = await notificationService.getAll({ limit: 20 });
            setItems(res.data.notifications);
            setUnread(res.data.unread_count);
        } catch (_) { /* silent */ }
        finally { setLoading(false); }
    };

    const pollUnread = async () => {
        try {
            const res = await notificationService.getUnreadCount();
            setUnread(res.data.unread_count);
        } catch (_) { /* silent */ }
    };

    useEffect(() => {
        pollUnread();
        const t = setInterval(pollUnread, 30000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        const onClick = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        if (open) {
            document.addEventListener('mousedown', onClick);
            document.addEventListener('keydown', onKey);
        }
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const toggle = () => {
        if (!open) load();
        setOpen(o => !o);
    };

    const handleMarkRead = async (id) => {
        await notificationService.markAsRead(id);
        setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        setUnread(u => Math.max(u - 1, 0));
    };

    const handleMarkAll = async () => {
        await notificationService.markAllAsRead();
        setItems(prev => prev.map(n => ({ ...n, is_read: 1 })));
        setUnread(0);
    };

    const typeAccent = (t) => {
        switch (t) {
            case 'SUCCESS': return { border: 'border-l-4 border-emerald-500', bg: 'bg-emerald-50/60', icon: CheckCircle2, iconColor: 'text-emerald-600' };
            case 'WARNING': return { border: 'border-l-4 border-amber-500',   bg: 'bg-amber-50/60',   icon: AlertTriangle, iconColor: 'text-amber-600' };
            case 'ERROR':   return { border: 'border-l-4 border-red-600',     bg: 'bg-red-50/60',     icon: AlertCircle,   iconColor: 'text-red-600' };
            default:        return { border: 'border-l-4 border-sky-500',     bg: 'bg-sky-50/60',     icon: Info,          iconColor: 'text-sky-600' };
        }
    };

    const timeAgo = (iso) => {
        const d = new Date(iso);
        const diff = Math.floor((Date.now() - d.getTime()) / 1000);
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return d.toLocaleDateString();
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={toggle}
                className="relative p-2 rounded-lg text-rose-700 hover:bg-rose-50 focus:outline-none"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 bg-black/30 z-40 sm:hidden" onClick={() => setOpen(false)} />

                    <div className="
                        fixed sm:absolute left-0 right-0 sm:left-auto sm:right-0
                        top-16 sm:top-full sm:mt-2
                        bg-white border border-slate-200 sm:rounded-2xl shadow-2xl
                        z-50 w-full sm:w-96 max-h-[70vh] sm:max-h-96 overflow-hidden flex flex-col
                    ">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                            <div>
                                <p className="text-sm font-bold text-slate-900">Notifications</p>
                                <p className="text-xs text-slate-500">
                                    {unread > 0 ? `${unread} unread` : 'All caught up'}
                                </p>
                            </div>
                            {unread > 0 && (
                                <button onClick={handleMarkAll}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 hover:text-rose-800">
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto flex-1">
                            {loading ? (
                                <div className="p-6 text-center">
                                    <Bell className="w-6 h-6 text-rose-700 animate-pulse mx-auto" />
                                </div>
                            ) : items.length === 0 ? (
                                <div className="p-6 text-center">
                                    <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">No notifications yet.</p>
                                </div>
                            ) : (
                                items.map(n => {
                                    const a = typeAccent(n.type);
                                    const Icon = a.icon;
                                    return (
                                        <button
                                            key={n.id}
                                            onClick={() => !n.is_read && handleMarkRead(n.id)}
                                            className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                                                !n.is_read ? `${a.border} ${a.bg}` : ''
                                            }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${a.iconColor}`} />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className={`text-sm ${!n.is_read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                                                            {n.title}
                                                        </p>
                                                        {!n.is_read && (
                                                            <span className="w-2 h-2 rounded-full bg-red-600 shrink-0 mt-1.5"></span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                                                    <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;