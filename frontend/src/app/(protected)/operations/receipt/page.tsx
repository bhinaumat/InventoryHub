"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/utils/api';
import LoadingScreen from '@/components/LoadingScreen';
import { Package, CheckCircle2, Printer, ArrowLeft, Calendar, FileText, MapPin, Hash, Shield, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

// Import Google Signature Font dynamically for the page
const SignatureFontLink = () => (
    <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap" rel="stylesheet" />
);

export default function ReceiptPrintPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const opId = searchParams.get('id');
    const [op, setOp] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!opId) return;
        const fetchOp = async () => {
            try {
                const res = await api.get('/operations');
                const matched = res.data.find((o: any) => (o.id || o._id) === opId);
                setOp(matched);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOp();
    }, [opId]);

    if (loading) {
        return <LoadingScreen fullScreen={true} />;
    }

    if (!op) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
                <Package size={64} className="text-rose-500 mb-4 animate-bounce" />
                <h1 className="text-3xl font-extrabold mb-2">Receipt Not Found</h1>
                <p className="text-slate-400">The requested inventory transfer receipt is invalid or has expired.</p>
            </div>
        );
    }

    const subtotal = op.items?.reduce((acc: number, item: any) => acc + (item.quantity * (item.product?.price || 0)), 0) || 0;
    const opType = op.type;
    let totalLabel = "Total Valuation";
    let accentColor = "indigo";
    let accentHex = "#6366f1";
    let bgGradient = "from-indigo-50 to-indigo-100/30";
    
    if (opType === 'Import') {
        totalLabel = "Final Payable";
        accentColor = "rose";
        accentHex = "#f43f5e";
        bgGradient = "from-rose-50 to-rose-100/30";
    } else if (opType === 'Export') {
        totalLabel = "Final Receivable";
        accentColor = "emerald";
        accentHex = "#10b981";
        bgGradient = "from-emerald-50 to-emerald-100/30";
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-start py-10 px-4 md:px-8 print:bg-white print:p-0 print:text-slate-900">
            <SignatureFontLink />
            {/* Top Interactive Controls (Hidden during printing) */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-8 print:hidden">
                <button 
                    onClick={() => router.back()} 
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all text-sm font-semibold shadow-sm"
                >
                    <ArrowLeft size={16} /> Return to Panel
                </button>
                <button 
                    onClick={() => window.print()} 
                    className={`flex items-center gap-2 px-5 py-2.5 bg-${accentColor}-600 hover:bg-${accentColor}-500 text-white rounded-xl font-bold transition-all shadow-md text-sm`}
                    style={{ backgroundColor: accentHex }}
                >
                    <Printer size={16} /> Print Receipt
                </button>
            </div>

            {/* Document Body */}
            <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-4xl bg-white border border-slate-200/80 rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden print:border-none print:shadow-none print:p-0"
            >
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b-2 border-slate-900">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-900 flex items-center justify-center rounded-2xl shadow-md min-w-[56px] min-h-[56px]">
                            <Package size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900">NexIMS Logistics</h1>
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Global Supply Chain Solutions</p>
                        </div>
                    </div>
                    
                    <div className="md:text-right flex flex-col md:items-end">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                Secure Digital Document
                            </span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                            {op.type} MANIFEST
                        </h2>
                    </div>
                </div>

                {/* Logistics Route Panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                    <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl flex gap-4 items-center">
                        <div className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl shadow-sm">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Origin / Source</h4>
                            <p className="font-extrabold text-slate-900 mt-0.5">{op.sourceLocation?.name || 'External Global Vendor'}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{op.sourceLocation?.address || 'Global Supply Node'}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl flex gap-4 items-center">
                        <div className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl shadow-sm">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Destination Hub</h4>
                            <p className="font-extrabold text-slate-900 mt-0.5">{op.destLocation?.name || 'External Delivery Route'}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{op.destLocation?.address || 'Internal Delivery Target'}</p>
                        </div>
                    </div>
                </div>

                {/* Metadata Grid Info Panel */}
                <div className="grid grid-cols-3 gap-6 mb-8 border-y border-slate-200 py-6 text-slate-700">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            <Hash size={12} />
                            <span>Manifest ID</span>
                        </div>
                        <p className="font-extrabold text-slate-900 text-sm md:text-base">{op.referenceNumber}</p>
                    </div>
                    
                    <div className="space-y-1 border-x border-slate-200 px-6">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            <Calendar size={12} />
                            <span>Execution Date</span>
                        </div>
                        <p className="font-extrabold text-slate-900 text-sm md:text-base">
                            {new Date(op.date).toLocaleDateString([], { dateStyle: 'medium' })}
                        </p>
                    </div>

                    <div className="space-y-1 pl-6">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            <Shield size={12} />
                            <span>Audit Verification</span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold uppercase tracking-wider mt-1">
                            <CheckCircle2 size={10} /> Verified
                        </span>
                    </div>
                </div>

                {/* Table Manifest Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText size={16} className="text-slate-400" />
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Manifest Contents</h4>
                    </div>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-200">
                                    <th className="py-4 px-6 font-bold">Item Description</th>
                                    <th className="py-4 px-6 font-bold text-center">Quantity</th>
                                    <th className="py-4 px-6 font-bold text-right">Unit Value</th>
                                    <th className="py-4 px-6 font-bold text-right">Total Delta</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {op.items?.map((item: any, idx: number) => {
                                    const price = item.product?.price || 0;
                                    const lineTotal = item.quantity * price;
                                    return (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-all duration-150">
                                        <td className="py-4 px-6">
                                            <p className="font-extrabold text-slate-900">{item.product?.name || `Product ID: ${item.productId}`}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{item.product?.sku || 'N/A'}</p>
                                        </td>
                                        <td className="py-4 px-6 font-extrabold text-slate-900 text-center">{item.quantity} Units</td>
                                        <td className="py-4 px-6 font-medium text-right text-slate-500">${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                        <td className="py-4 px-6 font-extrabold text-right text-slate-900">${lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bottom Signature & Total Layout Section */}
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-end mt-10 pt-8 border-t border-slate-200 border-dashed gap-8">
                    {/* Authorized Seal Area */}
                    <div className="flex-1 flex flex-col justify-end">
                        <div className="relative inline-block max-w-sm">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">Owner Authorization</h4>
                            
                            <div className="relative flex items-center border-b border-slate-200 pb-3">
                                {/* Digital Signature */}
                                <div className="text-2xl text-slate-950 font-extrabold tracking-widest italic print:text-black z-10" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
                                    Hitarth Dhaduk
                                </div>
                                
                                {/* Modern Digital Stamp (Placed on top of the owner name with full opacity and light bg wrapper for visibility) */}
                                <div className="absolute left-16 -top-8 w-24 h-24 rounded-full border-4 border-dashed border-emerald-500 bg-white/95 flex flex-col items-center justify-center rotate-12 select-none pointer-events-none z-20 shadow-md print:border-emerald-600">
                                    <div className="w-20 h-20 rounded-full border-2 border-double border-emerald-500 flex flex-col items-center justify-center p-1 text-center text-[8px] font-black text-emerald-600 uppercase tracking-tighter print:border-emerald-600 print:text-emerald-700">
                                        <Package size={14} className="text-emerald-600 mb-0.5 animate-spin-slow print:text-emerald-700" />
                                        <span className="font-bold">NexIMS Seal</span>
                                        <span className="text-[6px] font-extrabold mt-0.5 text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">VERIFIED</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5 mt-2.5">
                                <CheckCircle2 size={12} className="text-emerald-500" />
                                <span className="text-[9px] font-bold text-slate-400 tracking-wider">VERIFIED SECURITY COMPLIANCE STAMP</span>
                            </div>
                            {op.notes && (
                                <div className="text-xs text-slate-500 mt-4 p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl leading-relaxed">
                                    <span className="font-bold text-slate-700 block mb-0.5">Execution Notes:</span>
                                    {op.notes}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pricing Ledger Card */}
                    <div className={`w-full md:w-80 bg-gradient-to-br ${bgGradient} border border-slate-200 p-6 rounded-2xl space-y-3 ml-auto flex flex-col justify-center`}>
                        <div className="flex justify-between text-xs text-slate-500 font-medium">
                            <span>Subtotal Valuation</span>
                            <span className="text-slate-800 font-bold">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 font-medium pb-2 border-b border-slate-200">
                            <span>Processing Tariffs</span>
                            <span className="text-slate-800 font-bold">$0.00</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{totalLabel}</span>
                            <span className="text-xl font-black text-slate-900 flex items-center">
                                <DollarSign size={18} />
                                {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
