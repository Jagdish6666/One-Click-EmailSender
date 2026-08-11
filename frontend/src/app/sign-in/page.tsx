'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth';
import { loginUser } from '@/services/auth';
import { Award, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function SignInPage() {
    const router = useRouter();
    const { login, isAuthenticated } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if already logged in
    if (isAuthenticated) {
        router.push('/dashboard');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await loginUser(email, password);
            login(response.token, {
                username: response.username,
                email: response.email,
                role: response.role,
            });
            router.push('/dashboard');
        } catch (err: any) {
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Invalid email or password';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-10">
                    <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                        <Award className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight">CertifyHub</span>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-10">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Welcome back</h1>
                        <p className="text-slate-500 font-medium text-sm">Sign in to your account to continue</p>
                    </div>

                    {error && (
                        <div className="mb-6 flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-medium">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="formal-input pl-11"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="formal-input pl-11"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base"
                        >
                            {loading ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-500">
                            Don&apos;t have an account?{' '}
                            <button
                                onClick={() => router.push('/sign-up')}
                                className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
                            >
                                Create one
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
