import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ClipboardList, Droplet, AlertTriangle, Eye, X, Plus,
    AlertCircle, CheckCircle2, Hash, Gauge, FileText,
    Calendar, Building2, Package, Clock, Phone, MapPin, ArrowLeft
} from 'lucide-react';
import { requestService } from '../../services/requestService';
import { useNavigate } from 'react-router-dom';

const RequestHistory = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');
    const [bloodGroup, setBloodGroup] = useState('');
    const [selected, setSelected] = useState(null);

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    useEffect(() => { fetchRequests(); }, [status, bloodGroup]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await requestService.getAll({ status, blood_group: bloodGroup });
            setRequests(res.data.requests);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        'w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-rose-700';

    const statusBadge = (s) => {
        switch (s) {
            case 'PENDING': return 'bg-amber-50 text-amber-800 border border-amber-200';
            case 'APPROVED': return 'bg-sky-50 text-sky-700 border border-sky-200';
            case 'ISSUED': return 'bg-violet-50 text-violet-700 border border-violet-200';
            case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case 'REJECTED': return 'bg-red-50 text-red-700 border border-red-200';
            case 'CANCELLED': return 'bg-slate-100 text-slate-700 border border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border border-slate-200';
        }
    };

    const urgencyBadge = (u) => {
        switch (u) {
            case 'CRITICAL': return 'bg-red-600 text-white border border-red-600';
            case 'HIGH': return 'bg-orange-500 text-white border border-orange-500';
            case 'MEDIUM': return 'bg-amber-50 text-amber-800 border border-amber-200';
            case 'LOW': return 'bg-slate-100 text-slate-700 border border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border border-slate-200';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <button onClick={() => navigate('/hospital')}
                              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-rose-700 mb-4">
                              <ArrowLeft className="w-4 h-4" /> Back to dashboard
                          </button>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-rose-700 flex items-center justify-center shadow-sm">
                          
                            <ClipboardList className="w-6 h-6 text-white" />
                        </div>
                        
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Requests</h1>
                            <p className="text-sm sm:text-base text-slate-600 mt-0.5">
                                Track all blood requests you've submitted
                            </p>
                        </div>
                    </div>
                    <Link to="/hospital/request"
                        className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-rose-700 text-white rounded-lg hover:bg-rose-800 font-semibold text-sm sm:text-base shadow-sm">
                        <Plus className="w-4 h-4" />
                        New Request
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-6 border-t-4 border-rose-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                        <div className="p-8 text-center text-slate-500 text-sm">
                            No requests yet. Create your first one.
                        </div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-rose-50">
                                        <tr>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">ID</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Blood</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Units</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Type</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Urgency</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Requested</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                                            <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {requests.map(r => (
                                            <tr key={r.id} className={`hover:bg-rose-50/40 ${r.request_type === 'EMERGENCY' ? 'bg-red-50/30' : ''}`}>
                                                <td className="px-4 lg:px-6 py-3 text-sm text-slate-900 font-medium">#{r.id}</td>
                                                <td className="px-4 lg:px-6 py-3">
                                                    <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">
                                                        {r.blood_group}
                                                    </span>
                                                </td>
                                                <td className="px-4 lg:px-6 py-3 text-sm text-slate-700">{r.units_requested}</td>
                                                <td className="px-4 lg:px-6 py-3">
                                                    {r.request_type === 'EMERGENCY' ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                                                            <AlertTriangle className="w-3 h-3" /> Emergency
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-600">Normal</span>
                                                    )}
                                                </td>
                                                <td className="px-4 lg:px-6 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urgencyBadge(r.urgency)}`}>
                                                        {r.urgency}
                                                    </span>
                                                </td>
                                                <td className="px-4 lg:px-6 py-3 text-xs text-slate-600">
                                                    {new Date(r.requested_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 lg:px-6 py-3">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(r.status)}`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 lg:px-6 py-3 text-right">
                                                    <button onClick={() => setSelected(r)}
                                                        className="p-1.5 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-50"
                                                        title="View">
                                                        <Eye className="w-3.5 h-3.5" />
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
                                    <div key={r.id} className={`p-4 space-y-3 ${r.request_type === 'EMERGENCY' ? 'bg-red-50/30' : ''}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs text-slate-500">Request #{r.id}</p>
                                                <p className="font-semibold text-slate-900">
                                                    {r.units_requested} units
                                                </p>
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
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urgencyBadge(r.urgency)}`}>
                                                {r.urgency}
                                            </span>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(r.status)}`}>
                                                {r.status}
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-500">
                                            Requested on {new Date(r.requested_at).toLocaleDateString()}
                                        </p>

                                        <button onClick={() => setSelected(r)}
                                            className="w-full px-3 py-2 text-xs font-medium text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-50">
                                            View Details
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
                    role="HOSPITAL"
                />
            )}
        </div>
    );
};

export default RequestHistory;

/* ============================================================
   Shared RequestDetailModal (used by admin BloodRequests too)
   ============================================================ */
export const RequestDetailModal = ({ requestId, onClose, role, onAction }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await requestService.getById(requestId);
                setData(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load request');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [requestId]);

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

    return (
        <Modal onClose={onClose} title={data ? `Request #${data.request.id}` : 'Request'} icon={ClipboardList}>
            {loading ? (
                <div className="p-6 text-center">
                    <Droplet className="w-8 h-8 text-rose-700 animate-pulse mx-auto" fill="currentColor" />
                </div>
            ) : error ? (
                <p className="text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                </p>
            ) : data ? (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${statusBadge(data.request.status)}`}>
                            {data.request.status}
                        </span>
                        {data.request.request_type === 'EMERGENCY' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-red-600 text-white">
                                <AlertTriangle className="w-3.5 h-3.5" /> EMERGENCY
                            </span>
                        )}
                        <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-slate-100 text-slate-700">
                            {data.request.urgency}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <Field icon={Droplet} label="Blood Group" value={data.request.blood_group} />
                        <Field icon={Hash} label="Units Requested" value={data.request.units_requested} />
                        <Field icon={Building2} label="Hospital" value={data.request.hospital_name} full />
                        <Field icon={MapPin} label="City" value={data.request.city || '—'} />
                        <Field icon={Phone} label="Contact" value={data.request.contact_number || '—'} />
                        <Field icon={Calendar} label="Requested At" value={new Date(data.request.requested_at).toLocaleString()} />
                        {data.request.approved_at && (
                            <Field icon={CheckCircle2} label="Approved At" value={new Date(data.request.approved_at).toLocaleString()} />
                        )}
                        {data.request.completed_at && (
                            <Field icon={CheckCircle2} label="Completed At" value={new Date(data.request.completed_at).toLocaleString()} />
                        )}
                        {data.request.reason && (
                            <Field icon={FileText} label="Reason / Notes" value={data.request.reason} full />
                        )}
                    </div>

                    {data.inventory && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-rose-700 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-600">Current {data.inventory.blood_group} stock</p>
                                    <p className={`text-lg font-bold ${
                                        parseFloat(data.inventory.units_available) >= parseFloat(data.request.units_requested)
                                            ? 'text-emerald-700'
                                            : 'text-red-700'
                                    }`}>
                                        {data.inventory.units_available} units
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-600 text-right max-w-[120px]">
                                {parseFloat(data.inventory.units_available) >= parseFloat(data.request.units_requested)
                                    ? '✔ Enough stock available'
                                    : '✖ Insufficient stock'}
                            </p>
                        </div>
                    )}

                    {role === 'ADMIN' && onAction && (
                        <AdminActions request={data.request} onAction={onAction} onClose={onClose} />
                    )}

                    <div className="flex pt-2">
                        <button onClick={onClose}
                            className="w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm">
                            Close
                        </button>
                    </div>
                </div>
            ) : null}
        </Modal>
    );
};

/* ---------------- Admin actions ---------------- */
const AdminActions = ({ request, onAction, onClose }) => {
    const [busy, setBusy] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const doAction = async (action, payload) => {
        if (!window.confirm(`Confirm action: ${action.toUpperCase()}?`)) return;
        setBusy(true);
        try {
            await onAction(action, request.id, payload);
            onClose();
        } finally {
            setBusy(false);
        }
    };

    const btnBase = 'flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-lg font-semibold text-sm disabled:opacity-50 transition-colors shadow-sm';

    return (
        <div className="border-t border-slate-200 pt-4 space-y-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Admin Actions</p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                {request.status === 'PENDING' && (
                    <>
                        <button disabled={busy} onClick={() => doAction('approve')}
                            className={`${btnBase} bg-sky-600 text-white hover:bg-sky-700`}>
                            <CheckCircle2 className="w-4 h-4" /> Approve
                        </button>
                        <button disabled={busy} onClick={() => setShowReject(true)}
                            className={`${btnBase} bg-red-600 text-white hover:bg-red-700`}>
                            <X className="w-4 h-4" /> Reject
                        </button>
                    </>
                )}
                {request.status === 'APPROVED' && (
                    <>
                        <button disabled={busy} onClick={() => doAction('issue')}
                            className={`${btnBase} bg-violet-600 text-white hover:bg-violet-700`}>
                            <Package className="w-4 h-4" /> Issue Blood
                        </button>
                        <button disabled={busy} onClick={() => setShowReject(true)}
                            className={`${btnBase} bg-red-600 text-white hover:bg-red-700`}>
                            <X className="w-4 h-4" /> Reject
                        </button>
                    </>
                )}
                {request.status === 'ISSUED' && (
                    <button disabled={busy} onClick={() => doAction('complete')}
                        className={`${btnBase} bg-emerald-600 text-white hover:bg-emerald-700`}>
                        <CheckCircle2 className="w-4 h-4" /> Mark Completed
                    </button>
                )}
                {(request.status === 'COMPLETED' || request.status === 'REJECTED') && (
                    <p className="text-xs text-slate-500">No further actions available.</p>
                )}
            </div>

            {showReject && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Rejection reason</label>
                    <textarea
                        rows="2"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-700"
                        placeholder="Why are you rejecting this request?"
                    />
                    <div className="flex gap-2">
                        <button disabled={busy}
                            onClick={() => doAction('reject', { reason: rejectReason })}
                            className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50">
                            Confirm Reject
                        </button>
                        <button onClick={() => { setShowReject(false); setRejectReason(''); }}
                            className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200">
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
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