"use client";

import { useEffect, useState } from "react";
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle,
  IndianRupee,
  Calendar,
  FileText,
  Search,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface PurchaseOrder {
  _id: string;
  po_number: string;
  po_date: string;
  delivery_date: string;
  grand_total: number;
  status: string;
  vendorId: {
    vendor_legal_name: string;
  };
}

export default function VendorDashboard() {
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyPOs();
  }, []);

  const fetchMyPOs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/purchase-orders`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPos(data);
      }
    } catch (err) {
      console.error("Failed to fetch vendor POs:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'SENT':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
              <Package className="h-6 w-6" />
            </div>
            Received Orders
          </h1>
          <p className="text-muted-foreground font-medium text-sm pl-1 shadow-primary/5">Incoming procurement requests from your clients</p>
        </div>
      </div>

      {/* Real-time Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-surface p-6 space-y-4 border border-border/50 group hover:border-primary/50 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Total</span>
          </div>
          <div>
            <p className="text-3xl font-black text-foreground">{pos.length}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 italic">Lifetime Orders Received</p>
          </div>
        </div>

        <div className="card-surface p-6 space-y-4 border border-border/50 group hover:border-amber-500/50 transition-all flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] select-none pointer-events-none">
            <Clock className="h-20 w-20" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Pending</span>
          </div>
          <div>
            <p className="text-3xl font-black text-foreground">{pos.filter(p => p.status === 'SENT').length}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 italic">Orders Awaiting Review</p>
          </div>
        </div>

        <div className="card-surface p-6 space-y-4 border border-border/50 group hover:border-emerald-500/50 transition-all flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Revenue</span>
          </div>
          <div>
            <p className="text-3xl font-black text-emerald-600">₹{new Intl.NumberFormat('en-IN').format(pos.filter(p => p.status === 'APPROVED').reduce((sum, p) => sum + p.grand_total, 0))}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 italic">Total Approved Value</p>
          </div>
        </div>
      </div>

      {/* Main Order Table */}
      <div className="card-surface border border-border/50 overflow-hidden relative">
        <div className="p-8 border-b border-border/50 bg-muted/10 flex items-center justify-between">
            <h3 className="font-black uppercase tracking-widest text-[10px] text-muted-foreground flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Active Order Queue
            </h3>
            <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                <input placeholder="Search orders..." className="pl-9 pr-4 py-1.5 bg-muted/30 border border-border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-64" />
            </div>
        </div>
        
        <div className="p-0">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pos.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-4">
              <Package className="h-16 w-16 opacity-10" />
              <p className="font-bold text-lg">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left border-collapse">
                <thead>
                <tr className="bg-muted/5 border-b border-border/30 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                    <th className="py-4 pl-8">Order Ref</th>
                    <th className="py-4">Issue Date</th>
                    <th className="py-4">Deadline</th>
                    <th className="py-4">Order Value</th>
                    <th className="py-4 text-right pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {pos.map((po) => (
                    <tr key={po._id} className="group hover:bg-muted/20 transition-all">
                      <td className="py-5 pl-8">
                         <div className="space-y-1">
                            <span className="font-black text-foreground block group-hover:text-primary transition-colors text-sm">{po.po_number}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Sns Group Order</span>
                         </div>
                      </td>
                      <td className="py-5">
                         <div className="flex items-center gap-2 text-[13px] font-bold text-foreground opacity-70">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(po.po_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                         </div>
                      </td>
                      <td className="py-5">
                         <div className="flex items-center gap-2 text-[13px] font-black text-amber-600">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(po.delivery_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                         </div>
                      </td>
                      <td className="py-5">
                         <div className="flex items-center gap-1.5 font-black text-foreground">
                            <IndianRupee className="h-3.5 w-3.5 text-primary" />
                            {new Intl.NumberFormat('en-IN').format(po.grand_total)}
                         </div>
                      </td>
                      <td className="py-5 text-right pr-8">
                        <Link 
                          href={`/vendor-panel/orders/${po._id}`}
                          className="inline-flex items-center justify-center p-2.5 bg-muted group-hover:bg-primary group-hover:text-white rounded-lg transition-all shadow-sm active:scale-95"
                        >
                           <ArrowRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
