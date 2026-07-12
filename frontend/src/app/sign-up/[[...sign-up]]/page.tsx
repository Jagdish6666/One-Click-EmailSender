'use client';

export const dynamic = 'force-dynamic';

import { SignUp } from '@clerk/nextjs';
import { Award } from 'lucide-react';

export default function SignUpPage() {
    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <div className="hidden lg:flex flex-col justify-between p-12 bg-indigo-600 text-white">
                <div className="flex items-center gap-2">
                    <Award className="h-8 w-8" />
                    <span className="text-2xl font-bold tracking-tight">CertifyHub</span>
                </div>

                <div className="max-w-md">
                    <h2 className="text-4xl font-bold mb-6">Scale your distribution with precision.</h2>
                    <p className="text-indigo-100 text-lg">
                        Join hundreds of organizations automating their certificate delivery workflows with our professional-grade platform.
                    </p>
                </div>

                <div className="text-sm text-indigo-200">
                    © 2026 CertifyHub Pro. Reliable. Secure. Fast.
                </div>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-slate-50">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
                            <Award className="h-8 w-8 text-indigo-600" />
                            <span className="text-2xl font-bold tracking-tight text-slate-900">CertifyHub</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900">Create your account</h1>
                        <p className="mt-3 text-slate-500 font-medium font-inter">Enter your details to start using the dashboard.</p>
                    </div>

                    <SignUp
                        path="/sign-up"
                        routing="path"
                        signInUrl="/sign-in"
                        afterSignUpUrl="/dashboard?signup=success"
                        appearance={{
                            elements: {
                                rootBox: "w-full",
                                card: "formal-card !shadow-none ring-0 border-0",
                                headerTitle: "hidden",
                                headerSubtitle: "hidden",
                                socialButtonsBlockButton: "rounded-xl border-slate-200 hover:bg-slate-50 transition-colors",
                                formButtonPrimary: "btn-primary !py-3 !rounded-xl !bg-indigo-600 hover:!bg-indigo-700",
                                formFieldInput: "formal-input",
                                footerActionText: "text-slate-500",
                                footerActionLink: "text-indigo-600 hover:text-indigo-700 font-bold"
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
