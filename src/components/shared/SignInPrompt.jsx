'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { signIn } from 'next-auth/react';
import { LogIn } from 'lucide-react';

const SignInPrompt = ({ open, onOpenChange, featureDescription }) => {
    const handleSignIn = () => {
        const callbackUrl = typeof window !== 'undefined' ? window.location.pathname : '/dashboard';
        signIn("google", { callbackUrl });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] sm:w-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-0 shadow-2xl rounded-2xl">
                <DialogHeader className="px-6 pt-8 pb-2 text-center">
                    {/* Icon */}
                    <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <LogIn className="w-8 h-8 text-white" />
                    </div>

                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white text-center">
                        Sign in to continue
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                        {featureDescription || 'Sign in with your BRACU G-Suite account to access all features.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 pb-8 pt-4 flex flex-col gap-3">
                    {/* G-Suite Sign In Button */}
                    <button
                        onClick={handleSignIn}
                        className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                        >
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with G-Suite
                    </button>

                    {/* Caption */}
                    <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                        Only @g.bracu.ac.bd accounts are supported
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SignInPrompt;
