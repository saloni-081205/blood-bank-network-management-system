import React, { useEffect, useState } from 'react';
import {
    Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, AlertCircle,
} from 'lucide-react';
import { notificationService } from '../services/notificationService';

const Notifications = () => {
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            setLoading(true);
            const res = await notificationService.getAll({ limit: 100 });
            setItems(res.data.notifications);
            setUnread(res.data.unread_count);
        } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const typeAccent = (t) => {
        switch (t) {
            case 'SUCCESS': return { border: 'border-l-4 border-emerald-500', bg: 'bg-emerald-50/60', icon: CheckCircle2, iconColor: 'text-emerald-600' };
            case 'WARNING': return { border: 'border-l-4 border-amber-500',   bg: 'bg-amber-50/60',   icon: AlertTriangle, iconColor: 'text-amber-600' };
            case 'ERROR':   return { border: 'border-l-4 border-red-600',     bg: 'bg-red-50/60',     icon: AlertCircle,   iconColor: 'text-red-600' };
            default:        return { border: 'border-l-4 border-sky-500',     bg: 'bg-sky-50/60',     icon: Info,          iconColor: 'text-sky-600' };
        }
    };

    const handleMarkRead = async (id) => {
        await notificationService.markAsRead(id);
        load();
    };

    const handleMarkAll = async () => {
        await notificationService.markAllAsRead();
        load();
    };

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-rose-700 flex items-center justify-center shadow-sm">
                            <Bell className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Notifications</h1>
                            <p className="text-sm sm:text-base text-slate-600 mt-0.5">
                                {unread > 0 ? `${unread} unread` : 'All caught up'}
                            </p>
                        </div>
                    </div>
                    {unread > 0 && (
                        <button onClick={handleMarkAll}
                            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-rose-700 text-white rounded-lg hover:bg-rose-800 text-sm font-semibold shadow-sm">
                            <CheckCheck className="w-4 h-4" />
                            Mark All Read
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-xl border-t-4 border-rose-700 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <Bell className="w-10 h-10 text-rose-700 animate-pulse mx-auto" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="p-10 text-center">
                            <Bell className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">No notifications yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {items.map(n => {
                                const a = typeAccent(n.type);
                                const Icon = a.icon;
                                return (
                                    <div key={n.id}
                                        className={`px-4 sm:px-6 py-4 ${!n.is_read ? `${a.border} ${a.bg}` : ''}`}>
                                        <div className="flex items-start gap-3">
                                            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${a.iconColor}`} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className={`text-sm sm:text-base ${!n.is_read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                                                            {n.title}
                                                        </p>
                                                        <p className="text-xs sm:text-sm text-slate-600 mt-1">{n.message}</p>
                                                        <p className="text-[11px] text-slate-400 mt-1.5">
                                                            {new Date(n.created_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    {!n.is_read && (
                                                        <button onClick={() => handleMarkRead(n.id)}
                                                            className="shrink-0 px-3 py-1.5 text-xs font-medium text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-50">
                                                            Mark read
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;