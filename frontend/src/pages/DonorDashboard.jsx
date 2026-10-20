import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Droplet, ShieldCheck, HeartHandshake, History, Package,
    ChevronRight, Calendar, CheckCircle2, AlertCircle, TrendingUp,
    UserCircle2, Weight,
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';

const ROSE = '#be123c';

const monthLabel = (ym) => {
    const [y, m] = ym.split('-');
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleString('en-US', { month: 'short' });
};

const DonorDashboard = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await dashboardService.getDonor();
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
        { to: '/donor/profile',         title: 'My Profile',          desc: 'View and update your information', icon: UserCircle2, accent: 'rose' },
        { to: '/donor/eligibility',     title: 'Eligibility Status',  desc: 'Check if you can donate',           icon: ShieldCheck, accent: 'emerald' },
        { to: '/donor/record-donation', title: 'Record Donation',     desc: 'Log a new donation',                icon: HeartHandshake, accent: 'rose' },
        { to: '/donor/donations',       title: 'Donation History',    desc: 'See all your past donations',       icon: History, accent: 'sky' },
        { to: '/donor/availability',    title: 'Blood Availability',  desc: 'See current stock levels',          icon: Package, accent: 'amber' },
    ];

    const accentClass = (a) => {
        switch (a) {
            case 'emerald': return { bg: 'bg-emerald-50', text: 'text-emerald-700', hoverBg: 'group-hover:bg-emerald-600' };
            case 'sky':     return { bg: 'bg-sky-50',     text: 'text-sky-700',     hoverBg: 'group-hover:bg-sky-600' };
            case 'amber':   return { bg: 'bg-amber-50',   text: 'text-amber-700',   hoverBg: 'group-hover:bg-amber-600' };
            default:        return { bg: 'bg-rose-50',    text: 'text-rose-700',    hoverBg: 'group-hover:bg-rose-700' };
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

    const { donor, totals, recent_donations, monthly_donations } = data;
    const isEligible = donor.eligible;

    const monthlyChart = monthly_donations.map(m => ({
        month: monthLabel(m.month),
        units: m.units,
    }));

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Hero card */}
                <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8 border-t-4 border-rose-700 mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-rose-700 text-white flex items-center justify-center text-3xl sm:text-4xl font-bold shadow-md shrink-0">
                            {donor.blood_group}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm text-slate-500">Welcome back,</p>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
                                {donor.name} 🩸
                            </h1>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                                    isEligible
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                    {isEligible ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                    {isEligible ? 'Eligible to donate' : 'Not eligible yet'}
                                </span>
                                {!isEligible && donor.next_eligible_date && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Next: {new Date(donor.next_eligible_date).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <StatTile icon={HeartHandshake} label="Total Donations" value={totals.donations} tint="bg-rose-50 text-rose-700" />
                    <StatTile icon={Droplet} label="Units Donated" value={totals.units} tint="bg-emerald-50 text-emerald-700" />
                    <StatTile icon={UserCircle2} label="Age" value={`${donor.age} yrs`} tint="bg-sky-50 text-sky-700" />
                    <StatTile icon={Weight} label="Weight" value={`${donor.weight} kg`} tint="bg-violet-50 text-violet-700" />
                </div>

                {/* Middle row: chart + recent donations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                    {/* Chart */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-rose-700" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">My Donations (last 6 months)</h2>
                        </div>
                        {monthlyChart.length === 0 ? (
                            <div className="h-56 flex items-center justify-center text-sm text-slate-500">
                                No donations in the last 6 months.
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
                                            formatter={(v) => [`${v} units`, 'Donated']}
                                        />
                                        <Bar dataKey="units" fill={ROSE} radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Recent donations */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <History className="w-5 h-5 text-rose-700" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">Recent Donations</h2>
                        </div>
                        {recent_donations.length === 0 ? (
                            <p className="text-sm text-slate-500 py-4 text-center">No donations yet.</p>
                        ) : (
                            <ul className="space-y-2">
                                {recent_donations.map(d => (
                                    <li key={d.id}
                                        className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900">
                                                {d.units_collected} unit{d.units_collected > 1 ? 's' : ''} · {d.blood_group}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {new Date(d.donation_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <StatusBadge status={d.status} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Quick cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {cards.map(c => {
                        const Icon = c.icon;
                        const a = accentClass(c.accent);
                        return (
                            <Link key={c.to} to={c.to}
                                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 hover:border-rose-300 hover:shadow-md transition-all group">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className={`w-11 h-11 rounded-xl ${a.bg} flex items-center justify-center ${a.hoverBg} transition-colors shrink-0`}>
                                            <Icon className={`w-5 h-5 ${a.text} group-hover:text-white transition-colors`} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-base sm:text-lg font-semibold text-slate-800">{c.title}</h3>
                                            <p className="text-sm text-slate-600 mt-0.5">{c.desc}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-rose-700 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                                </div>
                            </Link>
                        );
                    })}
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
        AVAILABLE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        USED: 'bg-sky-50 text-sky-700 border border-sky-200',
        EXPIRED: 'bg-slate-100 text-slate-700 border border-slate-200',
        DISCARDED: 'bg-red-50 text-red-700 border border-red-200',
    };
    return (
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${map[status] || 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
            {status}
        </span>
    );
};

export default DonorDashboard;