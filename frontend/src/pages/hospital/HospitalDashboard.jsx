import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Building2, Package, Droplet, ClipboardList, Siren,
    ChevronRight, TrendingUp, CheckCircle2, AlertTriangle,
    Clock, Calendar, MapPin,
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';

const ROSE = '#be123c';
const SKY = '#0284c7';

const monthLabel = (ym) => {
    const [y, m] = ym.split('-');
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleString('en-US', { month: 'short' });
};

const HospitalDashboard = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await dashboardService.getHospital();
                setData(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const cards = [
        { to: '/hospital/profile',      title: 'Hospital Profile',    desc: 'View and update your hospital info', icon: Building2, accent: 'rose' },
        { to: '/hospital/availability', title: 'Blood Availability',  desc: 'Check current stock levels',         icon: Package, accent: 'sky' },
        { to: '/hospital/request',      title: 'Create Request',      desc: 'Request blood units (normal)',       icon: Droplet, accent: 'rose' },
        { to: '/hospital/requests',     title: 'My Requests',         desc: 'Track all your requests',            icon: ClipboardList, accent: 'amber' },
    ];

    const accentClass = (a) => {
        switch (a) {
            case 'sky':   return { bg: 'bg-sky-50',   text: 'text-sky-700',   hoverBg: 'group-hover:bg-sky-600' };
            case 'amber': return { bg: 'bg-amber-50', text: 'text-amber-700', hoverBg: 'group-hover:bg-amber-600' };
            default:      return { bg: 'bg-rose-50',  text: 'text-rose-700',  hoverBg: 'group-hover:bg-rose-700' };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="text-center">
                    <Droplet className="w-14 h-14 text-rose-700 animate-pulse mx-auto" fill="currentColor" />
                    <p className="text-rose-700 text-base sm:text-lg mt-4 font-semibold">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <p className="text-red-600 text-center">{error || 'Dashboard unavailable'}</p>
            </div>
        );
    }

    const { hospital, counts, availability, recent_requests, monthly_requests } = data;

    const monthlyChart = monthly_requests.map(m => ({
        month: monthLabel(m.month),
        requests: m.requests,
    }));

    const availabilityChart = availability.map(a => ({
        name: a.blood_group,
        units: a.units,
    }));

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Emergency CTA */}
                <Link to="/hospital/emergency-request"
                    className="block bg-red-600 text-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6 hover:bg-red-700 transition-colors group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            <Siren className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg sm:text-xl font-bold">Emergency Blood Request</h2>
                            <p className="text-sm opacity-90 mt-0.5">
                                For life-threatening situations. Admins are alerted instantly.
                            </p>
                        </div>
                        <ChevronRight className="w-6 h-6 hidden sm:block group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </Link>

                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border-t-4 border-rose-700 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-rose-700 flex items-center justify-center shadow-sm">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{hospital.name}</h1>
                                <p className="text-sm sm:text-base text-slate-600 mt-0.5 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {hospital.city || '—'}
                                    <span className="text-slate-400">•</span>
                                    Welcome back, <span className="font-semibold text-slate-800">{user?.name}</span>! 🏥
                                </p>
                            </div>
                        </div>
                        <span className="self-start sm:self-auto px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs sm:text-sm font-semibold">
                            {hospital.status}
                        </span>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
                    <StatTile icon={ClipboardList} label="Total Requests" value={counts.total}     tint="bg-rose-50 text-rose-700" />
                    <StatTile icon={Clock}         label="Pending"        value={counts.PENDING}   tint="bg-amber-50 text-amber-700" />
                    <StatTile icon={CheckCircle2}  label="Approved"       value={counts.APPROVED}  tint="bg-sky-50 text-sky-700" />
                    <StatTile icon={Package}       label="Completed"      value={counts.COMPLETED} tint="bg-emerald-50 text-emerald-700" />
                    <StatTile icon={AlertTriangle} label="Emergency"      value={counts.emergency} tint="bg-red-50 text-red-700" />
                </div>

                {/* Middle row: availability chart + monthly requests chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                    {/* Blood availability chart */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Droplet className="w-5 h-5 text-rose-700" fill="currentColor" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">Blood Availability</h2>
                        </div>
                        <div className="w-full h-56 sm:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={availabilityChart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                                        formatter={(v) => [`${v} units`, 'Available']}
                                    />
                                    <Bar dataKey="units" fill={ROSE} radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Monthly requests */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-rose-700" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">My Requests (last 6 months)</h2>
                        </div>
                        {monthlyChart.length === 0 ? (
                            <div className="h-56 flex items-center justify-center text-sm text-slate-500">
                                No requests yet.
                            </div>
                        ) : (
                            <div className="w-full h-56 sm:h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyChart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                                            formatter={(v) => [`${v}`, 'Requests']}
                                        />
                                        <Bar dataKey="requests" fill={SKY} radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent requests + quick cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Recent requests */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-rose-700" />
                                <h2 className="text-base sm:text-lg font-bold text-slate-900">Recent Requests</h2>
                            </div>
                            <Link to="/hospital/requests" className="text-xs sm:text-sm font-medium text-rose-700 hover:text-rose-800">
                                View all →
                            </Link>
                        </div>
                        {recent_requests.length === 0 ? (
                            <p className="text-sm text-slate-500 py-4 text-center">No requests yet.</p>
                        ) : (
                            <ul className="space-y-2">
                                {recent_requests.map(r => (
                                    <li key={r.id}
                                        className={`flex items-center justify-between gap-3 rounded-xl p-3 border ${
                                            r.request_type === 'EMERGENCY'
                                                ? 'bg-red-50 border-red-200'
                                                : 'bg-slate-50 border-slate-200'
                                        }`}>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                                                {r.request_type === 'EMERGENCY' && <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
                                                {r.units_requested} units · {r.blood_group}
                                            </p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(r.requested_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <StatusBadge status={r.status} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Quick cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {cards.map(c => {
                            const Icon = c.icon;
                            const a = accentClass(c.accent);
                            return (
                                <Link key={c.to} to={c.to}
                                    className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:border-rose-300 hover:shadow-md transition-all group">
                                    <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center ${a.hoverBg} transition-colors mb-3`}>
                                        <Icon className={`w-5 h-5 ${a.text} group-hover:text-white transition-colors`} />
                                    </div>
                                    <h3 className="text-sm sm:text-base font-semibold text-slate-800">{c.title}</h3>
                                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{c.desc}</p>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatTile = ({ icon: Icon, label, value, tint }) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tint}`}>
            <Icon className="w-4 h-4" />
        </div>
        <p className="text-[11px] sm:text-xs font-medium text-slate-600 mt-2">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
    </div>
);

const StatusBadge = ({ status }) => {
    const map = {
        PENDING:   'bg-amber-50 text-amber-800 border border-amber-200',
        APPROVED:  'bg-sky-50 text-sky-700 border border-sky-200',
        ISSUED:    'bg-violet-50 text-violet-700 border border-violet-200',
        COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        REJECTED:  'bg-red-50 text-red-700 border border-red-200',
        CANCELLED: 'bg-slate-100 text-slate-700 border border-slate-200',
    };
    return (
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${map[status] || 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
            {status}
        </span>
    );
};

export default HospitalDashboard;