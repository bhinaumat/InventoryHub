"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '../utils/swrFetcher';
import api from '../utils/api';
import { Plus, CheckCircle, Package, FileText, X, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OperationPage({ type, title, description, requireSource, requireDest }: { type: string, title: string, description: string, requireSource: boolean, requireDest: boolean }) {
    const { data: operationsData, isLoading: opsLoading, mutate: mutateOperations } = useSWR<any[]>('/operations', fetcher);
    const { data: productsData } = useSWR<any[]>('/products', fetcher);
    const { data: locationsData } = useSWR<any[]>('/locations', fetcher);

    const loading = opsLoading;
    const operations = (operationsData || []).filter((op: any) => op.type === type);
    const products = productsData || [];
    const locations = locationsData || [];
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Receipt Modal State
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [selectedReceiptOp, setSelectedReceiptOp] = useState<any>(null);

    // Form State
    const [reference, setReference] = useState('');
    const [sourceLocation, setSourceLocation] = useState('');
    const [destLocation, setDestLocation] = useState('');
    const [items, setItems] = useState<{ product: string, quantity: number }[]>([{ product: '', quantity: 1 }]);
    const [notes, setNotes] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/operations', {
                referenceNumber: reference,
                type,
                sourceLocation: requireSource ? sourceLocation : undefined,
                destLocation: requireDest ? destLocation : undefined,
                items,
                notes
            });
            setIsModalOpen(false);
            resetForm();
            mutateOperations();
        } catch (err) {
            console.error(err);
            alert('Failed to create operation');
        }
    };

    const handleValidate = async (id: string) => {
        try {
            await api.put(`/operations/${id}/validate`);
            mutateOperations();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to validate operation');
        }
    };

    const handleOpenReceipt = (op: any) => {
        const opId = op._id || op.id;
        window.open(`/operations/receipt?id=${opId}`, '_blank');
    };

    const printReceipt = () => {
        window.print();
    };

    const resetForm = () => {
        setReference('');
        setSourceLocation('');
        setDestLocation('');
        setNotes('');
        setItems([{ product: '', quantity: 1 }]);
    };

    const addItemRow = () => setItems([...items, { product: '', quantity: 1 }]);
    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end mb-8 print:hidden">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">{title}</h1>
                    <p className="text-slate-400 mt-2">{description}</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl flex items-center gap-2 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.4)] font-semibold tracking-wide"
                >
                    <Plus size={20} /> New {type}
                </motion.button>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10 print:hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-widest border-b border-white/10">
                                <th className="p-5 font-semibold">Reference</th>
                                <th className="p-5 font-semibold">Date</th>
                                {requireSource && <th className="p-5 font-semibold">Source</th>}
                                {requireDest && <th className="p-5 font-semibold">Destination</th>}
                                <th className="p-5 font-semibold">Status</th>
                                <th className="p-5 font-semibold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={4 + (requireSource ? 1 : 0) + (requireDest ? 1 : 0)} className="p-10 text-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                                    </td>
                                </tr>
                            ) : operations.length === 0 ? (
                                <tr>
                                    <td colSpan={4 + (requireSource ? 1 : 0) + (requireDest ? 1 : 0)} className="text-center p-12 text-slate-500">
                                        <Package size={48} className="opacity-20 mb-4 mx-auto" />
                                        <p>No {type.toLowerCase()}s found.</p>
                                    </td>
                                </tr>
                            ) : (
                                operations.map(op => (
                                    <tr key={op._id || op.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-5 text-sm font-bold text-indigo-300">{op.referenceNumber}</td>
                                        <td className="p-5 text-sm text-slate-400">{new Date(op.date).toLocaleDateString()}</td>
                                        {requireSource && <td className="p-5 text-sm text-slate-300">{op.sourceLocation?.name || '---'}</td>}
                                        {requireDest && <td className="p-5 text-sm text-slate-300">{op.destLocation?.name || '---'}</td>}
                                        <td className="p-5 text-sm">
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider 
                                                ${op.status === 'Done' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                                                : 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]'}`}>
                                                {op.status}
                                            </span>
                                        </td>
                                        <td className="p-5 text-sm text-right">
                                            {op.status !== 'Done' ? (
                                                <motion.button 
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleValidate(op._id || op.id)} 
                                                    className="text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 px-4 py-2 rounded-xl transition-all flex items-center justify-end ml-auto gap-2 shadow-sm font-semibold"
                                                >
                                                    <CheckCircle size={18} /> Generate Receipt
                                                </motion.button>
                                            ) : (
                                                <motion.button 
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleOpenReceipt(op)} 
                                                    className="text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/30 px-4 py-2 rounded-xl transition-all flex items-center justify-end ml-auto gap-2 shadow-sm font-semibold"
                                                >
                                                    <FileText size={18} /> Open Receipt
                                                </motion.button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Creation Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl p-8 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Create New {type}</h2>
                            <form onSubmit={handleCreate} className="space-y-6">
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Reference No.</label>
                                        <input type="text" required className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" value={reference} onChange={e => setReference(e.target.value)} placeholder={`e.g. ${type.substring(0,3).toUpperCase()}-100`} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Notes / Supplier</label>
                                        <input type="text" className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional details..." />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    {requireSource && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Source Location</label>
                                            <select required className="w-full bg-slate-800/50 border border-slate-700 text-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all appearance-none" value={sourceLocation} onChange={e => setSourceLocation(e.target.value)}>
                                                <option value="" className="bg-slate-800">Select Location</option>
                                                {locations.map(loc => <option key={loc._id || loc.id} value={loc._id || loc.id} className="bg-slate-800">{loc.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    {requireDest && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Destination Location</label>
                                            <select required className="w-full bg-slate-800/50 border border-slate-700 text-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all appearance-none" value={destLocation} onChange={e => setDestLocation(e.target.value)}>
                                                <option value="" className="bg-slate-800">Select Location</option>
                                                {locations.map(loc => <option key={loc._id || loc.id} value={loc._id || loc.id} className="bg-slate-800">{loc.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="border border-white/5 rounded-2xl p-6 bg-slate-800/30">
                                    <h3 className="font-semibold text-indigo-300 mb-4 flex items-center gap-2 uppercase tracking-widest text-sm"><Package size={18} /> Required Items</h3>
                                    {items.map((item, index) => (
                                        <div key={index} className="flex gap-4 mb-4">
                                            <select required className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none" value={item.product} onChange={e => updateItem(index, 'product', e.target.value)}>
                                                <option value="" className="bg-slate-900">Select Product...</option>
                                                {products.map(p => <option key={p._id || p.id} value={p._id || p.id} className="bg-slate-900">{p.name} ({p.sku})</option>)}
                                            </select>
                                            <input type="number" min="1" required className="w-28 bg-slate-900 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center" value={item.quantity} onChange={e => updateItem(index, 'quantity', Number(e.target.value))} />
                                        </div>
                                    ))}
                                    <button type="button" onClick={addItemRow} className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold mt-2 tracking-wide transition-colors">+ Add Line Item</button>
                                </div>

                                <div className="mt-8 flex justify-end gap-4 pt-6 border-t border-white/5">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">Cancel</button>
                                    <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/30">Save Operation</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Receipt Modal */}
            <AnimatePresence>
                {receiptModalOpen && selectedReceiptOp && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setReceiptModalOpen(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm print:hidden"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white text-slate-900 rounded-xl w-full max-w-3xl p-10 shadow-2xl relative z-10 print:shadow-none print:p-0 print-page-target"
                        >
                            <button onClick={() => setReceiptModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 print:hidden transition-colors">
                                <X size={24} />
                            </button>

                            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-8 mb-8">
                                <div>
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="p-3 bg-indigo-600 flex items-center justify-center rounded-xl shadow-md min-w-[60px] min-h-[60px]">
                                            <Package size={36} color="#ffffff" />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">NexIMS Logistics</h1>
                                            <p className="text-xs font-bold text-slate-500 tracking-widest uppercase mt-1">Global Supply Chain Solutions</p>
                                        </div>
                                    </div>
                                    <div className="mt-6 text-sm text-slate-500 font-medium leading-relaxed">
                                        <p>123 Commerce Avenue, Suite 400</p>
                                        <p>Metropolis, NY 10001, USA</p>
                                        <p>contact@nexims-global.com | +1 (555) 123-4567</p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <h2 className="text-4xl font-black text-indigo-600 tracking-tight uppercase mb-4">{selectedReceiptOp.type} RECEIPT</h2>
                                    <div className="text-left bg-slate-50 p-5 rounded-xl border border-slate-200 min-w-[240px]">
                                        <div className="flex justify-between mb-3 border-b border-slate-200 pb-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Receipt No</span>
                                            <span className="font-bold text-slate-800">{selectedReceiptOp.referenceNumber}</span>
                                        </div>
                                        <div className="flex justify-between mb-3 border-b border-slate-200 pb-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</span>
                                            <span className="font-bold text-slate-800">{new Date(selectedReceiptOp.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
                                            <span className="font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">VERIFIED</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-12 mb-10">
                                <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-blue-800 mb-3 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div> Output Origin (Source)
                                    </h4>
                                    <p className="font-bold text-slate-800 text-lg">{selectedReceiptOp.sourceLocation?.name || 'External Global Vendor'}</p>
                                    <p className="text-sm text-slate-500 mt-1">Authorized Supply Node</p>
                                </div>

                                <div className="bg-purple-50/50 p-5 rounded-xl border border-purple-100">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-purple-800 mb-3 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div> Destination Hub
                                    </h4>
                                    <p className="font-bold text-slate-800 text-lg">{selectedReceiptOp.destLocation?.name || 'External Delivery Route'}</p>
                                    <p className="text-sm text-slate-500 mt-1">NexIMS Integrated Warehouse</p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Manifest Items</h4>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100/50 text-slate-500 text-xs uppercase tracking-widest border-y border-slate-200">
                                            <th className="py-4 px-2 font-bold">Item / Commodity</th>
                                            <th className="py-4 px-2 font-bold text-center">Quantity</th>
                                            <th className="py-4 px-2 font-bold text-right">Unit Price</th>
                                            <th className="py-4 px-2 font-bold text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedReceiptOp.items?.map((item: any, idx: number) => {
                                            const price = item.product?.price || 0;
                                            const lineTotal = item.quantity * price;
                                            return (
                                            <tr key={idx}>
                                                <td className="py-4 px-2">
                                                    <p className="font-bold text-slate-800">{item.product?.name || `Product ID: ${item.productId}`}</p>
                                                    <p className="text-xs text-slate-500">{item.product?.sku || 'N/A'}</p>
                                                </td>
                                                <td className="py-4 px-2 font-bold text-slate-800 text-center">{item.quantity} Units</td>
                                                <td className="py-4 px-2 font-medium text-slate-600 text-right">${price.toFixed(2)}</td>
                                                <td className="py-4 px-2 font-bold text-slate-800 text-right">${lineTotal.toFixed(2)}</td>
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Financials & Signature */}
                            <div className="flex justify-between items-end mt-8 pt-8 border-t-2 border-slate-200 border-dashed">
                                {/* Digital Signature Section */}
                                <div className="w-1/2">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Digital Authorization</h4>
                                    <div className="relative inline-block">
                                        {/* Faux Stamp/Logo */}
                                        <div className="absolute -left-4 -top-6 opacity-5 transform -rotate-12 pointer-events-none">
                                            <Package size={100} className="text-indigo-900" />
                                        </div>
                                        {/* Signature */}
                                        <div className="text-4xl text-indigo-700 pr-8 border-b-2 border-indigo-200 pb-2 relative z-10" style={{ fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive' }}>
                                            NexIMS Logistics
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <CheckCircle size={14} className="text-emerald-500" />
                                            <p className="text-[10px] font-bold text-slate-500 tracking-wider">VERIFIED DIGITAL SIGNATURE & COMPANY SEAL</p>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">Doc ID: {selectedReceiptOp.id || selectedReceiptOp._id}</p>
                                    </div>
                                </div>

                                {/* Totals Section */}
                                <div className="w-1/3 bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm">
                                    {(() => {
                                        const subtotal = selectedReceiptOp.items?.reduce((acc: number, item: any) => acc + (item.quantity * (item.product?.price || 0)), 0) || 0;
                                        const opType = selectedReceiptOp.type;
                                        
                                        let totalLabel = "Total Valuation";
                                        let totalColor = "text-indigo-600";
                                        
                                        if (opType === 'Import') {
                                            totalLabel = "Final Payable";
                                            totalColor = "text-rose-600"; 
                                        } else if (opType === 'Export') {
                                            totalLabel = "Final Receivable";
                                            totalColor = "text-emerald-600"; 
                                        }

                                        return (
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm text-slate-500 font-medium">
                                                    <span>Subtotal</span>
                                                    <span>${subtotal.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-slate-500 font-medium pb-3 border-b border-slate-200">
                                                    <span>Taxes & Fees</span>
                                                    <span>$0.00</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-1 mt-2">
                                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-900">{totalLabel}</span>
                                                    <span className={`text-2xl font-black ${totalColor}`}>${subtotal.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="mt-10 flex justify-end print:hidden">
                                <button onClick={printReceipt} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold transition-colors shadow-lg">
                                    <Printer size={18} /> Print Document
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
