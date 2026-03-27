"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  FileText, 
  ChevronRight, 
  Calendar, 
  Building2, 
  Tag, 
  CheckCircle2, 
  MoreHorizontal,
  ArrowUpRight,
  Filter
} from "lucide-react";

export default function VendorInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
      console.error("Failed to fetch invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    inv.billTo?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20 font-sans">
      {/* Premium Header */}
      <div className="bg-white border-b border-border/50 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center border border-primary/10">
                <FileText className="h-5 w-5 text-primary" />
             </div>
             <div>
                <h1 className="text-xl font-black tracking-tight text-foreground uppercase">Invoice Repository</h1>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic">Submitted Tax Documents</p>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative group hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  placeholder="Search invoice number..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-muted/30 border border-border/50 rounded-lg text-xs font-black transition-all focus:outline-none focus:ring-1 focus:ring-primary/20 w-64"
                />
             </div>
             <Link 
               href="/vendor-panel" 
               className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black hover:opacity-90 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest"
             >
                <Plus className="h-3.5 w-3.5" />
                <span>New Invoice</span>
             </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { label: 'Total Submitted', value: invoices.length, icon: FileText, color: 'primary' },
             { label: 'Total Value', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(invoices.reduce((sum, inv) => sum + inv.grandTotal, 0)), icon: Tag, color: 'green' },
             { label: 'Pending Approval', value: invoices.filter(i => i.status === 'SUBMITTED').length, icon: Calendar, color: 'orange' }
           ].map((stat, i) => (
             <div key={i} className="card-surface p-6 border border-border/40 hover:border-primary/20 transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                   <stat.icon className="h-20 w-20" />
                </div>
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] block mb-3">{stat.label}</label>
                <div className="text-2xl font-black text-foreground tracking-tighter">{stat.value}</div>
             </div>
           ))}
        </div>

        {/* Invoice List */}
        <div className="card-surface bg-white border border-border/50 shadow-sm overflow-hidden min-h-[500px]">
           <div className="px-6 py-4 border-b border-border/50 bg-muted/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Filter className="h-4 w-4 text-muted-foreground" />
                 <h3 className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.2em]">Submitted Documents</h3>
              </div>
              <p className="text-[10px] font-black text-primary/40 uppercase">Sorted by Date: Newest First</p>
           </div>

           {loading ? (
             <div className="p-20 text-center flex flex-col items-center gap-4">
                <div className="h-10 w-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Refreshing Inventory...</p>
             </div>
           ) : filteredInvoices.length === 0 ? (
             <div className="p-32 text-center flex flex-col items-center gap-6">
                <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center">
                   <FileText className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <div>
                   <h3 className="text-lg font-black tracking-tight text-foreground uppercase">Archives Clear</h3>
                   <p className="text-sm font-medium text-muted-foreground mt-1">No invoices found matching your criteria.</p>
                </div>
             </div>
           ) : (
             <div className="divide-y divide-border/50">
               {filteredInvoices.map((inv) => (
                 <div key={inv._id} className="p-6 hover:bg-muted/5 transition-all group flex items-center justify-between">
                    <div className="flex items-center gap-8 flex-1">
                       {/* Identity */}
                       <div className="flex items-center gap-5 w-64">
                          <div className="h-12 w-12 bg-muted rounded-xl flex items-center justify-center border border-border/50 group-hover:border-primary/20 transition-all font-black text-primary/40 text-xs">
                             DOC
                          </div>
                          <div className="space-y-1">
                             <p className="text-sm font-black text-foreground uppercase tracking-tight">{inv.invoiceNumber}</p>
                             <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 uppercase">
                                <Building2 className="h-3 w-3" />
                                 <span>{inv.billTo.name}</span>
                              </div>
                              <p className="text-[9px] font-black text-primary/40 uppercase italic pl-5">
                                 Based on PO: {inv.purchaseOrderId?.po_number || inv.invoiceNumber.split('-')[1] || "N/A"}
                              </p>
                          </div>
                       </div>

                       {/* Timeline & Value */}
                       <div className="flex items-center gap-12 flex-1">
                          <div className="space-y-1">
                             <div className="flex items-center gap-2 text-muted-foreground/40">
                                <Calendar className="h-3 w-3" />
                                <span className="text-[9px] font-black uppercase tracking-[0.15em]">Issue Date</span>
                             </div>
                             <p className="text-xs font-black text-foreground">{new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                          
                          <div className="space-y-1">
                             <div className="flex items-center gap-2 text-muted-foreground/40">
                                <Tag className="h-3 w-3" />
                                <span className="text-[9px] font-black uppercase tracking-[0.15em]">Total Value</span>
                             </div>
                             <p className="text-xs font-black text-primary uppercase">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(inv.grandTotal)}</p>
                          </div>

                          <div className="space-y-1">
                             <div className="flex items-center gap-2 text-muted-foreground/40">
                                <CheckCircle2 className="h-3 w-3" />
                                <span className="text-[9px] font-black uppercase tracking-[0.15em]">Status</span>
                             </div>
                             <span className="inline-block px-3 py-1 bg-green-500/5 text-green-600 rounded-full text-[9px] font-black uppercase tracking-wider border border-green-500/10">
                                {inv.status}
                             </span>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-3">
                       <button className="h-10 w-10 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition-all">
                          <MoreHorizontal className="h-5 w-5" />
                       </button>
                       <Link 
                         href={`/vendor-panel/invoices/${inv._id}`}
                         className="h-10 px-6 bg-primary/5 hover:bg-primary/10 rounded-lg text-primary text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-primary/10"
                       >
                          View
                          <ArrowUpRight className="h-3.5 w-3.5" />
                       </Link>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
