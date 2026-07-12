'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Award, Mail, Shield, Zap, CheckCircle2 } from 'lucide-react';

export default function Home() {
    const router = useRouter();
    const { isLoaded, isSignedIn } = useAuth();

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            router.push('/dashboard');
        }
    }, [isLoaded, isSignedIn, router]);

    if (!isLoaded) return null;

    return (
        <div className="flex flex-col min-h-screen">
            {/* Navigation */}
            <nav className="glass-nav px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-600 rounded-lg">
                        <Award className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">CertifyHub</span>
                </div>
                {!isSignedIn && (
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/sign-in')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
                            Sign In
                        </button>
                        <button onClick={() => router.push('/sign-up')} className="btn-primary py-2 px-5 !text-xs">
                            Get Started
                        </button>
                    </div>
                )}
            </nav>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="px-6 pt-20 pb-32 max-w-7xl mx-auto text-center lg:text-left lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold mb-6">
                            <Zap className="h-3 w-3" />
                            NEW: AUTOMATED PDF GENERATION
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-tight mb-6">
                            Automate your <span className="text-indigo-600">Certificate</span> distribution
                        </h1>
                        <p className="text-xl text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0">
                            The most secure and formal way to generate, track, and send PDF certificates to your participants in seconds.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <button onClick={() => router.push('/sign-up')} className="btn-primary text-base px-8 py-4">
                                Start Scaling Now
                            </button>
                            <button className="btn-secondary text-base px-8 py-4 flex items-center gap-2">
                                <Shield className="h-5 w-5 text-slate-400" />
                                Secure with Clerk
                            </button>
                        </div>

                        <div className="mt-12 flex items-center gap-6 justify-center lg:justify-start grayscale opacity-50">
                            <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Powered By</span>
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 lg:mt-0 relative">
                        <div className="absolute -inset-4 bg-indigo-500/10 rounded-[2.5rem] blur-3xl" />
                        <div className="formal-card p-2 relative overflow-hidden">
                            <div className="bg-slate-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center text-white">
                                <div className="p-8 text-center">
                                    <Mail className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
                                    <div className="text-lg font-bold mb-2">Automated Workflow</div>
                                    <div className="text-sm text-slate-400 max-w-xs mx-auto">Upload Excel, design template, and click send. We handle the rest synchronously.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="bg-white border-y border-slate-200 py-24 px-6">
                    <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">High Performance</h3>
                            <p className="text-slate-600">Generate thousands of PDF certificates in minutes using our optimized Java backend.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                <Shield className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Secure by Default</h3>
                            <p className="text-slate-600">Enterprise-grade authentication powered by Clerk OAuth2 and JWT validation.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                <Zap className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Live Status Tracking</h3>
                            <p className="text-slate-600">Monitor your email delivery status in real-time. Know exactly when each participant receives their certificate.</p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-slate-50 border-t border-slate-200 py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500 font-medium font-inter">
                    <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-indigo-600" />
                        <span className="text-slate-900 font-bold">CertifyHub</span>
                    </div>
                    <div>© 2026 CertifyHub Professional Distribution. All rights reserved.</div>
                    <div className="flex items-center gap-6">
                        <a href="#" className="hover:text-indigo-600">Privacy Policy</a>
                        <a href="#" className="hover:text-indigo-600">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
