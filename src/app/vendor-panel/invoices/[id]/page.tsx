"use client";

import React, { useState, useEffect, use } from "react";
import { 
  ChevronLeft, 
  Download, 
  Printer, 
  Share2, 
  Building2, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  ArrowUpRight,
  Mail,
  Phone,
  Globe,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/purchase-invoices/${id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setInvoice(data);
        }
      } catch (err) {
        console.error("Failed to fetch invoice detail:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] gap-6">
         <Loader2 className="h-10 w-10 text-primary animate-spin" />
         <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Retrieving Tax Document...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] gap-4">
         <p className="text-lg font-black uppercase tracking-tight text-foreground">Document Not Found</p>
         <button onClick={() => router.back()} className="text-sm font-bold text-primary hover:underline">Return to Repository</button>
      </div>
    );
  }

  const isInterState = invoice.igst > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-1000 pb-20 font-sans mt-8">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-background/80 backdrop-blur-sm z-50 py-4 border-b border-border/10">
        <div className="space-y-1">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Queue
          </button>
          <div className="flex items-center gap-3 mt-1">
             <h1 className="text-2xl font-black tracking-tight text-foreground inline-flex items-center gap-2 lowercase">
                <span className="text-muted-foreground uppercase">{invoice.invoiceNumber}</span>
                <span className="text-xs px-3 py-1 bg-green-500/5 text-green-600 rounded-full border border-green-500/10 uppercase tracking-widest">{invoice.status}</span>
             </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
             <button className="p-2.5 bg-muted rounded-xl text-muted-foreground hover:bg-muted/80 transition-all border border-border/50 shadow-sm" title="Print Invoice">
                <Printer className="h-4 w-4" />
             </button>
             <button className="p-2.5 bg-muted rounded-xl text-muted-foreground hover:bg-muted/80 transition-all border border-border/50 shadow-sm">
                <Share2 className="h-4 w-4" />
             </button>
             <button className="flex items-center gap-2 px-8 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-black hover:opacity-90 transition-all shadow-xl shadow-primary/20">
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
             </button>
        </div>
      </div>

      {/* Main Invoice Document */}
      <div className="card-surface border border-border/50 shadow-2xl relative overflow-hidden bg-white min-h-[1056px]">
        {/* Subtle Branding Watermark */}
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none select-none">
           <FileText className="h-96 w-96 -rotate-12" />
        </div>

        {/* Top Branding Section */}
        <div className="p-12 pb-0 flex items-start justify-between relative z-10">
           <div className="space-y-6">
              <div className="flex items-center gap-3">
                 <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
                    <Building2 className="h-7 w-7" />
                 </div>
                 <div>
                    <h2 className="text-xl font-black tracking-tighter text-foreground uppercase">TAX INVOICE</h2>
                    <p className="text-[10px] font-black text-primary tracking-[0.3em] uppercase opacity-80 leading-tight italic">Procurement Service Billing</p>
                 </div>
              </div>
              
              {/* Billing Info Grid */}
              <div className="grid grid-cols-2 gap-x-12 pt-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.2em] border-l-2 border-primary/30 pl-2">Bill From:</label>
                    <div className="space-y-0.5 pl-2.5">
                       <p className="text-sm font-black text-foreground uppercase tracking-tight">{invoice.billFrom.name}</p>
                       <p className="text-[11px] font-medium text-muted-foreground leading-relaxed max-w-[250px]">{invoice.billFrom.address}</p>
                       <div className="flex items-center gap-2 mt-1.5 bg-primary/[0.03] w-fit px-2 py-0.5 rounded border border-primary/10">
                          <span className="text-[9px] font-black text-primary/50 uppercase">GSTIN:</span>
                          <span className="text-xs font-black text-primary">{invoice.billFrom.gstin}</span>
                       </div>
                       <p className="text-[10px] text-muted-foreground/60 italic mt-1">{invoice.billFrom.contact}</p>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.2em]">Bill To:</label>
                    <div className="space-y-0.5">
                       <p className="text-sm font-black text-foreground">{invoice.billTo.name}</p>
                       <p className="text-[11px] font-medium text-muted-foreground leading-relaxed max-w-[250px]">{invoice.billTo.address}</p>
                       <p className="text-xs font-bold text-primary mt-1">GSTIN: {invoice.billTo.gstin}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex flex-col items-end gap-6 text-right">
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.2em]">Document Number</label>
                 <p className="text-lg font-black text-foreground uppercase tracking-tight">{invoice.invoiceNumber}</p>
              </div>
              <div className="space-y-1 pt-2 border-t border-border/50 w-32">
                 <div className="flex items-center justify-end gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <label className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.2em]">Issue Date</label>
                 </div>
                 <p className="text-sm font-black text-foreground">{new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
           </div>
        </div>

        {/* Line Items Section */}
        <div className="p-12 pb-6 mt-6">
           <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-muted/30 border-b border-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                       <th className="p-5 pl-8">Service / Product Description</th>
                       <th className="p-5 text-center">Qty</th>
                       <th className="p-5 text-right">Rate</th>
                       <th className="p-5 text-right">Disc %</th>
                       <th className="p-5 text-right pr-8">Taxable Val</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border/50">
                   {invoice.items.map((item: any, idx: number) => (
                    <tr key={idx} className="group hover:bg-muted/5 transition-all">
                       <td className="p-5 pl-8">
                          <p className="text-sm font-black text-foreground">{item.description}</p>
                          <p className="text-[10px] font-bold text-primary uppercase mt-0.5">HSN Code: 2314</p>
                       </td>
                       <td className="p-5 text-center">
                          <span className="text-xs font-black text-foreground px-3 py-1 bg-muted rounded-lg border border-border/50">{item.quantity}</span>
                       </td>
                       <td className="p-5 text-right">
                          <p className="text-sm font-black text-foreground tracking-tight">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: invoice.currency }).format(item.unitPrice)}</p>
                       </td>
                       <td className="p-5 text-right">
                          <span className="text-xs font-black text-primary/60 italic">{item.discountRate}%</span>
                       </td>
                       <td className="p-5 text-right pr-8 font-black text-foreground tracking-tight">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: invoice.currency }).format(item.taxableValue)}
                       </td>
                    </tr>
                   ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Summary Footer Section */}
        <div className="p-12 pt-0 flex flex-col md:flex-row justify-between gap-12">
            <div className="flex-1 space-y-8">
               <div className="space-y-4">
                  <div className="flex items-center gap-2">
                     <FileText className="h-4 w-4 text-primary" />
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Terms & Conditions</h3>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground font-medium p-4 bg-muted/30 rounded-xl border border-border/30 whitespace-pre-wrap">
                    {invoice.terms}
                  </p>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center gap-2">
                     <Building2 className="h-4 w-4 text-primary" />
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Remittance Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     {[
                       { label: 'Account Name', val: invoice.bankDetails.accountName },
                       { label: 'Bank Name', val: invoice.bankDetails.bankName },
                       { label: 'Account number', val: invoice.bankDetails.accountNumber },
                       { label: 'IFSC Code', val: invoice.bankDetails.ifsc }
                     ].map((b, i) => (
                       <div key={i} className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">{b.label}</label>
                          <p className="text-xs font-black text-foreground uppercase tracking-tight">{b.val}</p>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="w-80 space-y-1 pt-6">
                <div className="card-surface p-4 bg-muted/5 border border-border/50 space-y-3 shadow-xl">
                    <div className="flex justify-between items-center px-2 py-1">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Subtotal Balance</span>
                       <span className="text-sm font-black text-foreground">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: invoice.currency }).format(invoice.subtotal)}</span>
                    </div>
                    
                    {/* GST Segregation */}
                    {isInterState ? (
                        <div className="flex justify-between items-center px-2 py-1">
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">IGST (Inter-State 100%)</span>
                           <span className="text-sm font-black text-primary">+{new Intl.NumberFormat('en-IN', { style: 'currency', currency: invoice.currency }).format(invoice.igst)}</span>
                        </div>
                    ) : (
                        <>
                           <div className="flex justify-between items-center px-2 py-1">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">CGST (Central Tax 50%)</span>
                              <span className="text-sm font-black text-primary">+{new Intl.NumberFormat('en-IN', { style: 'currency', currency: invoice.currency }).format(invoice.cgst)}</span>
                           </div>
                           <div className="flex justify-between items-center px-2 py-1 mt-1">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">SGST (State Tax 50%)</span>
                              <span className="text-sm font-black text-primary">+{new Intl.NumberFormat('en-IN', { style: 'currency', currency: invoice.currency }).format(invoice.sgst)}</span>
                           </div>
                        </>
                    )}

                    <div className="h-px bg-border/50 mx-2 my-2" />
                    
                    <div className="flex justify-between items-center px-2 py-3 bg-primary/[0.03] border border-primary/20 rounded-xl mt-4">
                       <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Grand Total Pay</span>
                          <p className="text-[9px] font-bold text-primary/40 italic leading-none lowercase tracking-tighter">Tax Inclusive Total</p>
                       </div>
                       <span className="text-xl font-black text-primary tracking-tighter">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: invoice.currency }).format(invoice.grandTotal)}</span>
                    </div>
                </div>

                <div className="pt-12 text-center space-y-4">
                    <div className="h-12 w-48 border-b-2 border-primary/20 mx-auto" />
                    <div className="space-y-1">
                       <p className="text-[11px] font-black uppercase text-foreground">Authorized Signature</p>
                       <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Entity Authority Approval</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Professional Footer Bar */}
        <div className="p-8 border-t border-border/50 mt-12 bg-muted/5 flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 text-muted-foreground/40 hover:text-primary transition-colors cursor-pointer">
                  <Globe className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{invoice.billFrom.website || 'www.printlogic.in'}</span>
               </div>
               <div className="flex items-center gap-2 text-muted-foreground/40 hover:text-primary transition-colors cursor-pointer">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">finance@vendor.com</span>
               </div>
            </div>
            <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Computer Generated Document</p>
        </div>
      </div>
    </div>
  );
}
