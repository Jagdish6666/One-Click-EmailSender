'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth';
import { addParticipant, getParticipants, deleteParticipant, deleteParticipants, uploadParticipantsExcel, Participant, ParticipantFormData } from '@/services/participants';
import { sendCertificates, sendSelectedCertificates } from '@/services/certificates';
import { uploadTemplate, getActiveTemplate } from '@/services/templates';
import {
    LogOut, Send, Plus, RefreshCw, CheckCircle, AlertCircle, Clock,
    Trash2, LayoutGrid, FileType, Search, Award, User, Settings,
    MousePointer2, ChevronDown, ChevronUp, Minus, FileText, Image,
    CheckSquare, Square
} from 'lucide-react';

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthenticated, isLoading, logout } = useAuth();

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
    const [formData, setFormData] = useState<ParticipantFormData>({ name: '', email: '', eventName: '' });
    const [activeTemplate, setActiveTemplate] = useState<string>('');
    const [templateUploading, setTemplateUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [templateConfig, setTemplateConfig] = useState<{ id: number; nameY: number; eventY: number; fontSize: number } | null>(null);

    const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => setMessage(''), 5000);
    };

    // Fetch template config
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}/api/templates/active`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token') || ''}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.id) setTemplateConfig(data);
                }
            } catch (err) { /* ignore */ }
        };
        if (isAuthenticated) fetchConfig();
    }, [isAuthenticated]);

    const updateAlignment = async (updates: Partial<{ nameY: number; eventY: number; fontSize: number }>) => {
        if (!templateConfig) return;
        try {
            const newConfig = { ...templateConfig, ...updates };
            await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}/api/templates/alignment`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwt_token') || ''}`
                },
                body: JSON.stringify(newConfig)
            });
            setTemplateConfig(newConfig);
            showMessage('Alignment calibrated. Re-send a certificate to verify.', 'success');
        } catch (err) {
            showMessage('Calibration failed.', 'error');
        }
    };

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated) {
            router.push('/sign-in');
            return;
        }
        if (searchParams.get('signup') === 'success') {
            showMessage('Account created successfully! Welcome to your dashboard.', 'success');
            window.history.replaceState({}, '', '/dashboard');
        }
        fetchParticipants();
        fetchActiveTemplate();
    }, [isLoading, isAuthenticated, router]);

    const fetchParticipants = async () => {
        setLoading(true);
        try {
            const data = await getParticipants();
            setParticipants(data);
        } catch (err: any) {
            if (err.response?.status === 401) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveTemplate = async () => {
        try {
            const response = await getActiveTemplate();
            if ((response as any)?.name) setActiveTemplate((response as any).name);
        } catch (err) { /* ignore */ }
    };

    const toggleSelection = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = (ids: number[]) => {
        const allSelected = ids.every(id => selectedIds.includes(id));
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
        } else {
            setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
        }
    };

    const handleAddParticipant = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const trimmedData = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                eventName: formData.eventName.trim() || 'General Event'
            };
            await addParticipant(trimmedData);
            setFormData({ ...formData, name: '', email: '' });
            showMessage('Participant successfully added.', 'success');
            fetchParticipants();
        } catch (err: any) {
            showMessage('Error: ' + (err.response?.data?.message || err.message), 'error');
        }
    };

    const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setMessage('');
        try {
            const response = await uploadParticipantsExcel(file);
            showMessage(response.message, 'success');
            fetchParticipants();
        } catch (err: any) {
            showMessage('Upload Error: ' + (err.response?.data?.message || err.message), 'error');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleUploadTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setTemplateUploading(true);
        setMessage('');
        try {
            const response = await uploadTemplate(file);
            showMessage(response.message, 'success');
            setActiveTemplate(file.name);
            // Re-fetch template config for calibration panel
            const cfgRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}/api/templates/active`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token') || ''}` }
            });
            if (cfgRes.ok) {
                const data = await cfgRes.json();
                if (data?.id) setTemplateConfig(data);
            }
        } catch (err: any) {
            showMessage('Template Error: ' + (err.response?.data?.message || err.message), 'error');
        } finally {
            setTemplateUploading(false);
            e.target.value = '';
        }
    };

    const handleDeleteParticipant = async (id: number) => {
        if (!confirm('Confirm permanent deletion of this record?')) return;
        try {
            await deleteParticipant(id);
            setSelectedIds(prev => prev.filter(i => i !== id));
            fetchParticipants();
        } catch (err: any) {
            alert('Delete failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleSendCertificates = async () => {
        setSending(true);
        setMessage('');
        try {
            const response = await sendCertificates();
            showMessage(response.message, 'success');
            setTimeout(fetchParticipants, 2000);
        } catch (err: any) {
            showMessage(err.response?.data?.message || err.message || 'Process failed.', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleSendSelected = async () => {
        if (selectedIds.length === 0) return;
        setSending(true);
        setMessage('');
        try {
            const response = await sendSelectedCertificates(selectedIds);
            showMessage(response.message, 'success');
            setSelectedIds([]);
            setTimeout(fetchParticipants, 2000);
        } catch (err: any) {
            showMessage(err.response?.data?.message || err.message || 'Batch failed.', 'error');
        } finally {
            setSending(false);
        }
    };

    const filteredParticipants = useMemo(() => {
        if (!searchQuery) return participants;
        const q = searchQuery.toLowerCase();
        return participants.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q) ||
            (p.eventName || '').toLowerCase().includes(q)
        );
    }, [participants, searchQuery]);

    const participantsByEvent = useMemo(() => {
        const groups: Record<string, Participant[]> = {};
        filteredParticipants.forEach(p => {
            const event = p.eventName || 'General Event';
            if (!groups[event]) groups[event] = [];
            groups[event].push(p);
        });
        return groups;
    }, [filteredParticipants]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SENT':
                return <span className="status-badge bg-green-50 text-green-700 border border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Sent</span>;
            case 'FAILED':
                return <span className="status-badge bg-rose-50 text-rose-700 border border-rose-200"><AlertCircle className="w-3 h-3 mr-1" /> Failed</span>;
            default:
                return <span className="status-badge bg-amber-50 text-amber-600 border border-amber-200"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
        }
    };

    const stats = {
        total: participants.length,
        sent: participants.filter(p => p.status === 'SENT').length,
        pending: participants.filter(p => p.status === 'PENDING').length,
        failed: participants.filter(p => p.status === 'FAILED').length,
    };

    if (isLoading || (loading && !participants.length)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin" />
                    <span className="text-slate-500 font-medium">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            {/* Top Navigation */}
            <nav className="glass-nav border-b border-slate-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-600 rounded-lg">
                            <Award className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-slate-900 tracking-tight">
                            CertifyHub <span className="text-slate-400 font-medium text-sm ml-1">v2.0</span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search participants..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 rounded-xl text-sm transition-all outline-none w-64 border"
                        />
                    </div>
                    <div className="hidden sm:flex flex-col text-right">
                        <span className="text-sm font-semibold text-slate-900">{user?.username}</span>
                        <span className="text-xs text-indigo-600 font-bold">{user?.role}</span>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:block">Logout</span>
                    </button>
                </div>
            </nav>

            <main className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full space-y-8">
                {/* Status Message */}
                {message && (
                    <div className={`flex items-center gap-2 p-4 rounded-2xl text-sm font-medium border ${
                        messageType === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
                        messageType === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                        'bg-indigo-50 border-indigo-200 text-indigo-700'
                    }`}>
                        {messageType === 'success' ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> :
                         messageType === 'error' ? <AlertCircle className="h-4 w-4 flex-shrink-0" /> :
                         <Clock className="h-4 w-4 flex-shrink-0" />}
                        {message}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="formal-card p-6 bg-indigo-600 !border-none">
                        <div className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-2">Total</div>
                        <div className="text-3xl font-black text-white">{stats.total}</div>
                        <div className="mt-1 text-indigo-200 text-sm">Participants</div>
                    </div>
                    <div className="formal-card p-6">
                        <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Delivered</div>
                        <div className="text-3xl font-black text-emerald-600">{stats.sent}</div>
                        <div className="mt-1 text-slate-500 text-sm">Certificates sent</div>
                    </div>
                    <div className="formal-card p-6">
                        <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Pending</div>
                        <div className="text-3xl font-black text-amber-500">{stats.pending}</div>
                        <div className="mt-1 text-slate-500 text-sm">Awaiting delivery</div>
                    </div>
                    <div className="formal-card p-6">
                        <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Failed</div>
                        <div className="text-3xl font-black text-rose-500">{stats.failed}</div>
                        <div className="mt-1 text-slate-500 text-sm">Need attention</div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Template Calibration Panel */}
                        <div className="bg-slate-900 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-500/20 rounded-xl">
                                    <MousePointer2 className="h-5 w-5 text-indigo-400" />
                                </div>
                                <h3 className="text-lg font-bold">Template Calibration</h3>
                            </div>

                            {templateConfig ? (
                                <div className="space-y-5">
                                    {[
                                        { label: 'Name Position (Y)', key: 'nameY', color: 'text-indigo-400' },
                                        { label: 'Event Position (Y)', key: 'eventY', color: 'text-emerald-400' },
                                        { label: 'Font Size', key: 'fontSize', color: 'text-amber-400' },
                                    ].map(({ label, key, color }) => (
                                        <div key={key}>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">{label}</label>
                                            <div className="flex items-center justify-between bg-slate-800/50 rounded-2xl p-2 border border-slate-700">
                                                <button onClick={() => updateAlignment({ [key]: (templateConfig[key as keyof typeof templateConfig] as number) - 5 })} className="p-2 hover:bg-slate-700 rounded-xl transition-all">
                                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                                </button>
                                                <span className={`font-black font-mono ${color}`}>{templateConfig[key as keyof typeof templateConfig]}</span>
                                                <button onClick={() => updateAlignment({ [key]: (templateConfig[key as keyof typeof templateConfig] as number) + 5 })} className="p-2 hover:bg-slate-700 rounded-xl transition-all">
                                                    <ChevronUp className="h-4 w-4 text-slate-400" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <p className="text-[9px] text-slate-600 uppercase tracking-widest text-center">Adjustments apply to next certificate generation</p>
                                </div>
                            ) : (
                                <div className="py-6 text-center bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                                    <Settings className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">Upload a PDF template to enable calibration</p>
                                </div>
                            )}
                        </div>

                        {/* Add Participant Form */}
                        <div className="formal-card p-8">
                            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Plus className="h-5 w-5 text-indigo-600" />
                                Add Participant
                            </h2>
                            <form onSubmit={handleAddParticipant} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="formal-input" placeholder="Enter full name..." />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
                                    <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="formal-input" placeholder="email@example.com" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Event Name</label>
                                    <input type="text" required value={formData.eventName} onChange={e => setFormData({ ...formData, eventName: e.target.value })} className="formal-input" placeholder="e.g. Annual Summit 2026" />
                                </div>
                                <button type="submit" className="btn-primary w-full">
                                    <CheckCircle className="h-4 w-4" /> Add Participant
                                </button>
                            </form>

                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-3">Batch Import</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer">
                                        <div className="p-2 bg-slate-100 rounded-xl mb-2">
                                            <FileText className="h-5 w-5 text-slate-500" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500">{uploading ? 'Uploading...' : 'Excel File'}</span>
                                        <input type="file" accept=".xlsx,.xls" onChange={handleUploadExcel} className="hidden" disabled={uploading} />
                                    </label>
                                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer">
                                        <div className="p-2 bg-slate-100 rounded-xl mb-2">
                                            <Image className="h-5 w-5 text-slate-500" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500">{templateUploading ? 'Uploading...' : 'PDF Template'}</span>
                                        <input type="file" accept=".pdf" onChange={handleUploadTemplate} className="hidden" disabled={templateUploading} />
                                    </label>
                                </div>
                                {activeTemplate && (
                                    <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                                        <FileType className="h-3.5 w-3.5" />
                                        Active: {activeTemplate}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Actions Bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">Participants</h3>
                                <p className="text-slate-500 text-sm">Manage and send certificates to all participants.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={fetchParticipants} className="btn-secondary flex items-center gap-2 py-2.5">
                                    <RefreshCw className="h-4 w-4" />
                                    Refresh
                                </button>
                                {selectedIds.length > 0 && (
                                    <button onClick={handleSendSelected} disabled={sending} className="btn-secondary flex items-center gap-2 py-2.5 border-indigo-300 text-indigo-600 hover:bg-indigo-50">
                                        <Send className="h-4 w-4" />
                                        Send {selectedIds.length} Selected
                                    </button>
                                )}
                                <button onClick={handleSendCertificates} disabled={sending} className="btn-primary flex items-center gap-2">
                                    {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    {sending ? 'Processing...' : 'Send All Pending'}
                                </button>
                            </div>
                        </div>

                        {/* Participants Table */}
                        {Object.keys(participantsByEvent).length === 0 ? (
                            <div className="formal-card p-20 text-center">
                                <LayoutGrid className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                <h4 className="text-xl font-bold text-slate-900">No participants yet</h4>
                                <p className="text-slate-400 mt-2">Add participants manually or upload an Excel file.</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {Object.entries(participantsByEvent).map(([eventName, groupParticipants]) => (
                                    <div key={eventName} className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                                        {/* Group Header */}
                                        <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-indigo-600 rounded-2xl">
                                                    <Award className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black text-slate-900">{eventName}</h4>
                                                    <div className="flex items-center gap-3 mt-1 text-xs font-semibold">
                                                        <span className="text-slate-400">{groupParticipants.length} total</span>
                                                        <span className="text-emerald-600">{groupParticipants.filter(p => p.status === 'SENT').length} sent</span>
                                                        <span className="text-amber-500">{groupParticipants.filter(p => p.status === 'PENDING').length} pending</span>
                                                        {groupParticipants.some(p => p.status === 'FAILED') && (
                                                            <span className="text-rose-500">{groupParticipants.filter(p => p.status === 'FAILED').length} failed</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => toggleSelectAll(groupParticipants.map(p => p.id))}
                                                    className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-2 rounded-xl transition-all"
                                                >
                                                    {groupParticipants.every(p => selectedIds.includes(p.id)) ? 'Clear' : 'Select All'}
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (confirm(`Deploy certificates to all ${groupParticipants.length} participants in "${eventName}"?`)) {
                                                            setSending(true);
                                                            try {
                                                                await sendSelectedCertificates(groupParticipants.map(p => p.id));
                                                                showMessage(`Processing started for "${eventName}"`, 'success');
                                                                setTimeout(fetchParticipants, 2000);
                                                            } catch (err: any) {
                                                                showMessage(err.response?.data?.message || 'Failed', 'error');
                                                            } finally { setSending(false); }
                                                        }
                                                    }}
                                                    disabled={sending}
                                                    className="flex items-center gap-2 text-xs font-bold bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                                                >
                                                    <Send className="h-3.5 w-3.5" />
                                                    Send Group
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (confirm(`Delete all records for "${eventName}"?`)) {
                                                            await deleteParticipants(groupParticipants.map(p => p.id));
                                                            fetchParticipants();
                                                        }
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-xl"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Table */}
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-slate-100">
                                                <thead>
                                                    <tr className="bg-slate-50/30">
                                                        <th className="px-6 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-12">✓</th>
                                                        <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Participant</th>
                                                        <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                        <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Certificate ID</th>
                                                        <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {groupParticipants.map(p => (
                                                        <tr key={p.id} className={`transition-all ${selectedIds.includes(p.id) ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}>
                                                            <td className="px-6 py-4 text-center">
                                                                <button
                                                                    onClick={() => toggleSelection(p.id)}
                                                                    className={`inline-flex items-center justify-center p-1.5 rounded-lg border transition-all ${selectedIds.includes(p.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-300 hover:border-slate-400'}`}
                                                                >
                                                                    {selectedIds.includes(p.id) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                                                </button>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                                        {p.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-bold text-slate-900">{p.name}</div>
                                                                        <div className="text-xs text-slate-400">{p.email}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">{getStatusBadge(p.status)}</td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-xs font-mono text-slate-400 truncate block max-w-[140px]">{p.certificateId?.substring(0, 12)}...</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button
                                                                    onClick={() => handleDeleteParticipant(p.id)}
                                                                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function Dashboard() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" /></div>}>
            <DashboardContent />
        </Suspense>
    );
}
