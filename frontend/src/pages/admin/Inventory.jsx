import React, { useEffect, useState } from 'react';
import {
    Package, Droplet, AlertTriangle, RefreshCw, TrendingDown,
    Eye, Settings2, X, CheckCircle2, AlertCircle, Calendar,
    Hash, FileText, Clock,
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';

const Inventory = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [adjusting, setAdjusting] = useState(null);
    const [expiredOpen, setExpiredOpen] = useState(false);
    const [detailGroup, setDetailGroup] = useState(null);

    useEffect(() => { fetchInventory(); }, []);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await inventoryService.getAll();
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    const stockBadge = (level) => {
        switch (level) {
            case 'CRITICAL': return 'bg-red-50 text-red-700 border border-red-200';
            case 'LOW': return 'bg-amber-50 text-amber-800 border border-amber-200';
            default: return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        }
    };

    const stockLabel = (level) => {
        switch (level) {
            case 'CRITICAL': return 'Critical';
            case 'LOW': return 'Low Stock';
            default: return 'Normal';
        }
    };

    const tileBorder = (level) => {
        switch (level) {
            case 'CRITICAL': return 'border-red-400';
            case 'LOW': return 'border-amber-400';
            default: return 'border-slate-200 hover:border-rose-300';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="text-center">
                    <Droplet className="w-14 h-14 text-rose-700 animate-pulse mx-auto" fill="currentColor" />
                    <p className="text-rose-700 text-base sm:text-lg mt-4 font-semibold">Loading inventory...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <p className="text-rose-700 text-base sm:text-lg text-center">{error}</p>
            </div>
        );
    }

    const { inventory, summary } = data;

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-rose-700 flex items-center justify-center shadow-sm">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Blood Inventory</h1>
                            <p className="text-sm sm:text-base text-slate-600 mt-0.5">
                                Live stock for all blood groups
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                            onClick={fetchInventory}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                        <button
                            onClick={() => setExpiredOpen(true)}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm shadow-sm"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            Expired ({summary.expired.units} units)
                        </button>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <SummaryCard
                        icon={Droplet}
                        label="Total Units"
                        value={summary.total_units}
                        color="border-rose-200 bg-rose-50 text-rose-700"
                    />
                    <SummaryCard
                        icon={TrendingDown}
                        label="Low Stock"
                        value={summary.low_stock_groups.length}
                        sub={summary.low_stock_groups.join(', ') || '—'}
                        color="border-amber-200 bg-amber-50 text-amber-800"
                    />
                    <SummaryCard
                        icon={AlertTriangle}
                        label="Critical"
                        value={summary.critical_stock_groups.length}
                        sub={summary.critical_stock_groups.join(', ') || '—'}
                        color="border-red-200 bg-red-50 text-red-700"
                    />
                    <SummaryCard
                        icon={Clock}
                        label="Expiring ≤ 7 days"
                        value={`${summary.expiring_soon.units} units`}
                        color="border-orange-200 bg-orange-50 text-orange-800"
                    />
                </div>

                {/* Inventory grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {inventory.map(item => (
                        <div
                            key={item.id}
                            className={`rounded-2xl shadow-sm border-2 p-3 sm:p-4 bg-white transition-all hover:shadow-md ${tileBorder(item.stock_level)}`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-700 text-white flex items-center justify-center text-base sm:text-lg font-bold shadow-sm">
                                    {item.blood_group}
                                </div>
                                <span className={`inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-semibold ${stockBadge(item.stock_level)}`}>
                                    {item.stock_level === 'NORMAL' && <CheckCircle2 className="w-3 h-3" />}
                                    {item.stock_level !== 'NORMAL' && <AlertCircle className="w-3 h-3" />}
                                    {stockLabel(item.stock_level)}
                                </span>
                            </div>

                            <div className="mt-3">
                                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Available</p>
                                <p className="text-xl sm:text-2xl font-bold text-slate-900">
                                    {item.units_available}
                                    <span className="text-xs sm:text-sm font-normal text-slate-500 ml-1">units</span>
                                </p>
                            </div>

                            <div className="mt-3 flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={() => setDetailGroup(item.blood_group)}
                                    className="flex items-center justify-center gap-1.5 flex-1 px-2 py-1.5 text-[11px] sm:text-xs font-medium text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-50"
                                >
                                    <Eye className="w-3 h-3" />
                                    Details
                                </button>
                                <button
                                    onClick={() => setAdjusting(item)}
                                    className="flex items-center justify-center gap-1.5 flex-1 px-2 py-1.5 text-[11px] sm:text-xs font-medium text-white bg-rose-700 rounded-lg hover:bg-rose-800"
                                >
                                    <Settings2 className="w-3 h-3" />
                                    Adjust
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Adjust Modal */}
            {adjusting && (
                <AdjustModal
                    item={adjusting}
                    onClose={() => setAdjusting(null)}
                    onSuccess={() => { setAdjusting(null); fetchInventory(); }}
                />
            )}

            {/* Group Details Modal */}
            {detailGroup && (
                <GroupDetailModal
                    bloodGroup={detailGroup}
                    onClose={() => setDetailGroup(null)}
                />
            )}

            {/* Expired Modal */}
            {expiredOpen && (
                <ExpiredModal onClose={() => setExpiredOpen(false)} />
            )}
        </div>
    );
};

/* ---------------- Summary card ---------------- */
const SummaryCard = ({ icon: Icon, label, value, sub, color }) => (
    <div className={`rounded-2xl border p-4 ${color}`}>
        <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 opacity-80" />
            <p className="text-xs sm:text-sm font-medium opacity-90">{label}</p>
        </div>
        <p className="text-xl sm:text-2xl font-bold mt-1.5">{value}</p>
        {sub && <p className="text-[11px] sm:text-xs mt-1 opacity-80 truncate">{sub}</p>}
    </div>
);

/* ---------------- Adjust Modal ---------------- */
const AdjustModal = ({ item, onClose, onSuccess }) => {
    const [units, setUnits] = useState(item.units_available);
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const inputClass =
        'mt-1 block w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-rose-700';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await inventoryService.update(item.id, {
                units_available: parseFloat(units),
                reason: reason || null,
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal onClose={onClose} title={`Adjust ${item.blood_group} Stock`} icon={Settings2}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-lg p-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-700 text-white flex items-center justify-center font-bold shrink-0">
                        {item.blood_group}
                    </div>
                    <div className="text-sm">
                        <p className="text-slate-600">Current stock</p>
                        <p className="font-bold text-rose-700">{item.units_available} units</p>
                    </div>
                </div>

                <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <Hash className="w-4 h-4 text-rose-700" /> New Units *
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="0.5"
                        required
                        value={units}
                        onChange={(e) => setUnits(e.target.value)}
                        className={inputClass}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        Use this to correct data. Donations and issuances update it automatically.
                    </p>
                </div>

                <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <FileText className="w-4 h-4 text-rose-700" /> Reason (optional)
                    </label>
                    <textarea
                        rows="2"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className={inputClass}
                        placeholder="e.g. Manual correction, discard damaged unit"
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button type="submit" disabled={saving}
                        className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-rose-700 text-white rounded-lg hover:bg-rose-800 font-semibold text-sm disabled:opacity-50 shadow-sm">
                        {saving ? 'Saving...' : 'Save'}
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

/* ---------------- Group Details Modal ---------------- */
const GroupDetailModal = ({ bloodGroup, onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await inventoryService.getByGroup(bloodGroup);
                setData(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load details');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [bloodGroup]);

    const statusColor = (s) => {
        switch (s) {
            case 'AVAILABLE': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case 'EXPIRED': return 'bg-slate-100 text-slate-700 border border-slate-200';
            case 'USED': return 'bg-sky-50 text-sky-700 border border-sky-200';
            default: return 'bg-red-50 text-red-700 border border-red-200';
        }
    };

    return (
        <Modal onClose={onClose} title={`${bloodGroup} — Stock Details`} icon={Droplet}>
            {loading ? (
                <div className="p-6 text-center">
                    <Droplet className="w-8 h-8 text-rose-700 animate-pulse mx-auto" fill="currentColor" />
                </div>
            ) : error ? (
                <div className="text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            ) : data ? (
                <>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                            <p className="text-xs text-slate-600">Available</p>
                            <p className="text-xl font-bold text-rose-700">{data.inventory.units_available} units</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                            <p className="text-xs text-slate-600">Stock Level</p>
                            <p className="text-xl font-bold text-slate-900">{data.inventory.stock_level}</p>
                        </div>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-rose-700" />
                        Recent Donations ({data.donations.length})
                    </h4>
                    {data.donations.length === 0 ? (
                        <p className="text-sm text-slate-500">No donations yet.</p>
                    ) : (
                        <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {data.donations.map(d => (
                                <li key={d.id}
                                    className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs sm:text-sm">
                                    <div className="min-w-0">
                                        <p className="font-medium text-slate-900 truncate">{d.donor_name}</p>
                                        <p className="text-slate-500 text-[11px] sm:text-xs">
                                            {new Date(d.donation_date).toLocaleDateString()} → Exp {new Date(d.expiry_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${statusColor(d.status)}`}>
                                        {d.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            ) : null}
        </Modal>
    );
};

/* ---------------- Expired Modal ---------------- */
const ExpiredModal = ({ onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await inventoryService.getExpired();
                setData(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load expired blood');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <Modal onClose={onClose} title="Expired Blood Units" icon={AlertTriangle}>
            {loading ? (
                <div className="p-6 text-center">
                    <Droplet className="w-8 h-8 text-rose-700 animate-pulse mx-auto" fill="currentColor" />
                </div>
            ) : error ? (
                <div className="text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            ) : data ? (
                <>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-600">Total Expired</p>
                            <p className="text-lg font-bold text-red-700">{data.count} donations</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-600">Units Lost</p>
                            <p className="text-lg font-bold text-red-700">{data.total_units}</p>
                        </div>
                    </div>

                    {data.donations.length === 0 ? (
                        <div className="text-center py-4">
                            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">No expired units. All clear.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-rose-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">Donor</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">Group</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">Units</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">Expired</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {data.donations.map(d => (
                                        <tr key={d.id}>
                                            <td className="px-3 py-2 text-xs sm:text-sm text-slate-900 truncate max-w-[120px]">{d.donor_name}</td>
                                            <td className="px-3 py-2">
                                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px] sm:text-xs font-bold">
                                                    {d.blood_group}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-xs sm:text-sm text-slate-700">{d.units_collected}</td>
                                            <td className="px-3 py-2 text-xs sm:text-sm text-slate-700">
                                                {new Date(d.expiry_date).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            ) : null}
        </Modal>
    );
};

/* ---------------- Shared Modal ---------------- */
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

export default Inventory;