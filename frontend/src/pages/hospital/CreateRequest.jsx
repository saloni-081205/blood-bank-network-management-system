import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Droplet, Hash, AlertTriangle, FileText, AlertCircle,
    CheckCircle2, Info, ClipboardList, ArrowLeft, Gauge,
} from 'lucide-react';
import { requestService } from '../../services/requestService';

const CreateRequest = () => {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        blood_group: 'A+',
        units_requested: 1,
        request_type: 'NORMAL',
        urgency: 'MEDIUM',
        reason: '',
    });

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setMessage({ type: '', text: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await requestService.create({
                blood_group: formData.blood_group,
                units_requested: parseFloat(formData.units_requested),
                request_type: formData.request_type,
                urgency: formData.urgency,
                reason: formData.reason || null,
            });
            setMessage({ type: 'success', text: 'Request created successfully!' });
            setTimeout(() => navigate('/hospital/requests'), 1000);
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message
                    || err.response?.data?.errors?.[0]?.msg
                    || 'Failed to create request',
            });
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        'mt-1 block w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-rose-700 transition-shadow';

    const isEmergency = formData.request_type === 'EMERGENCY';

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <button onClick={() => navigate('/hospital')}
                    className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-rose-700 mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to dashboard
                </button>

                <div className="mb-6 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-rose-700 flex items-center justify-center shadow-sm">
                        <ClipboardList className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Create Blood Request</h1>
                        <p className="text-sm sm:text-base text-slate-600 mt-0.5">
                            Submit a request for blood units
                        </p>
                    </div>
                </div>

                <div className={`bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border-t-4 ${
                    isEmergency ? 'border-red-600' : 'border-rose-700'
                }`}>
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

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Request Type Toggle */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Request Type</label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button type="button"
                                    onClick={() => setFormData({ ...formData, request_type: 'NORMAL' })}
                                    className={`flex items-center justify-center gap-2 flex-1 py-2.5 sm:py-2 px-4 rounded-lg font-medium transition-colors text-sm sm:text-base border-2 ${
                                        !isEmergency
                                            ? 'bg-rose-700 text-white border-rose-700'
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'
                                    }`}>
                                    <Droplet className="w-4 h-4" /> Normal
                                </button>
                                <button type="button"
                                    onClick={() => setFormData({ ...formData, request_type: 'EMERGENCY', urgency: 'CRITICAL' })}
                                    className={`flex items-center justify-center gap-2 flex-1 py-2.5 sm:py-2 px-4 rounded-lg font-medium transition-colors text-sm sm:text-base border-2 ${
                                        isEmergency
                                            ? 'bg-red-600 text-white border-red-600'
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-red-300'
                                    }`}>
                                    <AlertTriangle className="w-4 h-4" /> Emergency
                                </button>
                            </div>
                        </div>

                        {isEmergency && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span><span className="font-semibold">Emergency request</span> — admins will be notified immediately and it will be prioritized.</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <Droplet className="w-4 h-4 text-rose-700" fill="currentColor" /> Blood Group *
                                </label>
                                <select name="blood_group" value={formData.blood_group}
                                    onChange={handleChange} required className={inputClass}>
                                    {bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <Hash className="w-4 h-4 text-rose-700" /> Units Requested *
                                </label>
                                <input type="number" name="units_requested" min="0.5" step="0.5" required
                                    value={formData.units_requested} onChange={handleChange}
                                    className={inputClass} />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <Gauge className="w-4 h-4 text-rose-700" /> Urgency
                                </label>
                                <select name="urgency" value={formData.urgency}
                                    onChange={handleChange} className={inputClass}>
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="CRITICAL">Critical</option>
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <FileText className="w-4 h-4 text-rose-700" /> Reason (optional)
                                </label>
                                <textarea name="reason" rows="3" value={formData.reason}
                                    onChange={handleChange} className={inputClass}
                                    placeholder="Reason for this request (e.g. surgery, accident, ongoing treatment)" />
                            </div>
                        </div>

                        <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs sm:text-sm text-rose-800">
                            <Info className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>Your request will be reviewed by an administrator.</span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button type="submit" disabled={saving}
                                className={`w-full sm:w-auto px-6 py-2.5 sm:py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm sm:text-base text-white shadow-sm ${
                                    isEmergency
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-rose-700 hover:bg-rose-800'
                                }`}>
                                {saving ? 'Submitting...' : 'Submit Request'}
                            </button>
                            <button type="button"
                                onClick={() => navigate('/hospital/requests')}
                                className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors text-sm sm:text-base">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateRequest;