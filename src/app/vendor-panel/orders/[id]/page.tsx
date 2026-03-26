"use client";

import { useEffect, useState } from "react";
import { 
  FileText, 
  Building2, 
  Calendar, 
  Truck, 
  IndianRupee,
  ChevronLeft,
  Briefcase,
  Download,
  Printer,
  Package
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface POItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface PurchaseOrder {
  _id: string;
  po_number: string;
  po_date: string;
  delivery_date: string;
  items: POItem[];
  grand_total: number;
  notes: string;
  organizationId: string;
}

export default function VendorPODetails() {
  const { id } = useParams();
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessInfo, setBusinessInfo] = useState<any>(null);

  useEffect(() => {
    fetchPODetails();
  }, [id]);

  const fetchPODetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/purchase-orders/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPo(data);
      }
    } catch (err) {
      console.error("Failed to fetch PO details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  if (!po) return (
    <div className="h-96 flex flex-col items-center justify-center gap-4 text-muted-foreground">
      <p className="font-bold text-lg">Order Not Found</p>
      <Link href="/vendor-panel" className="text-primary hover:underline font-bold">Back to orders</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/vendor-panel" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-2 group">
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Queue
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
              <Package className="h-6 w-6" />
            </div>
            {po.po_number}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-xs font-bold transition-all border border-border/50">
            <Printer className="h-3.5 w-3.5" />
            Print Order
          </button>
          <Link 
            href={`/vendor-panel/invoices/create?fromPo=${po._id}`}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-primary/25"
          >
            <FileText className="h-3.5 w-3.5" />
            Create Invoice
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Details (2/3) */}
        <div className="md:col-span-2 space-y-8">
          {/* Items Card */}
          <div className="card-surface p-8 border border-border/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <Briefcase className="h-40 w-40" />
            </div>
            
            <div className="flex items-center gap-2 pb-6 border-b border-border/50 relative z-10 mb-6">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="font-black uppercase tracking-tight text-sm text-foreground">Requested Items</h2>
            </div>

            <div className="space-y-6 relative z-10">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 border-b border-border/20">
                    <th className="pb-4">Description</th>
                    <th className="pb-4 text-center">Qty</th>
                    <th className="pb-4 text-right pr-4">Rate</th>
                    <th className="pb-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {po.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/5 transition-colors">
                      <td className="py-4 text-sm font-semibold text-foreground">{item.description}</td>
                      <td className="py-4 text-sm font-black text-center text-foreground">{item.quantity}</td>
                      <td className="py-4 text-sm font-bold text-right pr-4 text-muted-foreground">{new Intl.NumberFormat('en-IN').format(item.unit_price)}</td>
                      <td className="py-4 text-sm font-black text-right text-foreground">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-6 border-t border-border/50 flex flex-col items-end gap-2">
                <div className="flex items-center justify-between w-full md:w-64 pt-2">
                  <span className="text-sm font-black text-foreground uppercase tracking-widest">Grand Total</span>
                  <span className="text-2xl font-black text-primary">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(po.grand_total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          {po.notes && (
            <div className="card-surface p-8 border border-border/50 bg-primary/5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Client Requirements</h3>
              <p className="text-sm font-medium leading-relaxed text-foreground/80 italic">"{po.notes}"</p>
            </div>
          )}
        </div>

        {/* Sidebar Info (1/3) */}
        <div className="space-y-8">
          {/* Client Details */}
          <div className="card-surface p-8 border border-border/50 bg-primary/[0.02] space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border/50">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="font-black uppercase tracking-tight text-[11px] text-foreground">Client Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Entity Name</label>
                <p className="font-black text-foreground">SNS Square</p>
                <p className="text-[10px] text-muted-foreground font-bold">Authorized Procurement</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card-surface p-8 border border-border/50 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border/50">
              <Truck className="h-4 w-4 text-primary" />
              <h2 className="font-black uppercase tracking-tight text-[11px] text-foreground">Schedule</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Order Date</label>
                  <p className="text-sm font-bold text-foreground">{new Date(po.po_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <Calendar className="h-7 w-7 text-muted-foreground/10" />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border/10">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-amber-600/60">Target Delivery</label>
                  <p className="text-sm font-black text-amber-600 italic">By {new Date(po.delivery_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <Truck className="h-7 w-7 text-amber-600/10" />
              </div>
            </div>
          </div>

           <div className="p-6 border border-dashed border-border rounded-xl bg-muted/20">
             <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Secure Order</span>
             </div>
             <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">This is a digitally signed Purchase Order. Please ensure all items match the descriptions exactly before fulfillment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
