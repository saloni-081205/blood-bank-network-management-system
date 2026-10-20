import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle, Droplet, Hash, Gauge, FileText, UserRound,
    AlertCircle, CheckCircle2, ArrowLeft, Siren, Info,
} from 'lucide-react';
import { requestService } from '../../services/requestService';

const CreateEmergencyRequest = () => {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [confirm, setConfirm] = useState(false);
    const [formData, setFormData] = useState({
        blood_group: 'O-',
        units_requested: 1,
        urgency: 'CRITICAL',
        reason: '',
        patient_info: '',
    });

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setMessage({ type: '', text: '' });
        if (confirm) setConfirm(false);
    };

    const combinedReason = () => {
        const parts = [];
        if (formData.reason?.trim()) parts.push(formData.reason.trim());
        if (formData.patient_info?.trim()) parts.push(`Patient/Emergency: ${formData.patient_info.trim()}`);
        return parts.join('\n') || null;
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!confirm) {
            setConfirm(true);
            return;
        }
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await requestService.create({
                blood_group: formData.blood_group,
                units_requested: parseFloat(formData.units_requested),
                request_type: 'EMERGENCY',
                urgency: formData.urgency,
                reason: combinedReason(),
            });
            setMessage({ type: 'success', text: 'Emergency request created. Admins have been alerted.' });
            setTimeout(() => navigate('/hospital/requests'), 1200);
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message
                    || err.response?.data?.errors?.[0]?.msg
                    || 'Failed to create emergency request',
            });
            setConfirm(false);
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        'mt-1 block w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-shadow';

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <button onClick={() => navigate('/hospital')}
                    className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-rose-700 mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to dashboard
                </button>

                {/* Emergency banner */}
                <div className="mb-4 bg-red-600 text-white rounded-2xl p-4 sm:p-5 shadow-xl flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <Siren className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold">Emergency Blood Request</h1>
                        <p className="text-xs sm:text-sm opacity-90 mt-0.5">
                            Only use this for life-threatening situations. Admins are alerted immediately.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border-t-4 border-red-600">
                    {message.text && (
                        <div className={`flex items-start gap-2 mb-5 px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-sm border ${
                            message.type === 'success'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                            {message.type === 'success'
                                ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                                : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                            <span>{message.text}</span>
                        </div>
                    )}

                    {confirm && !message.text && (
                        <div className="flex items-start gap-2 mb-5 bg-red-50 border-l-4 border-red-600 p-3 sm:p-4 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-700 mt-0.5 shrink-0" />
                            <p className="text-sm text-red-800 font-medium">
                                Press <span className="font-bold">Submit Emergency Request</span> again to confirm.
                            </p>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <Droplet className="w-4 h-4 text-red-600" fill="currentColor" /> Blood Group *
                                </label>
                                <select name="blood_group" value={formData.blood_group}
                                    onChange={handleChange} required className={inputClass}>
                                    {bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <Hash className="w-4 h-4 text-red-600" /> Units Needed *
                                </label>
                                <input type="number" name="units_requested" min="0.5" step="0.5" required
                                    value={formData.units_requested} onChange={handleChange}
                                    className={inputClass} />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <Gauge className="w-4 h-4 text-red-600" /> Urgency
                                </label>
                                <select name="urgency" value={formData.urgency}
                                    onChange={handleChange} className={inputClass}>
                                    <option value="CRITICAL">Critical (default)</option>
                                    <option value="HIGH">High</option>
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <FileText className="w-4 h-4 text-red-600" /> Reason *
                                </label>
                                <textarea name="reason" rows="3" required value={formData.reason}
                                    onChange={handleChange} className={inputClass}
                                    placeholder="e.g. Road accident, major surgery, severe bleeding" />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <UserRound className="w-4 h-4 text-red-600" /> Patient / Emergency Info (optional)
                                </label>
                                <textarea name="patient_info" rows="2" value={formData.patient_info}
                                    onChange={handleChange} className={inputClass}
                                    placeholder="e.g. ICU bed 12, Patient ID 44921" />
                            </div>
                        </div>

                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-xs sm:text-sm text-red-800">
                            <Info className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>Emergency requests default to CRITICAL urgency and are sorted first for admins.</span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button type="submit" disabled={saving}
                                className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-lg font-semibold text-sm sm:text-base transition-colors disabled:opacity-50 text-white shadow-sm ${
                                    confirm ? 'bg-red-800 hover:bg-red-900' : 'bg-red-600 hover:bg-red-700'
                                }`}>
                                <AlertTriangle className="w-4 h-4" />
                                {saving
                                    ? 'Submitting...'
                                    : confirm
                                        ? 'Submit Emergency Request'
                                        : 'Request Emergency Blood'}
                            </button>
                            {confirm && !saving && (
                                <button type="button" onClick={() => setConfirm(false)}
                                    className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm sm:text-base">
                                    Cancel
                                </button>
                            )}
                            <button type="button" onClick={() => navigate('/hospital')}
                                className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm sm:text-base">
                                Back
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateEmergencyRequest;