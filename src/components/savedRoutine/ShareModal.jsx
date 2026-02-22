import React, { useState } from 'react';
import { Share2, X, Link, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

import { copyToClipboard } from '@/lib/utils';

const ShareModal = ({ routineId, type = 'routine', onClose }) => {
    const [linkCopied, setLinkCopied] = useState(false);
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${type}/${routineId}`;
    const shareText = `Check out my routine on B.O.R.A.C.L.E!`;

    const copyLink = async () => {
        const success = await copyToClipboard(shareUrl);
        if (success) {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 3000);
            toast.success('Link copied to clipboard!');
        } else {
            toast.error('Failed to copy link');
        }
    };

    return (
        <>
            {/* Blurred backdrop overlay */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-300"
                onClick={onClose}
            />
            {/* Centered modal */}
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6 max-w-md w-full shadow-2xl pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <Share2 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Share Routine</h2>
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Copiable Link */}
                    <div className="mb-5">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Shareable Link</label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 min-w-0">
                                <Link className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate font-mono">{shareUrl}</span>
                            </div>
                            <button
                                onClick={copyLink}
                                className={`flex-shrink-0 px-3 py-2.5 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-all ${linkCopied
                                    ? 'bg-green-600 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {linkCopied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

export default ShareModal;
