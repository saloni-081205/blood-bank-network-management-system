import React, { useEffect, useState } from 'react';
import {
    Search, SlidersHorizontal, UserRound, Droplet,
    Eye, Pencil, UserX, X, AlertCircle,
} from 'lucide-react';
import { donorService } from '../../services/donorService';

const DonorManagement = () => {
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [bloodGroup, setBloodGroup] = useState('');
    const [eligibility, setEligibility] = useState('');
    const [status, setStatus] = useState('');
    const [selected, setSelected] = useState(null);
    const [editing, setEditing] = useState(null);
    const [editForm, setEditForm] = useState(null);
    const [saving, setSaving] = useState(false);

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    useEffect(() => { fetchDonors(); }, [search, bloodGroup, eligibility, status]);

    const fetchDonors = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await donorService.getAllDonors({
                search, blood_group: bloodGroup, eligibility, status,
            });
            setDonors(res.data.donors);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load donors');
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (donor) => {
        setEditing(donor);
        setEditForm({
            ...donor,
            date_of_birth: donor.date_of_birth?.split('T')[0] || '',
            last_donation_date: donor.last_donation_date?.split('T')[0] || '',
        });
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await donorService.updateDonor(editForm.id, {
                name: editForm.name,
                phone: editForm.phone,
                date_of_birth: editForm.date_of_birth,
                gender: editForm.gender,
                blood_group: editForm.blood_group,
                weight: parseFloat(editForm.weight),
                address: editForm.address,
                city: editForm.city,
                last_donation_date: editForm.last_donation_date || null,
            });
            setEditing(null);
            fetchDonors();
        } catch (err) {
            alert(err.response?.data?.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (donor) => {
        if (!window.confirm(`Deactivate ${donor.name}? They will not be able to log in.`)) return;
        try {
            await donorService.deactivateDonor(donor.id);
            fetchDonors();
        } catch (err) {
            alert(err.response?.data?.message || 'Deactivate failed');
        }
    };

    const inputClass =
        'w-full pl-9 pr-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-rose-700';

    const selectClass =
        'w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-rose-700';

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Donor Management</h1>
                    <p className="text-sm sm:text-base text-slate-600 mt-1">
                        View, search, filter, and manage all registered donors
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-6 border-t-4 border-rose-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search name, email, phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className={selectClass}>
                            <option value="">All Blood Groups</option>
                            {bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select value={eligibility} onChange={(e) => setEligibility(e.target.value)} className={selectClass}>
                            <option value="">All Eligibility</option>
                            <option value="ELIGIBLE">Eligible</option>
                            <option value="INELIGIBLE">Ineligible</option>
                        </select>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
                            <option value="">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl shadow-xl border-t-4 border-rose-700 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <Droplet className="w-10 h-10 text-rose-700 animate-pulse mx-auto" fill="currentColor" />
                            <p className="text-rose-700 mt-3 text-sm font-medium">Loading donors...</p>
                        </div>
                    ) : error ? (
                        <div className="p-6 text-center text-red-600 text-sm flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    ) : donors.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">No donors found.</div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-rose-50">
                                        <tr>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Name</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Email</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Phone</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Blood</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Eligibility</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                                            <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {donors.map(d => (
                                            <tr key={d.id} className="hover:bg-rose-50/40">
                                                <td className="px-4 lg:px-6 py-3 text-sm text-slate-900 font-medium">{d.name}</td>
                                                <td className="px-4 lg:px-6 py-3 text-sm text-slate-600">{d.email}</td>
                                                <td className="px-4 lg:px-6 py-3 text-sm text-slate-600">{d.phone}</td>
                                                <td className="px-4 lg:px-6 py-3">
                                                    <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">
                                                        {d.blood_group}
                                                    </span>
                                                </td>
                                                <td className="px-4 lg:px-6 py-3">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        d.eligibility_status === 'ELIGIBLE'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-red-50 text-red-700 border border-red-200'
                                                    }`}>
                                                        {d.eligibility_status}
                                                    </span>
                                                </td>
                                                <td className="px-4 lg:px-6 py-3">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        d.user_status === 'ACTIVE'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                    }`}>
                                                        {d.user_status}
                                                    </span>
                                                </td>
                                                <td className="px-4 lg:px-6 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setSelected(d)}
                                                            className="p-1.5 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-50"
                                                            title="View">
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => openEdit(d)}
                                                            className="p-1.5 text-white bg-rose-700 rounded-lg hover:bg-rose-800"
                                                            title="Edit">
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        {d.user_status === 'ACTIVE' && (
                                                            <button onClick={() => handleDeactivate(d)}
                                                                className="p-1.5 text-white bg-slate-700 rounded-lg hover:bg-slate-800"
                                                                title="Deactivate">
                                                                <UserX className="w-3.5 h-3.5" />
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
                                {donors.map(d => (
                                    <div key={d.id} className="p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 truncate">{d.name}</p>
                                                <p className="text-xs text-slate-600 truncate">{d.email}</p>
                                                <p className="text-xs text-slate-600">{d.phone}</p>
                                            </div>
                                            <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold shrink-0">
                                                {d.blood_group}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                d.eligibility_status === 'ELIGIBLE'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-red-50 text-red-700 border border-red-200'
                                            }`}>
                                                {d.eligibility_status}
                                            </span>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                d.user_status === 'ACTIVE'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                            }`}>
                                                {d.user_status}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-1">
                                            <button onClick={() => setSelected(d)}
                                                className="flex-1 min-w-[80px] px-3 py-2 text-xs font-medium text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-50">
                                                View
                                            </button>
                                            <button onClick={() => openEdit(d)}
                                                className="flex-1 min-w-[80px] px-3 py-2 text-xs font-medium text-white bg-rose-700 rounded-lg hover:bg-rose-800">
                                                Edit
                                            </button>
                                            {d.user_status === 'ACTIVE' && (
                                                <button onClick={() => handleDeactivate(d)}
                                                    className="flex-1 min-w-[80px] px-3 py-2 text-xs font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800">
                                                    Deactivate
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

            {/* View Modal */}
            {selected && (
                <Modal onClose={() => setSelected(null)} title="Donor Details" icon={UserRound}>
                    <div className="space-y-3 text-sm">
                        <Row label="Name" value={selected.name} />
                        <Row label="Email" value={selected.email} />
                        <Row label="Phone" value={selected.phone} />
                        <Row label="Blood Group" value={selected.blood_group} />
                        <Row label="Gender" value={selected.gender} />
                        <Row label="Date of Birth" value={selected.date_of_birth?.split('T')[0]} />
                        <Row label="Weight" value={`${selected.weight} kg`} />
                        <Row label="Address" value={selected.address || '—'} />
                        <Row label="City" value={selected.city || '—'} />
                        <Row label="Last Donation" value={selected.last_donation_date?.split('T')[0] || 'None'} />
                        <Row label="Eligibility" value={selected.eligibility_status} />
                        <Row label="Account Status" value={selected.user_status} />
                    </div>
                </Modal>
            )}

            {/* Edit Modal */}
            {editing && editForm && (
                <Modal onClose={() => setEditing(null)} title={`Edit ${editing.name}`} icon={Pencil}>
                    <form onSubmit={handleEditSave} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <Field label="Name">
                                <input type="text" required value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-700" />
                            </Field>
                            <Field label="Phone">
                                <input type="text" required value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-700" />
                            </Field>
                            <Field label="Date of Birth">
                                <input type="date" required value={editForm.date_of_birth}
                                    onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-700" />
                            </Field>
                            <Field label="Gender">
                                <select value={editForm.gender}
                                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-700">
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </Field>
                            <Field label="Blood Group">
                                <select value={editForm.blood_group}
                                    onChange={(e) => setEditForm({ ...editForm, blood_group: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-700">
                                    {bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </Field>
                            <Field label="Weight (kg)">
                                <input type="number" min="0" step="0.1" required value={editForm.weight}
                                    onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-700" />
                            </Field>
                            <Field label="City">
                                <input type="text" value={editForm.city || ''}
                                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-700" />
                            </Field>
                            <Field label="Last Donation Date">
                                <input type="date" value={editForm.last_donation_date || ''}
                                    onChange={(e) => setEditForm({ ...editForm, last_donation_date: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-700" />
                            </Field>
                            <div className="sm:col-span-2">
                                <Field label="Address">
                                    <input type="text" value={editForm.address || ''}
                                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-700" />
                                </Field>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button type="submit" disabled={saving}
                                className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-rose-700 text-white rounded-lg hover:bg-rose-800 font-medium text-sm disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button type="button" onClick={() => setEditing(null)}
                                className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm">
                                Cancel
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

const Row = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 border-b border-slate-100 pb-2">
        <span className="text-slate-500 text-xs sm:text-sm">{label}</span>
        <span className="text-slate-900 font-medium text-sm text-left sm:text-right break-words">
            {value ?? '—'}
        </span>
    </div>
);

const Field = ({ label, children }) => (
    <div>
        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">{label}</label>
        {children}
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
                    className="p-2 -mr-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                    aria-label="Close">
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="p-4 sm:p-6">{children}</div>
        </div>
    </div>
);

export default DonorManagement;