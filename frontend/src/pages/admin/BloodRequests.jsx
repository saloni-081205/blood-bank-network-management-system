import React, { useEffect, useState } from 'react';
import {
    ClipboardList, Droplet, AlertTriangle, Search,
    AlertCircle, SlidersHorizontal, Eye,
} from 'lucide-react';
import { requestService } from '../../services/requestService';
import { RequestDetailModal } from '../hospital/RequestHistory';

const BloodRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [bloodGroup, setBloodGroup] = useState('');
    const [requestType, setRequestType] = useState('');
    const [selected, setSelected] = useState(null);

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    useEffect(() => { fetchRequests(); }, [search, status, bloodGroup, requestType]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await requestService.getAll({
                search, status, blood_group: bloodGroup, request_type: requestType,
            });
            setRequests(res.data.requests);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load requests');
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
            await fetchRequests();
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
            throw err;
        }
    };

    const inputClass =
        'w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-rose-700';

    const searchClass =
        'w-full pl-9 pr-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-rose-700';

    const statusBadge = (s) => {
        switch (s) {
            case 'PENDING': return 'bg-amber-50 text-amber-800 border border-amber-200';
            case 'APPROVED': return 'bg-sky-50 text-sky-700 border border-sky-200';
            case 'ISSUED': return 'bg-violet-50 text-violet-700 border border-violet-200';
            case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case 'REJECTED': return 'bg-red-50 text-red-700 border border-red-200';
            default: return 'bg-slate-100 text-slate-700 border border-slate-200';
        }
    };

    const counts = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'PENDING').length,
        emergency: requests.filter(r => r.request_type === 'EMERGENCY' && r.status !== 'COMPLETED' && r.status !== 'REJECTED').length,
        completed: requests.filter(r => r.status === 'COMPLETED').length,
    };

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-rose-700 flex items-center justify-center shadow-sm">
                        <ClipboardList className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Blood Requests</h1>
                        <p className="text-sm sm:text-base text-slate-600 mt-0.5">
                            Review, approve, issue, and complete blood requests
                        </p>
                    </div>
                </div>

                {/* Summary tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <SummaryCard label="Total" value={counts.total} color="border-rose-200 bg-rose-50 text-rose-700" />
                    <SummaryCard label="Pending" value={counts.pending} color="border-amber-200 bg-amber-50 text-amber-800" />
                    <SummaryCard label="Emergency" value={counts.emergency} color="border-red-300 bg-red-50 text-red-700" />
                    <SummaryCard label="Completed" value={counts.completed} color="border-emerald-200 bg-emerald-50 text-emerald-700" />
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-6 border-t-4 border-rose-700">
                    {/* Quick chips */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <button
                            onClick={() => { setRequestType('EMERGENCY'); setStatus('PENDING'); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-600 text-white hover:bg-red-700">
                            <AlertTriangle className="w-3.5 h-3.5" /> Open Emergencies
                        </button>
                        <button
                            onClick={() => { setRequestType(''); setStatus(''); setBloodGroup(''); setSearch(''); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200">
                            <SlidersHorizontal className="w-3.5 h-3.5" /> Reset Filters
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search hospital..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={searchClass}
                            />
                        </div>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                            <option value="">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="ISSUED">Issued</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                        <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className={inputClass}>
                            <option value="">All Blood Groups</option>
                            {bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select value={requestType} onChange={(e) => setRequestType(e.target.value)} className={inputClass}>
                            <option value="">All Types</option>
                            <option value="NORMAL">Normal</option>
                            <option value="EMERGENCY">Emergency</option>
                        </select>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl shadow-xl border-t-4 border-rose-700 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <Droplet className="w-10 h-10 text-rose-700 animate-pulse mx-auto" fill="currentColor" />
                            <p className="text-rose-700 mt-3 text-sm font-medium">Loading requests...</p>
                        </div>
                    ) : error ? (
                        <div className="p-6 text-center text-red-600 text-sm flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">No requests found.</div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-rose-50">
                                        <tr>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">ID</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Hospital</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Blood</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Units</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Type</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Urgency</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                                            <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {requests.map(r => (
                                            <tr key={r.id}
                                                className={`hover:bg-rose-50/40 ${r.request_type === 'EMERGENCY' ? 'bg-red-50/30' : ''}`}>
                                                <td className="px-4 lg:px-6 py-3 text-sm text-slate-900 font-medium">#{r.id}</td>
                                                <td className="px-4 lg:px-6 py-3">
                                                    <p className="text-sm text-slate-900 font-medium truncate max-w-[180px]">{r.hospital_name}</p>
                                                    <p className="text-xs text-slate-500">{r.city || '—'}</p>
                                                </td>
                                                <td className="px-4 lg:px-6 py-3">
                                                    <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">
                                                        {r.blood_group}
                                                    </span>
                                                </td>
                                                <td className="px-4 lg:px-6 py-3 text-sm text-slate-700">{r.units_requested}</td>
                                                <td className="px-4 lg:px-6 py-3">
                                                    {r.request_type === 'EMERGENCY'
                                                        ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                                                            <AlertTriangle className="w-3 h-3" /> Emergency
                                                        </span>
                                                        : <span className="text-xs text-slate-600">Normal</span>}
                                                </td>
                                                <td className="px-4 lg:px-6 py-3 text-xs text-slate-700">{r.urgency}</td>
                                                <td className="px-4 lg:px-6 py-3">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(r.status)}`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 lg:px-6 py-3 text-right">
                                                    <button onClick={() => setSelected(r)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-rose-700 rounded-lg hover:bg-rose-800"
                                                        title="Manage">
                                                        <Eye className="w-3.5 h-3.5" />
                                                        Manage
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="md:hidden divide-y divide-slate-100">
                                {requests.map(r => (
                                    <div key={r.id}
                                        className={`p-4 space-y-3 ${r.request_type === 'EMERGENCY' ? 'bg-red-50/30' : ''}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-xs text-slate-500">Request #{r.id}</p>
                                                <p className="font-semibold text-slate-900 truncate">{r.hospital_name}</p>
                                                <p className="text-xs text-slate-500">{r.city || '—'}</p>
                                            </div>
                                            <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold shrink-0">
                                                {r.blood_group}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {r.request_type === 'EMERGENCY' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-600 text-white">
                                                    <AlertTriangle className="w-3 h-3" /> Emergency
                                                </span>
                                            )}
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(r.status)}`}>
                                                {r.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <p className="text-xs text-slate-500">Units</p>
                                                <p className="text-slate-900 font-medium">{r.units_requested}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Urgency</p>
                                                <p className="text-slate-900 font-medium">{r.urgency}</p>
                                            </div>
                                        </div>

                                        <button onClick={() => setSelected(r)}
                                            className="w-full px-3 py-2 text-xs font-semibold text-white bg-rose-700 rounded-lg hover:bg-rose-800">
                                            Manage Request
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
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

const SummaryCard = ({ label, value, color }) => (
    <div className={`rounded-2xl border p-3 sm:p-4 ${color}`}>
        <p className="text-xs sm:text-sm font-medium opacity-80">{label}</p>
        <p className="text-xl sm:text-2xl font-bold mt-1">{value}</p>
    </div>
);

export default BloodRequests;