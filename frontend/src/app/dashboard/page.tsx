'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, SignOutButton, UserButton } from '@clerk/nextjs';
import { setAuthTokenGetter } from '@/lib/axios';
import { addParticipant, getParticipants, deleteParticipant, deleteParticipants, uploadParticipantsExcel, Participant, ParticipantFormData } from '@/services/participants';
import { sendCertificates, sendSelectedCertificates } from '@/services/certificates';
import { uploadTemplate, getActiveTemplate } from '@/services/templates';
import { LogOut, Send, Plus, RefreshCw, CheckCircle, AlertCircle, Clock, Trash2, LayoutGrid, FileSpreadsheet, Upload, CheckSquare, Square, FileType, Search, Filter, Award, ChevronRight, User, Settings, MousePointer2, ChevronDown, ChevronUp, Minus, FileText, Image } from 'lucide-react';

export default function Dashboard() {
    const router = useRouter();
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState<ParticipantFormData>({ name: '', email: '', eventName: '' });
    const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
    const [activeTemplate, setActiveTemplate] = useState<string>('');
    const [templateUploading, setTemplateUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [templateConfig, setTemplateConfig] = useState<{ id: number, nameY: number, eventY: number, fontSize: number } | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const token = await getToken();
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/templates/active`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data) setTemplateConfig(data);
            } catch (err) { }
        };
        if (isLoaded && isSignedIn) fetchConfig();
    }, [isLoaded, isSignedIn, getToken]);

    const updateAlignment = async (updates: Partial<{ nameY: number, eventY: number, fontSize: number }>) => {
        if (!templateConfig) return;
        try {
            const token = await getToken();
            const newConfig = { ...templateConfig, ...updates };
            await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/templates/alignment`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newConfig)
            });
            setTemplateConfig(newConfig);
            setMessage('Alignment calibrated. Re-send a certificate to verify.');
        } catch (err) {
            setMessage('Calibration failed.');
        }
    };

    const searchParams = useSearchParams();

    useEffect(() => {
        if (!isLoaded) return;
        if (!isSignedIn) {
            router.push('/sign-in');
            return;
        }

        // Check for signup success message
        if (searchParams.get('signup') === 'success') {
            setMessage('Account created successfully! Welcome to your dashboard.');
            // Clear the URL parameter without refreshing
            window.history.replaceState({}, '', '/dashboard');
        }

        setAuthTokenGetter(getToken);
        fetchParticipants();
        fetchActiveTemplate();

        return () => setAuthTokenGetter(null);
    }, [isLoaded, isSignedIn, router, searchParams]);

    const fetchParticipants = async () => {
        setLoading(true);
        try {
            const data = await getParticipants();
            setParticipants(data);
        } catch (err) {
            console.error(err);
            if ((err as any).response?.status === 401) {
                router.push('/sign-in');
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = (ids: number[]) => {
        const allSelected = ids.every(id => selectedIds.includes(id));
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
        } else {
            setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
        }
    };

    const fetchActiveTemplate = async () => {
        try {
            const response = await getActiveTemplate();
            if (response.success) setActiveTemplate(response.message);
        } catch (err) {
            console.error('Failed to fetch template status', err);
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
            setExpandedEvents(prev => ({ ...prev, [trimmedData.eventName]: true }));
            setFormData({ ...formData, name: '', email: '' });
            setMessage('Participant successfully documented.');
            fetchParticipants();
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
            setMessage('Filing error: ' + errorMessage);
        }
    };

    const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setMessage('');
        try {
            const response = await uploadParticipantsExcel(file);
            setMessage(response.message);
            fetchParticipants();
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to upload document.';
            setMessage('Input Error: ' + errorMessage);
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
            setMessage(response.message);
            setActiveTemplate(file.name);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Template rejected.';
            setMessage('System Error: ' + errorMessage);
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
            alert('Operation failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleSendCertificates = async () => {
        setSending(true);
        setMessage('');
        try {
            const response = await sendCertificates();
            setMessage(response.message);
            fetchParticipants();
        } catch (err: any) {
            setMessage(err.response?.data?.message || err.message || 'Process failed.');
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
            setMessage(response.message);
            setSelectedIds([]);
            fetchParticipants();
        } catch (err: any) {
            setMessage(err.response?.data?.message || err.message || 'Batch failed.');
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
                return <span className="status-badge bg-green-50 text-green-700 border border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Delivered</span>;
            case 'FAILED':
                return <span className="status-badge bg-rose-50 text-rose-700 border border-rose-200"><AlertCircle className="w-3 h-3 mr-1" /> Terminated</span>;
            default:
                return <span className="status-badge bg-slate-50 text-slate-600 border border-slate-200"><Clock className="w-3 h-3 mr-1" /> Queued</span>;
        }
    };

    if (loading && !participants.length) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin" />
                    <span className="text-slate-500 font-medium">Synchronizing records...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Top Navigation */}
            <nav className="glass-nav border-b border-slate-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-600 rounded-lg">
                            <Award className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-slate-900 tracking-tight">CertifyHub <span className="text-slate-400 font-medium font-inter text-sm ml-1">v1.2</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                        <button className="px-4 py-1.5 text-sm font-semibold bg-white text-indigo-600 rounded-lg shadow-sm">Overview</button>
                        <button className="px-4 py-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">Analytics</button>
                        <button className="px-4 py-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">Integrations</button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find records..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 rounded-xl text-sm transition-all outline-none w-64"
                        />
                    </div>
                    <div className="h-6 w-px bg-slate-200 mx-1" />
                    <UserButton afterSignOutUrl="/" />
                </div>
            </nav>

            <main className="flex-1 bg-slate-50/50 p-6 lg:p-10">
                <div className="max-w-[1600px] mx-auto space-y-8 text-slate-900 border-none outline-none ring-0">
                    {/* Stats Header */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="formal-card p-6 bg-indigo-600 !border-none">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-white/10 rounded-xl text-white">
                                    <Plus className="h-6 w-6" />
                                </div>
                                <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Total participants</span>
                            </div>
                            <div className="text-3xl font-black text-white">{participants.length}</div>
                            <div className="mt-2 text-indigo-100 text-sm font-medium">Record across {Object.keys(participantsByEvent).length} events</div>
                        </div>

                        <div className="formal-card p-6 border-slate-200/60 bg-white">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                                    <CheckCircle className="h-6 w-6" />
                                </div>
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Success rate</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900">
                                {participants.length ? Math.round((participants.filter(p => p.status === 'SENT').length / participants.length) * 100) : 0}%
                            </div>
                            <div className="mt-2 text-slate-500 text-sm font-medium">Based on recent distributions</div>
                        </div>

                        <div className="formal-card p-6 border-slate-200/60 bg-white">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                                    <FileType className="h-6 w-6" />
                                </div>
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Design status</span>
                            </div>
                            <div className="text-xl font-bold text-slate-900 truncate">
                                {activeTemplate || 'No Template'}
                            </div>
                            <div className="mt-2 text-slate-500 text-sm font-medium">Current active PDF layout</div>
                        </div>

                        <div className="formal-card p-6 border-slate-200/60 bg-white">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                                    <RefreshCw className="h-6 w-6" />
                                </div>
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">System Load</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900">Stable</div>
                            <div className="mt-2 text-slate-500 text-sm font-medium">Syncing with Java Backend</div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-8 items-start">
                        {/* Sidebar: Calibration & Entry */}
                        <div className="lg:col-span-4 space-y-8">
                            {/* Calibration Panel */}
                            <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-100/20 border border-slate-800 text-white overflow-hidden relative group">
                                <div className="absolute top-0 right-0 p-6 opacity-20 transform translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700">
                                    <Settings className="h-24 w-24 text-indigo-400" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-indigo-500/20 rounded-xl">
                                            <MousePointer2 className="h-5 w-5 text-indigo-400" />
                                        </div>
                                        <h3 className="text-xl font-black tracking-tight">Precision Alignment</h3>
                                    </div>

                                    {templateConfig ? (
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 block">Participant Name (Vertical)</label>
                                                <div className="flex items-center justify-between bg-slate-800/50 rounded-2xl p-2 border border-slate-700">
                                                    <button onClick={() => updateAlignment({ nameY: (templateConfig.nameY || 0) - 5 })} className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"><ChevronDown className="h-5 w-5" /></button>
                                                    <span className="font-black font-mono text-indigo-400">{templateConfig.nameY || 0}px</span>
                                                    <button onClick={() => updateAlignment({ nameY: (templateConfig.nameY || 0) + 5 })} className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"><ChevronUp className="h-5 w-5" /></button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 block">Event Title (Vertical)</label>
                                                <div className="flex items-center justify-between bg-slate-800/50 rounded-2xl p-2 border border-slate-700">
                                                    <button onClick={() => updateAlignment({ eventY: (templateConfig.eventY || 0) - 5 })} className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"><ChevronDown className="h-5 w-5" /></button>
                                                    <span className="font-black font-mono text-emerald-400">{templateConfig.eventY || 0}px</span>
                                                    <button onClick={() => updateAlignment({ eventY: (templateConfig.eventY || 0) + 5 })} className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"><ChevronUp className="h-5 w-5" /></button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 block">Name Font Scale</label>
                                                <div className="flex items-center justify-between bg-slate-800/50 rounded-2xl p-2 border border-slate-700">
                                                    <button onClick={() => updateAlignment({ fontSize: Math.max(10, (templateConfig.fontSize || 42) - 2) })} className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"><Minus className="h-4 w-4" /></button>
                                                    <span className="font-black font-mono text-amber-400">{templateConfig.fontSize || 42}pt</span>
                                                    <button onClick={() => updateAlignment({ fontSize: (templateConfig.fontSize || 42) + 2 })} className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"><Plus className="h-4 w-4" /></button>
                                                </div>
                                            </div>

                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest text-center mt-4">Adjustments apply to next deployment</p>
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
                                            <p className="text-sm font-bold text-slate-500">Upload a template to enable calibration</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Entry Point */}
                            <div className="glass-card bg-white border-slate-200/60 p-10 rounded-[3rem] shadow-[0_20px_50px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                                <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                                    <Plus className="h-6 w-6 text-indigo-600" />
                                    Entry Point
                                </h2>

                                <form onSubmit={handleAddParticipant} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Legal Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="formal-input"
                                            placeholder="Enter full name..."
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Communication</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="formal-input"
                                            placeholder="Recipient email address..."
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Event Reference</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.eventName}
                                            onChange={e => setFormData({ ...formData, eventName: e.target.value })}
                                            className="formal-input"
                                            placeholder="e.g. Annual Summit 2026"
                                        />
                                    </div>
                                    <button type="submit" className="btn-primary w-full mt-4 flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5" />
                                        Commit Record
                                    </button>
                                </form>

                                <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">Or Batch Import</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-3xl hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer group/upload">
                                            <div className="p-3 bg-slate-100 rounded-2xl group-hover/upload:bg-indigo-600 group-hover/upload:text-white transition-colors">
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-500 mt-3">Excel Data</span>
                                            <input type="file" accept=".xlsx,.xls" onChange={handleUploadExcel} className="hidden" />
                                        </label>
                                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-3xl hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer group/upload">
                                            <div className="p-3 bg-slate-100 rounded-2xl group-hover/upload:bg-indigo-600 group-hover/upload:text-white transition-colors">
                                                <Image className="h-6 w-6" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-500 mt-3">PDF Template</span>
                                            <input type="file" accept=".pdf" onChange={handleUploadTemplate} className="hidden" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* List Section */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                            <LayoutGrid className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-slate-900">{Object.keys(participantsByEvent).length}</div>
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Events</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-slate-900">{participants.length}</div>
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Records</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                            <Send className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-slate-900">
                                                {participants.length > 0 ? Math.round((participants.filter(p => p.status === 'SENT').length / participants.length) * 100) : 0}%
                                            </div>
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Delivery Rate</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900">Distributed Records</h3>
                                    <p className="text-slate-500 font-semibold text-sm font-inter">Manage and oversee all certificate deployments.</p>
                                </div>

                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={handleSendCertificates}
                                        disabled={sending}
                                        className="btn-primary gap-2 flex-hidden"
                                    >
                                        <Send className="h-4 w-4" />
                                        Deploy All
                                    </button>
                                </div>
                            </div>

                            {participants.length === 0 ? (
                                <div className="bg-white rounded-[3rem] border border-slate-100 p-20 text-center shadow-sm">
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="p-6 bg-slate-50 rounded-full">
                                            <LayoutGrid className="h-12 w-12 text-slate-200" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-900">No records found</h4>
                                            <p className="text-slate-400 font-medium mt-2">Start by adding a single participant or<br />uploading a batch via Excel.</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-12">
                                    {Object.entries(participantsByEvent).map(([eventName, groupParticipants]) => (
                                        <div key={eventName} className="bg-white rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgb(0,0,0,0.08)] group">
                                            {/* Box Header */}
                                            <div className="px-8 py-7 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="p-3.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100 transform group-hover:scale-110 transition-transform duration-500">
                                                        <Award className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-black text-slate-900 tracking-tight">{eventName}</h4>
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                                                <User className="h-3 w-3" />
                                                                {groupParticipants.length} Total
                                                            </span>
                                                            <div className="h-1 w-1 bg-slate-300 rounded-full" />
                                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                                                <CheckCircle className="h-3 w-3" />
                                                                {groupParticipants.filter(p => p.status === 'SENT').length} Success
                                                            </span>
                                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                                                <Clock className="h-3 w-3" />
                                                                {groupParticipants.filter(p => p.status === 'PENDING').length} Pending
                                                            </span>
                                                            {groupParticipants.some(p => p.status === 'FAILED') && (
                                                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    {groupParticipants.filter(p => p.status === 'FAILED').length} Errors
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center bg-slate-100 rounded-2xl p-1.5 gap-1">
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm(`Deploy certificates to all ${groupParticipants.length} participants in ${eventName}?`)) {
                                                                    setSending(true);
                                                                    try {
                                                                        await sendSelectedCertificates(groupParticipants.map(p => p.id));
                                                                        setMessage(`Group deployment initiated for ${eventName}.`);
                                                                        fetchParticipants();
                                                                    } catch (err) {
                                                                        setMessage('Group deployment failed.');
                                                                    } finally {
                                                                        setSending(false);
                                                                    }
                                                                }
                                                            }}
                                                            disabled={sending}
                                                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white shadow-sm px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                                                        >
                                                            <Send className="h-3.5 w-3.5" />
                                                            Deploy Group
                                                        </button>
                                                        <button
                                                            onClick={() => toggleSelectAll(groupParticipants.map(p => p.id))}
                                                            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 px-4 py-2.5 rounded-xl transition-all"
                                                        >
                                                            {groupParticipants.every(p => selectedIds.includes(p.id)) ? 'Clear' : 'Select'}
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm(`Permanently remove all records for ${eventName}?`)) {
                                                                    try {
                                                                        await deleteParticipants(groupParticipants.map(p => p.id));
                                                                        setMessage(`Event ${eventName} cleared.`);
                                                                        fetchParticipants();
                                                                    } catch (err) {
                                                                        setMessage('Failed to clear event.');
                                                                    }
                                                                }
                                                            }}
                                                            className="p-2.5 text-slate-400 hover:text-rose-600 transition-colors"
                                                            title="Delete Event Group"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Box Body */}
                                            <div className="px-8 py-6">
                                                <div className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white">
                                                    <table className="min-w-full divide-y divide-slate-100">
                                                        <thead>
                                                            <tr className="bg-slate-50/30">
                                                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-12 text-center">Select</th>
                                                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Profile</th>
                                                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transmission</th>
                                                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {groupParticipants.map(p => (
                                                                <tr
                                                                    key={p.id}
                                                                    className={`group/row transition-all ${selectedIds.includes(p.id) ? 'bg-indigo-50/20' : 'hover:bg-slate-50/30'}`}
                                                                >
                                                                    <td className="px-6 py-5 text-center">
                                                                        <button
                                                                            onClick={() => toggleSelection(p.id)}
                                                                            className={`inline-flex items-center justify-center p-2 rounded-xl transition-all border ${selectedIds.includes(p.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 scale-110' : 'bg-white border-slate-200 text-slate-200 hover:border-slate-300'}`}
                                                                        >
                                                                            <CheckSquare className={`h-4.5 w-4.5 ${selectedIds.includes(p.id) ? 'block' : 'hidden'}`} />
                                                                            <Square className={`h-4.5 w-4.5 ${selectedIds.includes(p.id) ? 'hidden' : 'block'}`} />
                                                                        </button>
                                                                    </td>
                                                                    <td className="px-6 py-5">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-sm uppercase">
                                                                                {p.name.charAt(0)}
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-sm font-bold text-slate-900 group-hover/row:text-indigo-600 transition-colors">{p.name}</div>
                                                                                <div className="text-xs font-medium text-slate-400 font-inter">{p.email}</div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-5">
                                                                        {getStatusBadge(p.status)}
                                                                    </td>
                                                                    <td className="px-6 py-5 text-right">
                                                                        <button
                                                                            onClick={() => handleDeleteParticipant(p.id)}
                                                                            className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                                            title="Delete Entry"
                                                                        >
                                                                            <Trash2 className="h-4.5 w-4.5" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
