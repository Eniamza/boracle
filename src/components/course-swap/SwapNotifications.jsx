'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Copy, CheckCircle, XCircle, ArrowRightLeft, User, Mail, Loader2, Tag, ChevronDown, ChevronUp, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/utils';






const SwapNotifications = ({ isMobile, swaps = [], courses = [] }) => {
    const [open, setOpen] = useState(false);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    const getCourseBySection = (sectionId) => {
        if (!courses || courses.length === 0) return null;
        return courses.find(c => c.sectionId === sectionId);
    };

    const pendingCount = requests.filter(r =>
        (r.type === 'INCOMING' && r.status === 'PENDING') ||
        (r.type === 'OUTGOING' && r.status !== 'PENDING' && !r.isRead)
    ).length;

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        if (open) {
            fetchRequests().then(data => {
                if (data && data.some(r => r.type === 'OUTGOING' && r.status !== 'PENDING' && !r.isRead)) {
                    fetch('/api/swap/requests', { method: 'PATCH' }).catch(console.error);
                    // Optimistically clear the dots immediately
                    setRequests(data.map(r => r.type === 'OUTGOING' ? { ...r, isRead: true } : r));
                }
            });
        }
    }, [open]);

    useEffect(() => {
        if (!open || !isMobile) return;
        window.history.pushState({ drawerOpen: true }, '');
        const handlePopState = () => setOpen(false);
        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
            if (window.history.state?.drawerOpen) {
                window.history.back();
            }
        };
    }, [open, isMobile]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/swap/requests');
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
                return data;
            }
        } catch (error) {
            console.error('Failed to fetch requests', error);
            toast.error('Failed to load swap requests');
        } finally {
            setLoading(false);
        }
        return null;
    };

    const handleStatusUpdate = async (requestId, newStatus) => {
        try {
            const res = await fetch(`/api/swap/requests/${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                toast.success(`Request ${newStatus.toLowerCase()}!`);
                fetchRequests();
            } else {
                toast.error('Failed to update request');
            }
        } catch (error) {
            console.error('Error updating status', error);
            toast.error('An error occurred');
        }
    };

    const handleCopyEmail = async (text) => {
        const success = await copyToClipboard(text);
        if (success) {
            toast.success('Email copied to clipboard!');
        } else {
            toast.error('Failed to copy email');
        }
    };

    const RequestList = () => {
        if (loading && requests.length === 0) {
            return (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            );
        }

        if (requests.length === 0) {
            return (
                <div className="text-center p-8 text-gray-500">
                    <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>No swap requests yet.</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800 max-h-[60vh] overflow-y-auto px-4 sm:px-2">
                {requests.map((req) => {
                    const swap = swaps?.find(s => s.swapId === req.swapId);
                    const offeredCourse = getCourseBySection(req.getSectionId);
                    const displayedName = offeredCourse ? `${offeredCourse.courseCode} - ${offeredCourse.sectionName}` : `Section ${req.getSectionId}`;

                    return (
                        <div key={req.requestId} className="py-4 px-2 hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors flex flex-col">

                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant={req.type === 'INCOMING' ? 'default' : 'secondary'} className={req.type === 'INCOMING' ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-none' : 'shadow-none'}>
                                        {req.type === 'INCOMING' ? 'Received' : 'Sent'}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                        {new Date(req.createdAt * 1000).toLocaleDateString()}
                                    </span>
                                </div>
                                <Badge variant="outline" className={
                                    req.status === 'ACCEPTED' ? 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20' :
                                        req.status === 'REJECTED' ? 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20' :
                                            'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-500/10 dark:border-orange-500/20'
                                }>
                                    {req.status}
                                </Badge>
                            </div>

                            <div className="text-sm dark:text-gray-300 flex flex-wrap items-center gap-1.5 mt-1 leading-relaxed">
                                {req.type === 'INCOMING' && req.status === 'PENDING' ? (
                                    <>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{req.senderFirstName}</span> wants to swap with your listing for
                                    </>
                                ) : req.type === 'OUTGOING' && req.status === 'PENDING' ? (
                                    <>Waiting for response on your request for</>
                                ) : req.type === 'INCOMING' && req.status === 'ACCEPTED' ? (
                                    <>You accepted <span className="font-semibold text-gray-900 dark:text-gray-100">{req.senderFirstName}</span>&apos;s request for</>
                                ) : req.type === 'OUTGOING' && req.status === 'ACCEPTED' ? (
                                    <>Your request was accepted for</>
                                ) : req.type === 'OUTGOING' && req.status === 'REJECTED' ? (
                                    <span className="text-gray-500 italic">Your request was declined for</span>
                                ) : (
                                    <span className="text-gray-500 italic">This request was declined or is closed for</span>
                                )}

                                <Badge
                                    variant="outline"
                                    className="border-gray-200 text-gray-700 font-medium dark:border-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/80 shadow-sm"
                                >
                                    {displayedName}
                                </Badge>
                            </div>

                            {/* Revealed Email State */}
                            {req.status === 'ACCEPTED' && (
                                <div className="mt-4 bg-blue-50/50 dark:bg-gray-900/50 rounded-lg border border-blue-100 dark:border-gray-800 p-3 shadow-sm">
                                    <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 mb-1.5 tracking-wider uppercase">
                                        {req.type === 'INCOMING' ? "Contact Requester" : "Contact Owner"}
                                    </p>
                                    <div className="flex items-center justify-between bg-white dark:bg-gray-800/50 p-2 rounded-md border border-gray-100 dark:border-gray-700/50">
                                        <div className="flex items-center gap-2 overflow-hidden mx-1">
                                            <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                                {req.type === 'INCOMING' ? req.senderEmail : req.receiverEmail}
                                            </span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 shrink-0 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                                            onClick={() => handleCopyEmail(req.type === 'INCOMING' ? req.senderEmail : req.receiverEmail)}
                                            title="Copy Email"
                                        >
                                            <Copy className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Actions for Pending Incoming Requests */}
                            {req.type === 'INCOMING' && req.status === 'PENDING' && (
                                <div className="flex w-full gap-3 mt-4 pt-3">
                                    <Button
                                        size="sm"
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white dark:text-white shadow-sm"
                                        onClick={() => handleStatusUpdate(req.requestId, 'ACCEPTED')}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-1.5" /> Accept
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="flex-1 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white dark:text-white shadow-sm"
                                        onClick={() => handleStatusUpdate(req.requestId, 'REJECTED')}
                                    >
                                        <XCircle className="w-4 h-4 mr-1.5" /> Decline
                                    </Button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const TriggerButton = React.forwardRef((props, ref) => (
        <Button ref={ref} {...props} variant="outline" className="relative gap-2 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="hidden sm:inline font-medium text-gray-700 dark:text-gray-300">Requests</span>
            {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow ring-2 ring-white dark:ring-gray-900">
                    {pendingCount}
                </span>
            )}
        </Button>
    ));

    TriggerButton.displayName = "TriggerButton";

    return (
        <>
            {isMobile ? (
                <Drawer open={open} onOpenChange={setOpen}>
                    <DrawerTrigger asChild>
                        <TriggerButton />
                    </DrawerTrigger>
                    <DrawerContent className="bg-white dark:bg-gray-800 border-none shadow-2xl">
                        <DrawerClose className="absolute top-3 right-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors z-[100]">
                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </DrawerClose>
                        <DrawerHeader className="pb-4 pt-2">
                            <DrawerTitle className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                                <span className="bg-blue-100 dark:bg-blue-900/50 p-1.5 rounded-lg border border-blue-200 dark:border-blue-800/60">
                                    <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </span>
                                Swap Requests
                            </DrawerTitle>
                        </DrawerHeader>
                        <div className="pt-2 px-2 pb-8">
                            <RequestList />
                        </div>
                    </DrawerContent>
                </Drawer>
            ) : (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <TriggerButton />
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-gray-200 dark:border-gray-800 bg-white dark:bg-[#020817] shadow-xl">
                        <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-950/50">
                            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                                <span className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-xl border border-blue-200 dark:border-blue-800/60">
                                    <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </span>
                                Swap Requests
                                {pendingCount > 0 && (
                                    <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200">
                                        {pendingCount} new
                                    </Badge>
                                )}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="p-2 sm:p-4 bg-white/50 dark:bg-[#020817]">
                            <RequestList />
                        </div>
                    </DialogContent>
                </Dialog>
            )}

        </>
    );
};

export default SwapNotifications;
