import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Users, Building2, Package, ClipboardList, AlertTriangle,
    Droplet, UserRound, ChevronRight, RefreshCw, TrendingUp,
    Activity, Calendar, CheckCircle2, Clock,
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
    LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { requestService } from '../services/requestService';

const BLOOD_COLORS = {
    'A+': '#e11d48', 'A-': '#fb7185',
    'B+': '#0284c7', 'B-': '#38bdf8',
    'AB+': '#7c3aed', 'AB-': '#a78bfa',
    'O+': '#059669', 'O-': '#34d399',
};
const STATUS_COLORS = {
    PENDING: '#f59e0b', APPROVED: '#0284c7', ISSUED: '#7c3aed',
    COMPLETED: '#059669', REJECTED: '#dc2626', CANCELLED: '#64748b',
};
const ROSE = '#be123c';
const SKY = '#0284c7';

const monthLabel = (ym) => {
    // ym = '2026-08'
    const [y, m] = ym.split('-');
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleString('en-US', { month: 'short' });
};

const AdminDashboard = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [emergencyCount, setEmergencyCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const load = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);
            setError('');
            const [dashRes, emRes] = await Promise.all([
                dashboardService.getAdmin(),
                requestService.getEmergencyQueue().catch(() => ({ data: { pending: 0 } })),
            ]);
            setData(dashRes.data);
            setEmergencyCount(emRes.data.pending || 0);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        load();
        const t = setInterval(() => load(true), 60000);
        return () => clearInterval(t);
    }, []);

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

    const { stats, distribution, monthly_donations, monthly_requests, status_breakdown, low_stock } = data;

    // Chart data prep
    const distributionData = distribution.map(d => ({
        name: d.blood_group,
        units: d.units,
        fill: BLOOD_COLORS[d.blood_group] || ROSE,
    }));

    const monthlyChart = monthly_donations.map((m, i) => ({
        month: monthLabel(m.month),
        donations: m.donations,
        units: m.units,
        requests: monthly_requests[i]?.requests || 0,
    }));
    // If donation and request months differ, still render distinct datasets

    const statusData = status_breakdown.map(s => ({
        name: s.status,
        value: s.count,
        fill: STATUS_COLORS[s.status] || '#94a3b8',
    }));

    const statsTiles = [
        { label: 'Total Donors',        value: stats.total_donors,         icon: UserRound,   tint: 'bg-rose-50 text-rose-700' },
        { label: 'Active Hospitals',    value: stats.hospitals_active,     icon: Building2,   tint: 'bg-sky-50 text-sky-700' },
        { label: 'Blood Units',         value: stats.total_units,          icon: Droplet,     tint: 'bg-emerald-50 text-emerald-700' },
        { label: 'Pending Requests',    value: stats.pending_requests,     icon: ClipboardList, tint: 'bg-amber-50 text-amber-700' },
        { label: 'Emergency Open',      value: stats.emergency_open,       icon: AlertTriangle, tint: 'bg-red-50 text-red-700' },
        { label: "Today's Donations",   value: stats.todays_donations,     icon: Calendar,    tint: 'bg-violet-50 text-violet-700' },
    ];

    const links = [
        { to: '/admin/donors',    label: 'Manage Donors',    icon: Users },
        { to: '/admin/donations', label: 'Manage Donations', icon: Droplet },
        { to: '/admin/inventory', label: 'Blood Inventory',  icon: Package },
        { to: '/admin/hospitals', label: 'Manage Hospitals', icon: Building2 },
        { to: '/admin/requests',  label: 'Blood Requests',   icon: ClipboardList },
        { to: '/admin/emergency', label: 'Emergency Queue',  icon: AlertTriangle, accent: 'red' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Emergency banner */}
                {emergencyCount > 0 && (
                    <Link to="/admin/emergency"
                        className="block bg-red-600 text-white rounded-2xl shadow-xl p-4 sm:p-5 mb-6 hover:bg-red-700 transition-colors animate-[pulse_2s_ease-in-out_infinite]">
                        <div className="flex items-center gap-4">
                            <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <h2 className="text-base sm:text-xl font-bold">
                                    {emergencyCount} Emergency Request{emergencyCount === 1 ? '' : 's'} Pending
                                </h2>
                                <p className="text-xs sm:text-sm opacity-90 mt-0.5">Tap to review immediately.</p>
                            </div>
                            <ChevronRight className="w-6 h-6 shrink-0" />
                        </div>
                    </Link>
                )}

                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border-t-4 border-rose-700 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-rose-700 flex items-center justify-center shadow-sm">
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                                <p className="text-sm sm:text-base text-slate-600 mt-0.5">
                                    Welcome back, <span className="font-semibold text-slate-800">{user?.name}</span>
                                </p>
                            </div>
                        </div>
                        <button onClick={() => load(true)} disabled={refreshing}
                            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium disabled:opacity-50">
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
                    {statsTiles.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.tint}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <p className="text-[11px] sm:text-xs font-medium text-slate-600 mt-2">{s.label}</p>
                                <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{s.value}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Low stock alert */}
                {low_stock.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-900">Low Stock Alert</p>
                            <p className="text-xs sm:text-sm text-amber-800 mt-1">
                                {low_stock.map(l => `${l.blood_group} (${l.units_available})`).join('  •  ')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Charts — row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                    {/* Blood group distribution */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Droplet className="w-5 h-5 text-rose-700" fill="currentColor" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">Blood Group Distribution</h2>
                        </div>
                        <div className="w-full h-64 sm:h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={distributionData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                                        formatter={(v) => [`${v} units`, 'Units']}
                                    />
                                    <Bar dataKey="units" radius={[6, 6, 0, 0]}>
                                        {distributionData.map((d, i) => (
                                            <Cell key={i} fill={d.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Request status pie */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <ClipboardList className="w-5 h-5 text-rose-700" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">Request Status Breakdown</h2>
                        </div>
                        {statusData.length === 0 ? (
                            <div className="h-64 sm:h-72 flex items-center justify-center text-sm text-slate-500">
                                No requests yet.
                            </div>
                        ) : (
                            <div className="w-full h-64 sm:h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius="75%"
                                            innerRadius="45%"
                                            paddingAngle={2}
                                        >
                                            {statusData.map((d, i) => (
                                                <Cell key={i} fill={d.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>

                {/* Charts — row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                    {/* Monthly donations line */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-rose-700" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">Monthly Donations (last 6 months)</h2>
                        </div>
                        {monthlyChart.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-sm text-slate-500">
                                No donations yet.
                            </div>
                        ) : (
                            <div className="w-full h-64 sm:h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyChart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                        <Line type="monotone" dataKey="units" stroke={ROSE} strokeWidth={3} dot={{ r: 4, fill: ROSE }} name="Units Donated" />
                                        <Line type="monotone" dataKey="requests" stroke={SKY} strokeWidth={3} dot={{ r: 4, fill: SKY }} name="Requests" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Quick links */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 className="w-5 h-5 text-rose-700" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">Quick Actions</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {links.map(l => {
                                const Icon = l.icon;
                                const isEmergency = l.accent === 'red';
                                return (
                                    <Link key={l.to} to={l.to}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors text-sm text-white shadow-sm group ${
                                            isEmergency ? 'bg-red-600 hover:bg-red-700' : 'bg-rose-700 hover:bg-rose-800'
                                        }`}>
                                        <Icon className="w-4 h-4 shrink-0" />
                                        <span className="flex-1">{l.label}</span>
                                        <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;