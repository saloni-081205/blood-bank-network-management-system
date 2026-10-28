import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Droplet, HeartHandshake, Building2, ShieldCheck,
    ArrowRight, CheckCircle2, Siren, Users, Package,
    Clock, Activity, Sparkles, AlertTriangle, LogIn,
    UserPlus, Mail, MapPin, Phone,
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Landing = () => {
    const [stats, setStats] = useState({
        donors: 0,
        hospitals: 0,
        units: 0,
        emergencies: 0,
        loading: true,
    });

    // Best-effort public stats fetch — the endpoint /api/public/stats is added below.
    // If it fails, we fall back to zeros (page still renders fine).
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await axios.get(`${API_BASE}/public/stats`);
                if (!cancelled) {
                    setStats({
                        donors: res.data.donors ?? 0,
                        hospitals: res.data.hospitals ?? 0,
                        units: res.data.units ?? 0,
                        emergencies: res.data.emergencies ?? 0,
                        loading: false,
                    });
                }
            } catch (_) {
                if (!cancelled) setStats(s => ({ ...s, loading: false }));
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const roles = [
        {
            icon: HeartHandshake,
            title: 'For Donors',
            desc: 'Register once, check your eligibility, record donations, and track your life-saving history.',
            bullets: ['Eligibility check', 'Donation history', 'Personal dashboard'],
            accent: 'rose',
        },
        {
            icon: Building2,
            title: 'For Hospitals',
            desc: 'View live blood availability, submit normal or emergency requests, and track approvals.',
            bullets: ['Live inventory', 'Emergency requests', 'Request tracking'],
            accent: 'sky',
        },
        {
            icon: ShieldCheck,
            title: 'For Admins',
            desc: 'Verify hospitals, manage donors & inventory, and process requests within a safe transactional workflow.',
            bullets: ['Hospital verification', 'Inventory control', 'Request approval'],
            accent: 'emerald',
        },
    ];

    const features = [
        { icon: Activity,    title: 'Live Inventory',        desc: 'Real-time stock for all 8 blood groups, updated atomically with every donation and issue.' },
        { icon: Siren,       title: 'Emergency Priority',    desc: 'Emergency requests are visually flagged and sorted first for admins.' },
        { icon: ShieldCheck, title: 'Role-Based Access',     desc: 'JWT + role middleware ensures donors, hospitals, and admins only see what they should.' },
        { icon: Clock,       title: 'Expiry Tracking',       desc: 'Every donation auto-expires after 42 days. Expired units can never be issued.' },
        { icon: Package,     title: 'Transactional Safety',  desc: 'Row-level locking prevents double-issuance even under concurrent admin actions.' },
        { icon: Sparkles,    title: 'Reports & Charts',      desc: 'Admin dashboards with real aggregates, blood-group charts, and monthly trends.' },
    ];

    const accentClasses = (a) => {
        switch (a) {
            case 'sky':     return { bg: 'bg-sky-50',     text: 'text-sky-700',     ring: 'ring-sky-100' };
            case 'emerald': return { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-100' };
            default:        return { bg: 'bg-rose-50',    text: 'text-rose-700',    ring: 'ring-rose-100' };
        }
    };

    const statTiles = [
        { label: 'Registered Donors',       value: stats.donors,     icon: Users,         tint: 'bg-rose-50 text-rose-700' },
        { label: 'Verified Hospitals',      value: stats.hospitals,  icon: Building2,     tint: 'bg-sky-50 text-sky-700' },
        { label: 'Blood Units in Stock',    value: stats.units,      icon: Droplet,       tint: 'bg-emerald-50 text-emerald-700' },
        { label: 'Open Emergencies',        value: stats.emergencies, icon: AlertTriangle, tint: 'bg-red-50 text-red-700' },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* ================= HERO ================= */}
            <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
                {/* Background blobs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-rose-100 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-100 rounded-full blur-3xl opacity-30 translate-y-1/2 -translate-x-1/3"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-28">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                        {/* Left: text */}
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs sm:text-sm font-semibold mb-5">
                                <Droplet className="w-3.5 h-3.5" fill="currentColor" />
                                Blood Bank Network Management
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-slate-900 leading-tight">
                                Every drop saves a life.
                                <span className="block text-rose-700 mt-1">Every second counts.</span>
                            </h1>

                            <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                                A complete platform that connects <span className="font-semibold text-slate-800">donors</span>,{' '}
                                <span className="font-semibold text-slate-800">hospitals</span>, and{' '}
                                <span className="font-semibold text-slate-800">blood banks</span> in real time — so blood is always
                                where it needs to be, exactly when it needs to be there.
                            </p>

                            <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                <Link
                                    to="/register"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-rose-700 text-white rounded-lg hover:bg-rose-800 font-semibold text-sm sm:text-base shadow-md transition-colors"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Get Started
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-800 border-2 border-slate-200 rounded-lg hover:border-rose-300 hover:bg-rose-50 font-semibold text-sm sm:text-base transition-colors"
                                >
                                    <LogIn className="w-4 h-4" />
                                    Sign In
                                </Link>
                            </div>

                            {/* Trust bullets */}
                            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                                <span className="inline-flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    Free forever
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    Role-based access
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    Real-time data
                                </span>
                            </div>
                        </div>

                        {/* Right: hero visual */}
                        <div className="relative">
                            <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8">
                                {/* Header */}
                                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-xl bg-rose-700 flex items-center justify-center shadow-sm">
                                            <Droplet className="w-5 h-5 text-white" fill="white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Blood Inventory</p>
                                            <p className="text-xs text-slate-500">Live snapshot</p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        LIVE
                                    </span>
                                </div>

                                {/* Mini blood grid */}
                                <div className="grid grid-cols-4 gap-2 mt-4">
                                    {[
                                        { g: 'A+', u: 25, lvl: 'ok' },
                                        { g: 'A-', u: 8, lvl: 'low' },
                                        { g: 'B+', u: 30, lvl: 'ok' },
                                        { g: 'B-', u: 5, lvl: 'crit' },
                                        { g: 'AB+', u: 12, lvl: 'ok' },
                                        { g: 'AB-', u: 3, lvl: 'crit' },
                                        { g: 'O+', u: 40, lvl: 'ok' },
                                        { g: 'O-', u: 4, lvl: 'crit' },
                                    ].map((b) => (
                                        <div key={b.g} className={`rounded-lg border p-2 text-center ${
                                            b.lvl === 'crit'
                                                ? 'bg-red-50 border-red-200'
                                                : b.lvl === 'low'
                                                    ? 'bg-amber-50 border-amber-200'
                                                    : 'bg-emerald-50 border-emerald-200'
                                        }`}>
                                            <p className="text-xs font-bold text-slate-900">{b.g}</p>
                                            <p className="text-[10px] text-slate-600 mt-0.5">{b.u}u</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Emergency banner in the hero card */}
                                <div className="mt-4 bg-red-600 text-white rounded-xl p-3 flex items-center gap-2">
                                    <Siren className="w-4 h-4 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold">Emergency request</p>
                                        <p className="text-[10px] opacity-90">O- · 4 units · ABC Hospital</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 shrink-0" />
                                </div>

                                <p className="text-[10px] text-slate-400 text-center mt-3">
                                    Demo preview — real data appears after login
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= LIVE STATS ================= */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="text-center mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                        Real numbers. Real impact.
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 mt-2">
                        Pulled live from the platform database
                    </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                    {statTiles.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.tint}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <p className="text-xs sm:text-sm font-medium text-slate-600 mt-3">{s.label}</p>
                                <p className="text-2xl sm:text-4xl font-bold text-slate-900 mt-1">
                                    {stats.loading ? '—' : s.value}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ================= ROLES ================= */}
            <section className="bg-white border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
                            Built for everyone in the chain
                        </h2>
                        <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl mx-auto">
                            Three roles. Three tailored experiences. One unified platform.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                        {roles.map((r) => {
                            const Icon = r.icon;
                            const a = accentClasses(r.accent);
                            return (
                                <div key={r.title}
                                    className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-rose-300 hover:shadow-lg transition-all">
                                    <div className={`w-12 h-12 rounded-xl ${a.bg} flex items-center justify-center ring-4 ${a.ring}`}>
                                        <Icon className={`w-6 h-6 ${a.text}`} />
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-4">{r.title}</h3>
                                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{r.desc}</p>
                                    <ul className="mt-4 space-y-1.5">
                                        {r.bullets.map(b => (
                                            <li key={b} className="flex items-center gap-2 text-sm text-slate-700">
                                                <CheckCircle2 className={`w-4 h-4 shrink-0 ${a.text}`} />
                                                {b}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ================= FEATURES ================= */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
                <div className="text-center mb-10">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
                        Built for reliability
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl mx-auto">
                        Not just CRUD — a system designed around the real risks of managing blood.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {features.map((f) => {
                        const Icon = f.icon;
                        return (
                            <div key={f.title}
                                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 hover:border-rose-300 hover:shadow-md transition-all">
                                <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                                    <Icon className="w-5 h-5 text-rose-700" />
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mt-3">{f.title}</h3>
                                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{f.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ================= EMERGENCY CTA ================= */}
            <section className="bg-red-600">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
                    <Siren className="w-12 h-12 sm:w-16 sm:h-16 text-white mx-auto mb-4" />
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                        When every second counts
                    </h2>
                    <p className="text-sm sm:text-base text-white/90 mt-3 max-w-2xl mx-auto">
                        Emergency requests are instantly flagged, prioritized, and routed to admins — so life-saving
                        action never waits behind paperwork.
                    </p>
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-white text-red-700 rounded-lg hover:bg-red-50 font-bold text-sm sm:text-base shadow-lg transition-colors"
                    >
                        Join the network
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* ================= FOOTER ================= */}
            <footer className="bg-slate-900 text-slate-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Brand */}
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-xl bg-rose-700 flex items-center justify-center">
                                    <Droplet className="w-5 h-5 text-white" fill="white" />
                                </div>
                                <span className="text-lg font-bold text-white">
                                    Blood<span className="text-rose-400">Bank</span>
                                </span>
                            </div>
                            <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                                A complete full-stack platform connecting donors, hospitals, and blood banks in real time.
                            </p>
                        </div>

                        {/* Links */}
                        <div>
                            <h4 className="text-sm font-semibold text-white mb-3">Quick Links</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/login" className="hover:text-rose-400 transition-colors">Sign In</Link></li>
                                <li><Link to="/register" className="hover:text-rose-400 transition-colors">Register</Link></li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="text-sm font-semibold text-white mb-3">Contact</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    support@bloodbank.local
                                </li>
                                <li className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    +91 99999 99999
                                </li>
                                <li className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    India
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 mt-8 pt-6 text-center text-xs text-slate-500">
                        © {new Date().getFullYear()} Blood Bank Network Management System. Built with ❤️ for life.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;