import React, { useEffect, useState } from 'react';
import {
    AlertTriangle, Siren, RefreshCw, CheckCircle2, ShieldAlert,
    Droplet, Hash, Clock, Building2, MapPin, ChevronRight, Package,
} from 'lucide-react';
import { requestService } from '../../services/requestService';
import { RequestDetailModal } from '../hospital/RequestHistory';

const EmergencyQueue = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await requestService.getEmergencyQueue();
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load emergency queue');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action, id, payload) => {
        try {
            if (action === 'approve') await requestService.approve(id);
            else if (action === 'reject') await requestService.reject(id, payload?.reason);
            else if (action === 'issue') await requestService.issue(id);
            else if (action === 'complete') await requestService.complete(id);
            await load();
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
            throw err;
        }
    };

    const statusBadge = (s) => {
        switch (s) {
            case 'PENDING': return 'bg-amber-50 text-amber-800 border border-amber-200';
            case 'APPROVED': return 'bg-sky-50 text-sky-700 border border-sky-200';
            case 'ISSUED': return 'bg-violet-50 text-violet-700 border border-violet-200';
            default: return 'bg-slate-100 text-slate-700 border border-slate-200';
        }
    };

    const ageLabel = (minutes) => {
        if (minutes < 60) return `${minutes} min ago`;
        const h = Math.floor(minutes / 60);
        if (h < 24) return `${h} hr ago`;
        return `${Math.floor(h / 24)} d ago`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="text-center">
                    <Siren className="w-14 h-14 text-red-600 animate-pulse mx-auto" />
                    <p className="text-red-600 text-base sm:text-lg mt-4 font-semibold">Loading emergency queue...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <p className="text-red-600 text-center">{error}</p>
            </div>
        );
    }

    const { queue, pending, count } = data;

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Banner */}
                <div className={`mb-6 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center gap-4 text-white ${
                    pending > 0
                        ? 'bg-red-600 animate-[pulse_2s_ease-in-out_infinite]'
                        : 'bg-emerald-600'
                }`}>
                    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        {pending > 0 ? <Siren className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold">Emergency Queue</h1>
                        <p className="text-sm sm:text-base opacity-90 mt-0.5">
                            {pending > 0
                                ? `${pending} emergency request${pending === 1 ? '' : 's'} pending review.`
                                : 'No pending emergencies. All clear.'}
                        </p>
                    </div>
                    <button onClick={load}
                        className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-lg font-semibold text-sm shrink-0 ${
                            pending > 0
                                ? 'bg-white text-red-700 hover:bg-red-50'
                                : 'bg-white text-emerald-700 hover:bg-emerald-50'
                        }`}>
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {/* Empty state */}
                {queue.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-xl border-t-4 border-emerald-600 p-8 text-center">
                        <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
                        <h2 className="text-lg sm:text-xl font-bold text-slate-800 mt-3">
                            No active emergencies
                        </h2>
                        <p className="text-sm text-slate-600 mt-1">
                            The queue is empty. Well done. 🎉
                        </p>
                    </div>
                )}

                {/* Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                    {queue.map(r => (
                        <div key={r.id}
                            className="bg-white rounded-2xl shadow-lg border-l-4 border-red-600 overflow-hidden">
                            {/* Header */}
                            <div className="bg-red-50 px-4 sm:px-5 py-3 flex items-start justify-between gap-3 border-b border-red-100">
                                <div className="min-w-0">
                                    <p className="text-xs text-slate-600 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3 text-red-600" />
                                        Request #{r.id}
                                    </p>
                                    <p className="font-semibold text-slate-900 truncate flex items-center gap-1.5 mt-0.5">
                                        <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                                        {r.hospital_name}
                                    </p>
                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                        <MapPin className="w-3 h-3" />
                                        {r.city || '—'}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(r.status)}`}>
                                        {r.status}
                                    </span>
                                    <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-end gap-1">
                                        <Clock className="w-3 h-3" />
                                        {ageLabel(r.minutes_open)}
                                    </p>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-4 sm:p-5 space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-bold flex items-center gap-1">
                                        <Droplet className="w-3.5 h-3.5" fill="white" />
                                        {r.blood_group}
                                    </span>
                                    <span className="text-sm text-slate-700 flex items-center gap-1">
                                        <Hash className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="font-semibold">{r.units_requested}</span> units needed
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                        r.urgency === 'CRITICAL'
                                            ? 'bg-red-700 text-white'
                                            : r.urgency === 'HIGH'
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-slate-100 text-slate-700'
                                    }`}>
                                        {r.urgency}
                                    </span>
                                </div>

                                {/* Stock comparison */}
                                <div className={`rounded-lg p-3 text-sm border flex items-start gap-2 ${
                                    r.stock_sufficient
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                        : 'bg-red-50 border-red-200 text-red-800'
                                }`}>
                                    {r.stock_sufficient
                                        ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                                        : <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-semibold">
                                                {r.stock_sufficient ? 'Stock available' : 'Insufficient stock'}
                                            </span>
                                            <span className="text-xs">
                                                {r.units_available} available / {r.units_requested} needed
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {r.reason && (
                                    <p className="text-xs text-slate-600 whitespace-pre-line line-clamp-3">
                                        {r.reason}
                                    </p>
                                )}

                                <button onClick={() => setSelected(r)}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm shadow-sm">
                                    Manage Request
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selected && (
                <RequestDetailModal
                    requestId={selected.id}
                    onClose={() => setSelected(null)}
                    role="ADMIN"
                    onAction={handleAction}
                />
            )}
        </div>
    );
};

export default EmergencyQueue;