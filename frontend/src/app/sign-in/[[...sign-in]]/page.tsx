'use client';

export const dynamic = 'force-dynamic';

import { SignIn } from '@clerk/nextjs';
import { Award } from 'lucide-react';
import Link from 'next/link';

export default function SignInPage() {
    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
                            <Award className="h-8 w-8 text-indigo-600" />
                            <span className="text-2xl font-bold tracking-tight text-slate-900">CertifyHub</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900">Welcome Back</h1>
                        <p className="mt-3 text-slate-500 font-medium font-inter">Sign in to manage your professional certificates.</p>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-8">
                        <p className="text-sm text-indigo-700 font-medium">
                            First time here? <Link href="/sign-up" className="text-indigo-600 font-bold underline hover:text-indigo-800">Create a new account</Link> before logging in.
                        </p>
                    </div>

                    <SignIn
                        routing="path"
                        path="/sign-in"
                        signUpUrl="/sign-up"
                        afterSignInUrl="/dashboard"
                        appearance={{
                            elements: {
                                rootBox: 'w-full',
                                card: 'formal-card !shadow-none ring-0 border-0',
                                headerTitle: 'hidden',
                                headerSubtitle: 'hidden',
                                socialButtonsBlockButton: 'rounded-xl border-slate-200 hover:bg-slate-50 transition-colors',
                                formButtonPrimary: 'btn-primary !py-3 !rounded-xl !bg-indigo-600 hover:!bg-indigo-700',
                                formFieldInput: 'formal-input',
                                footerActionText: 'text-slate-500',
                                footerActionLink: 'text-indigo-600 hover:text-indigo-700 font-bold',
                                formResendCodeLink: 'text-indigo-600 font-bold'
                            },
                        }}
                    />
                </div>
            </div>

            <div className="hidden lg:flex flex-col justify-between p-12 bg-indigo-600 text-white order-first">
                <div className="flex items-center gap-2">
                    <Award className="h-8 w-8" />
                    <span className="text-2xl font-bold tracking-tight">CertifyHub</span>
                </div>

                <div className="max-w-md">
                    <h2 className="text-4xl font-bold mb-6">Your centralized command for professional credentials.</h2>
                    <p className="text-indigo-100 text-lg">
                        Access your dashboard to manage participants, design templates, and oversee high-volume distributions with ease.
                    </p>
                </div>

                <div className="text-sm text-indigo-200">
                    Trusted by industry leaders for automated certificate management.
                </div>
            </div>
        </div>
    );
}
