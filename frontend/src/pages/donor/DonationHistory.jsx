import React, { useEffect, useState } from 'react';
import { Droplet, Calendar, Eye, X, ArrowLeft } from 'lucide-react';
import { donorService } from '../../services/donorService';
import { donationService } from '../../services/donationService';
import { useNavigate } from 'react-router-dom';

const DonationHistory = () => {
    const [donations, setDonations] = useState([]);
    const [donor, setDonor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const profileRes = await donorService.getMyProfile();
                const d = profileRes.data.donor;
                setDonor(d);
                const histRes = await donationService.getByDonor(d.id);
                setDonations(histRes.data.donations);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load donation history');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const statusColor = (s) => {
        switch (s) {
            case 'AVAILABLE': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case 'USED': return 'bg-sky-50 text-sky-700 border border-sky-200';
            case 'EXPIRED': return 'bg-slate-100 text-slate-700 border border-slate-200';
            case 'DISCARDED': return 'bg-red-50 text-red-700 border border-red-200';
            default: return 'bg-slate-100 text-slate-700 border border-slate-200';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="text-center">
                    <Droplet className="w-14 h-14 text-rose-700 animate-pulse mx-auto" fill="currentColor" />
                    <p className="text-rose-700 text-base sm:text-lg mt-4 font-semibold">Loading history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <button onClick={() => navigate('/donor')}
                    className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-rose-700 mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to dashboard
                </button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Donation History</h1>
                    {donor && (
                        <p className="text-sm sm:text-base text-slate-600 mt-1">
                            Blood Group:{' '}
                            <span className="font-bold text-rose-700">{donor.blood_group}</span>
                            {'  •  '}Total Donations:{' '}
                            <span className="font-bold text-rose-700">{donations.length}</span>
                        </p>
                    )}
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-xl border-t-4 border-rose-700 overflow-hidden">
                    {donations.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm sm:text-base">
                            No donations recorded yet.
                        </div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-rose-50">
                                        <tr>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Donation Date</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Blood</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Units</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Expiry</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                                            <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {donations.map(d => (
                                            <tr key={d.id} className="hover:bg-rose-50/40">
                                                <td className="px-4 lg:px-6 py-3 text-sm text-slate-900">
                                                    {new Date(d.donation_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 lg:px-6 py-3">
                                                    <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">
                                                        {d.blood_group}
                                                    </span>
                                                </td>
                                                <td className="px-4 lg:px-6 py-3 text-sm text-slate-700">{d.units_collected}</td>
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
                                            <div>
                                                <p className="text-xs text-slate-500">Donation Date</p>
                                                <p className="font-semibold text-slate-900">
                                                    {new Date(d.donation_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">
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

            {selected && (
                <Modal onClose={() => setSelected(null)} title="Donation Details">
                    <div className="space-y-3 text-sm">
                        <Row label="Donation ID" value={`#${selected.id}`} />
                        <Row label="Donation Date" value={new Date(selected.donation_date).toLocaleDateString()} />
                        <Row label="Blood Group" value={selected.blood_group} />
                        <Row label="Units Collected" value={selected.units_collected} />
                        <Row label="Expiry Date" value={new Date(selected.expiry_date).toLocaleDateString()} />
                        <Row label="Status" value={selected.status} />
                        <Row label="Notes" value={selected.notes || '—'} />
                    </div>
                </Modal>
            )}
        </div>
    );
};

const Row = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 border-b border-slate-100 pb-2">
        <span className="text-slate-500 text-xs sm:text-sm">{label}</span>
        <span className="text-slate-900 font-medium text-sm text-left sm:text-right break-words">{value ?? '—'}</span>
    </div>
);

const Modal = ({ onClose, title, children }) => (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
        onClick={onClose}>
        <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border-t-4 border-rose-700 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate pr-4">{title}</h3>
                <button onClick={onClose} className="p-2 -mr-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg">
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="p-4 sm:p-6">{children}</div>
        </div>
    </div>
);

export default DonationHistory;