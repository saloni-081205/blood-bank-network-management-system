import React, { useEffect, useState } from 'react';
import {
    Search, Droplet, Eye, Plus, X, AlertCircle,
    CheckCircle2, Calendar, Hash, FileText, UserRound,
} from 'lucide-react';
import { donationService } from '../../services/donationService';
import { donorService } from '../../services/donorService';

const DonationManagement = () => {
    const [donations, setDonations] = useState([]);
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [bloodGroup, setBloodGroup] = useState('');
    const [status, setStatus] = useState('');

    const [showRecord, setShowRecord] = useState(false);
    const [selected, setSelected] = useState(null);

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    useEffect(() => { fetchAll(); }, [search, bloodGroup, status]);

    const fetchAll = async () => {
        try {
            setLoading(true);
            setError('');
            const [donRes, dnRes] = await Promise.all([
                donationService.getAll({ search, blood_group: bloodGroup, status }),
                donorService.getAllDonors({ status: 'ACTIVE' }),
            ]);
            setDonations(donRes.data.donations);
            setDonors(dnRes.data.donors);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        'w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-rose-700';

    const searchClass =
        'w-full pl-9 pr-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-rose-700';

    const statusColor = (s) => {
        switch (s) {
            case 'AVAILABLE': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case 'USED': return 'bg-sky-50 text-sky-700 border border-sky-200';
            case 'EXPIRED': return 'bg-slate-100 text-slate-700 border border-slate-200';
            case 'DISCARDED': return 'bg-red-50 text-red-700 border border-red-200';
            default: return 'bg-slate-100 text-slate-700 border border-slate-200';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Donation Management</h1>
                        <p className="text-sm sm:text-base text-slate-600 mt-1">
                            View all donations and record new ones
                        </p>
                    </div>
                    <button
                        onClick={() => setShowRecord(true)}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-rose-700 text-white rounded-lg hover:bg-rose-800 font-semibold transition-colors text-sm sm:text-base shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Record Donation
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-6 border-t-4 border-rose-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by donor name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={searchClass}
                            />
                        </div>
                        <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className={inputClass}>
                            <option value="">All Blood Groups</option>
                            {bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                            <option value="">All Statuses</option>
                            <option value="AVAILABLE">Available</option>
                            <option value="USED">Used</option>
                            <option value="EXPIRED">Expired</option>
                            <option value="DISCARDED">Discarded</option>
                        </select>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl shadow-xl border-t-4 border-rose-700 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <Droplet className="w-10 h-10 text-rose-700 animate-pulse mx-auto" fill="currentColor" />
                            <p className="text-rose-700 mt-3 text-sm font-medium">Loading donations...</p>
                        </div>
                    ) : error ? (
                        <div className="p-6 text-center text-red-600 text-sm flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    ) : donations.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">No donations found.</div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-rose-50">
                                        <tr>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Donor</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Blood</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Units</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Donation</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Expiry</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                                            <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {donations.map(d => (
                                            <tr key={d.id} className="hover:bg-rose-50/40">
                                                <td className="px-4 lg:px-6 py-3 text-sm text-slate-900 font-medium">{d.donor_name}</td>
                                                <td className="px-4 lg:px-6 py-3">
                                                    <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">
                                                        {d.blood_group}
                                                    </span>
                                                </td>
                                                <td className="px-4 lg:px-6 py-3 text-sm text-slate-700">{d.units_collected}</td>
                                                <td className="px-4 lg:px-6 py-3 text-sm text-slate-700">
                                                    {new Date(d.donation_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 lg:px-6 py-3 text-sm text-slate-700">
                                                    {new Date(d.expiry_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 lg:px-6 py-3">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(d.status)}`}>
                                                        {d.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 lg:px-6 py-3 text-right">
                                                    <button onClick={() => setSelected(d)}
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
                                {donations.map(d => (
                                    <div key={d.id} className="p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 truncate">{d.donor_name}</p>
                                                <p className="text-xs text-slate-500">
                                                    Donated on {new Date(d.donation_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold shrink-0">
                                                {d.blood_group}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <p className="text-xs text-slate-500">Units</p>
                                                <p className="text-slate-900 font-medium">{d.units_collected}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Expiry</p>
                                                <p className="text-slate-900 font-medium">
                                                    {new Date(d.expiry_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(d.status)}`}>
                                                {d.status}
                                            </span>
                                            <button onClick={() => setSelected(d)}
                                                className="px-3 py-2 text-xs font-medium text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-50">
                                                View
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Record Modal */}
            {showRecord && (
                <RecordDonationModal
                    donors={donors}
                    bloodGroups={bloodGroups}
                    onClose={() => setShowRecord(false)}
                    onSuccess={() => { setShowRecord(false); fetchAll(); }}
                />
            )}

            {/* Detail Modal */}
            {selected && (
                <Modal onClose={() => setSelected(null)} title="Donation Details" icon={Droplet}>
                    <div className="space-y-3 text-sm">
                        <Row label="Donation ID" value={`#${selected.id}`} />
                        <Row label="Donor" value={selected.donor_name} />
                        <Row label="Blood Group" value={selected.blood_group} />
                        <Row label="Units" value={selected.units_collected} />
                        <Row label="Donation Date" value={new Date(selected.donation_date).toLocaleDateString()} />
                        <Row label="Expiry Date" value={new Date(selected.expiry_date).toLocaleDateString()} />
                        <Row label="Status" value={selected.status} />
                        <Row label="Notes" value={selected.notes || '—'} />
                    </div>
                </Modal>
            )}
        </div>
    );
};

/* -------- Record Donation Modal -------- */
const RecordDonationModal = ({ donors, bloodGroups, onClose, onSuccess }) => {
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = useState({
        donor_id: '',
        blood_group: '',
        units_collected: 1,
        donation_date: today,
        notes: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const inputClass =
        'mt-1 block w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-rose-700';

    const handleDonorChange = (e) => {
        const donorId = e.target.value;
        const donor = donors.find(d => String(d.id) === String(donorId));
        setFormData({
            ...formData,
            donor_id: donorId,
            blood_group: donor ? donor.blood_group : '',
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await donationService.create({
                donor_id: parseInt(formData.donor_id),
                blood_group: formData.blood_group,
                units_collected: parseFloat(formData.units_collected),
                donation_date: formData.donation_date,
                notes: formData.notes,
            });
            onSuccess();
        } catch (err) {
            setError(
                err.response?.data?.message
                || err.response?.data?.errors?.[0]?.msg
                || 'Failed to record donation'
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal onClose={onClose} title="Record Donation (Admin)" icon={Plus}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <UserRound className="w-4 h-4 text-rose-700" /> Donor *
                    </label>
                    <select
                        required
                        value={formData.donor_id}
                        onChange={handleDonorChange}
                        className={inputClass}
                    >
                        <option value="">Select a donor...</option>
                        {donors.map(d => (
                            <option key={d.id} value={d.id}>
                                {d.name} — {d.blood_group} ({d.email})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                            <Droplet className="w-4 h-4 text-rose-700" fill="currentColor" /> Blood Group *
                        </label>
                        <input
                            type="text"
                            value={formData.blood_group}
                            disabled
                            className={`${inputClass} bg-slate-100 text-slate-600 font-bold`}
                            placeholder="Auto-filled"
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                            <Hash className="w-4 h-4 text-rose-700" /> Units *
                        </label>
                        <input
                            type="number"
                            required
                            min="0.5"
                            step="0.5"
                            value={formData.units_collected}
                            onChange={(e) => setFormData({ ...formData, units_collected: e.target.value })}
                            className={inputClass}
                        />
                    </div>
                </div>

                <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <Calendar className="w-4 h-4 text-rose-700" /> Donation Date *
                    </label>
                    <input
                        type="date"
                        required
                        max={today}
                        value={formData.donation_date}
                        onChange={(e) => setFormData({ ...formData, donation_date: e.target.value })}
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <FileText className="w-4 h-4 text-rose-700" /> Notes (optional)
                    </label>
                    <textarea
                        rows="3"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className={inputClass}
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button type="submit" disabled={saving}
                        className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-rose-700 text-white rounded-lg hover:bg-rose-800 font-semibold text-sm disabled:opacity-50 shadow-sm">
                        {saving ? 'Saving...' : 'Save Donation'}
                    </button>
                    <button type="button" onClick={onClose}
                        className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm">
                        Cancel
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const Row = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 border-b border-slate-100 pb-2">
        <span className="text-slate-500 text-xs sm:text-sm">{label}</span>
        <span className="text-slate-900 font-medium text-sm text-left sm:text-right break-words">{value ?? '—'}</span>
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

export default DonationManagement;