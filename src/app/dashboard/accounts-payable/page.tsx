"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Search, 
  Calendar, 
  Building2, 
  Tag, 
  CheckCircle2, 
  Filter, 
  ArrowUpRight,
  IndianRupee,
  Clock,
  History
} from "lucide-react";
import Link from "next/link";

export default function AccountsPayablePage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/purchase-invoices`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error("Failed to fetch payables:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.billFrom?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusDisplay = (status: string) => {
    if (status === 'SUBMITTED') return 'PENDING_APPROVAL';
    return status;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <History className="h-7 w-7" />
            </div>
            Accounts Payable
          </h1>
          <p className="text-muted-foreground font-medium pl-16">Review and manage invoices submitted by your vendors</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search by Invoice or Vendor..."
              className="pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm w-80 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-card border border-border rounded-xl text-sm font-black hover:bg-muted transition-all shadow-sm">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Quick Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'Pending Payout', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(invoices.reduce((sum, inv) => sum + inv.grandTotal, 0)), icon: IndianRupee, color: 'primary' },
           { label: 'Vendor Documents', value: invoices.length, icon: FileText, color: 'emerald' },
           { label: 'Awaiting Action', value: invoices.filter(i => i.status === 'SUBMITTED').length, icon: Clock, color: 'amber' }
         ].map((stat, i) => (
           <div key={i} className="card-surface p-6 border border-border/50 hover:border-primary/20 transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                 <stat.icon className="h-20 w-20" />
              </div>
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-3 block">{stat.label}</label>
              <div className="text-2xl font-black text-foreground tracking-tighter">{stat.value}</div>
           </div>
         ))}
      </div>

      {/* Invoices List Table */}
      <div className="card-surface bg-white border border-border/50 overflow-hidden shadow-sm">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/20">
                     <th className="p-5 pl-8 w-64">Invoice Description</th>
                     <th className="p-5">Vendor Details</th>
                     <th className="p-5">Billing Metadata</th>
                     <th className="p-5">Total Payable</th>
                     <th className="p-5">Status</th>
                     <th className="p-5 pr-8 text-right">Verification</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-border/50">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Compiling Payables...</p>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-32 text-center">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-20">
                          <FileText className="h-8 w-8" />
                        </div>
                        <p className="mt-4 text-base font-black text-foreground uppercase tracking-tight">No incoming invoices found</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((inv) => (
                      <tr key={inv._id} className="group hover:bg-muted/30 transition-all">
                        <td className="p-5 pl-8">
                           <div className="space-y-1">
                              <p className="text-sm font-black text-foreground uppercase tracking-tight">{inv.invoiceNumber}</p>
                              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase italic">Based on PO: {inv.invoiceNumber.split('-')[1]}</p>
                           </div>
                        </td>
                        <td className="p-5">
                           <div className="flex items-center gap-3">
                              <div className="h-9 w-9 bg-primary/5 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                 <Building2 className="h-4 w-4" />
                              </div>
                              <div className="space-y-0.5">
                                 <p className="text-xs font-black text-foreground uppercase tracking-tight">{inv.billFrom.name}</p>
                                 <p className="text-[10px] font-bold text-muted-foreground/40">{inv.billFrom.gstin}</p>
                              </div>
                           </div>
                        </td>
                        <td className="p-5">
                           <div className="flex items-center gap-2 text-xs font-black text-muted-foreground italic">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                           </div>
                        </td>
                        <td className="p-5">
                           <div className="text-sm font-black text-primary flex items-center gap-1.5">
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(inv.grandTotal)}
                           </div>
                        </td>
                        <td className="p-5">
                           <span className="inline-flex px-3 py-1 bg-amber-500/5 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-500/10">
                              {getStatusDisplay(inv.status).replace('_', ' ')}
                           </span>
                        </td>
                        <td className="p-5 pr-8 text-right">
                           <Link 
                             href={`/dashboard/accounts-payable/${inv._id}`}
                             className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 hover:bg-primary/10 rounded-lg text-primary text-[10px] font-black uppercase tracking-widest transition-all border border-primary/10"
                           >
                              Review Task
                              <ArrowUpRight className="h-3.5 w-3.5" />
                           </Link>
                        </td>
                      </tr>
                    ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
