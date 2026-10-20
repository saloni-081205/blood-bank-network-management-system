import React, { useEffect, useState } from 'react';
import {
    Search, Building2, Eye, CheckCircle2, XCircle, RotateCcw,
    X, AlertCircle, Mail, Phone, MapPin, FileBadge,
    ClipboardList, Clock, UserCircle2,
} from 'lucide-react';
import { hospitalService } from '../../services/hospitalService';

const HospitalManagement = () => {
    const [hospitals, setHospitals] = useState([]);
    const [cities, setCities] = useState([]);
    const [summary, setSummary] = useState({ total: 0, pending: 0, active: 0, inactive: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const [city, setCity] = useState('');
    const [status, setStatus] = useState('');

    const [selected, setSelected] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => { fetchCities(); }, []);
    useEffect(() => { fetchHospitals(); }, [search, city, status]);

    const fetchCities = async () => {
        try {
            const res = await hospitalService.getCities();
            setCities(res.data.cities);
        } catch (_) { /* silent */ }
    };

    const fetchHospitals = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await hospitalService.getAll({ search, city, status });
            setHospitals(res.data.hospitals);
            setSummary(res.data.summary);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load hospitals');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (hospital, newStatus) => {
        const labels = { ACTIVE: 'approve', INACTIVE: 'deactivate', PENDING: 'mark as pending' };
        if (!window.confirm(`Are you sure you want to ${labels[newStatus]} "${hospital.hospital_name}"?`)) return;

        try {
            setActionLoading(true);
            await hospitalService.updateStatus(hospital.id, newStatus);
            await fetchHospitals();
            if (selected && selected.id === hospital.id) {
                const res = await hospitalService.getById(hospital.id);
                setSelected(res.data.hospital);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Update failed');
        } finally {
            setActionLoading(false);
        }
    };

    const inputClass =
        'w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-rose-700';

    const searchClass =
        'w-full pl-9 pr-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-rose-700';

    const statusBadge = (s) => {
        switch (s) {
            case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case 'INACTIVE': return 'bg-red-50 text-red-700 border border-red-200';
            case 'PENDING': return 'bg-amber-50 text-amber-800 border border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border border-slate-200';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-rose-700 flex items-center justify-center shadow-sm">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Hospital Management</h1>
                        <p className="text-sm sm:text-base text-slate-600 mt-0.5">
                            Verify, view, and manage registered hospitals
                        </p>
                    </div>
                </div>

                {/* Summary tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <SummaryCard label="Total" value={summary.total} color="border-rose-200 bg-rose-50 text-rose-700" />
                    <SummaryCard label="Pending" value={summary.pending} color="border-amber-200 bg-amber-50 text-amber-800" />
                    <SummaryCard label="Active" value={summary.active} color="border-emerald-200 bg-emerald-50 text-emerald-700" />
                    <SummaryCard label="Inactive" value={summary.inactive} color="border-slate-200 bg-slate-50 text-slate-700" />
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-6 border-t-4 border-rose-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search name, email, license..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={searchClass}
                            />
                        </div>
                        <select value={city} onChange={(e) => setCity(e.target.value)} className={inputClass}>
                            <option value="">All Cities</option>
                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                            <option value="">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl shadow-xl border-t-4 border-rose-700 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <Building2 className="w-10 h-10 text-rose-700 animate-pulse mx-auto" />
                            <p className="text-rose-700 mt-3 text-sm font-medium">Loading hospitals...</p>
                        </div>
                    ) : error ? (
                        <div className="p-6 text-center text-red-600 text-sm flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    ) : hospitals.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">No hospitals found.</div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-rose-50">
                                        <tr>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Hospital</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">License</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">City</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Contact</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                                            <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {hospitals.map(h => (
                                            <tr key={h.id} className="hover:bg-rose-50/40">
                                                <td className="px-4 lg:px-6 py-3">
                                                    <p className="text-sm text-slate-900 font-medium">{h.hospital_name}</p>
                                                    <p className="text-xs text-slate-500">{h.email}</p>
                                                </td>
                                                <td className="px-4 lg:px-6 py-3 text-sm text-slate-700">{h.license_number}</td>
                                                <td className="px-4 lg:px-6 py-3 text-sm text-slate-700">{h.city || '—'}</td>
                                                <td className="px-4 lg:px-6 py-3 text-sm text-slate-700">{h.contact_number || h.phone}</td>
                                                <td className="px-4 lg:px-6 py-3">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(h.status)}`}>
                                                        {h.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 lg:px-6 py-3 text-right">
                                                    <div className="flex justify-end gap-2 flex-wrap">
                                                        <button onClick={() => setSelected(h)}
                                                            className="p-1.5 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-50"
                                                            title="View">
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                        {h.status === 'PENDING' && (
                                                            <button onClick={() => updateStatus(h, 'ACTIVE')} disabled={actionLoading}
                                                                className="p-1.5 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                                                                title="Approve">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        {h.status === 'ACTIVE' && (
                                                            <button onClick={() => updateStatus(h, 'INACTIVE')} disabled={actionLoading}
                                                                className="p-1.5 text-white bg-slate-700 rounded-lg hover:bg-slate-800 disabled:opacity-50"
                                                                title="Deactivate">
                                                                <XCircle className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        {h.status === 'INACTIVE' && (
                                                            <button onClick={() => updateStatus(h, 'ACTIVE')} disabled={actionLoading}
                                                                className="p-1.5 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                                                                title="Reactivate">
                                                                <RotateCcw className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="md:hidden divide-y divide-slate-100">
                                {hospitals.map(h => (
                                    <div key={h.id} className="p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 truncate">{h.hospital_name}</p>
                                                <p className="text-xs text-slate-600 truncate">{h.email}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">LIC: {h.license_number}</p>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${statusBadge(h.status)}`}>
                                                {h.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <p className="text-xs text-slate-500">City</p>
                                                <p className="text-slate-900 font-medium">{h.city || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Contact</p>
                                                <p className="text-slate-900 font-medium truncate">{h.contact_number || h.phone}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-1">
                                            <button onClick={() => setSelected(h)}
                                                className="flex-1 min-w-[80px] px-3 py-2 text-xs font-medium text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-50">
                                                View
                                            </button>
                                            {h.status === 'PENDING' && (
                                                <button onClick={() => updateStatus(h, 'ACTIVE')} disabled={actionLoading}
                                                    className="flex-1 min-w-[80px] px-3 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                                                    Approve
                                                </button>
                                            )}
                                            {h.status === 'ACTIVE' && (
                                                <button onClick={() => updateStatus(h, 'INACTIVE')} disabled={actionLoading}
                                                    className="flex-1 min-w-[80px] px-3 py-2 text-xs font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800 disabled:opacity-50">
                                                    Deactivate
                                                </button>
                                            )}
                                            {h.status === 'INACTIVE' && (
                                                <button onClick={() => updateStatus(h, 'ACTIVE')} disabled={actionLoading}
                                                    className="flex-1 min-w-[80px] px-3 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                                                    Reactivate
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {selected && (
                <HospitalDetailModal
                    hospital={selected}
                    onClose={() => setSelected(null)}
                    onStatusChange={updateStatus}
                    actionLoading={actionLoading}
                />
            )}
        </div>
    );
};

/* ---------------- Summary card ---------------- */
const SummaryCard = ({ label, value, color }) => (
    <div className={`rounded-2xl border p-3 sm:p-4 ${color}`}>
        <p className="text-xs sm:text-sm font-medium opacity-80">{label}</p>
        <p className="text-xl sm:text-2xl font-bold mt-1">{value}</p>
    </div>
);

/* ---------------- Detail Modal ---------------- */
const HospitalDetailModal = ({ hospital, onClose, onStatusChange, actionLoading }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await hospitalService.getById(hospital.id);
                setStats(res.data.stats);
            } catch (_) { /* ignore */ }
            finally { setLoading(false); }
        };
        load();
    }, [hospital.id]);

    const statusBadge = (s) => {
        switch (s) {
            case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case 'INACTIVE': return 'bg-red-50 text-red-700 border border-red-200';
            case 'PENDING': return 'bg-amber-50 text-amber-800 border border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border border-slate-200';
        }
    };

    return (
        <Modal onClose={onClose} title={hospital.hospital_name} icon={Building2}>
            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${statusBadge(hospital.status)}`}>
                        {hospital.status}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                        <FileBadge className="w-3.5 h-3.5" />
                        License: {hospital.license_number}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <Field icon={UserCircle2} label="Contact Person" value={hospital.name} />
                    <Field icon={Mail} label="Email" value={hospital.email} />
                    <Field icon={Phone} label="Account Phone" value={hospital.phone} />
                    <Field icon={Phone} label="Hospital Contact" value={hospital.contact_number || '—'} />
                    <Field icon={MapPin} label="City" value={hospital.city || '—'} />
                    <Field icon={MapPin} label="Address" value={hospital.address || '—'} full />
                </div>

                {!loading && stats && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-rose-700 flex items-center justify-center">
                                <ClipboardList className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-600">Total Blood Requests</p>
                                <p className="text-lg font-bold text-rose-700">{stats.requests.total}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-200">
                    {hospital.status === 'PENDING' && (
                        <button onClick={() => onStatusChange(hospital, 'ACTIVE')} disabled={actionLoading}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-sm disabled:opacity-50 shadow-sm">
                            <CheckCircle2 className="w-4 h-4" /> Approve Hospital
                        </button>
                    )}
                    {hospital.status === 'ACTIVE' && (
                        <button onClick={() => onStatusChange(hospital, 'INACTIVE')} disabled={actionLoading}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-semibold text-sm disabled:opacity-50 shadow-sm">
                            <XCircle className="w-4 h-4" /> Deactivate Hospital
                        </button>
                    )}
                    {hospital.status === 'INACTIVE' && (
                        <button onClick={() => onStatusChange(hospital, 'ACTIVE')} disabled={actionLoading}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-sm disabled:opacity-50 shadow-sm">
                            <RotateCcw className="w-4 h-4" /> Reactivate Hospital
                        </button>
                    )}
                    <button onClick={onClose}
                        className="w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm">
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};

/* ---------------- Reusable: Field / Modal ---------------- */
const Field = ({ icon: Icon, label, value, full }) => (
    <div className={full ? 'sm:col-span-2' : ''}>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
        </div>
        <p className="text-sm text-slate-900 font-medium break-words mt-0.5">{value ?? '—'}</p>
    </div>
);

const Modal = ({ onClose, title, children, icon: Icon }) => (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
        onClick={onClose}>
        <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl border-t-4 border-rose-700 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
                <h3 className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-900 truncate pr-4">
                    {Icon && <Icon className="w-5 h-5 text-rose-700" />}
                    {title}
                </h3>
                <button onClick={onClose}
                    className="p-2 -mr-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg">
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="p-4 sm:p-6">{children}</div>
        </div>
    </div>
);

export default HospitalManagement;