"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  FileText,
  Building2,
  Calendar,
  Truck,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
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
  status: string;
  vendorId: {
    vendor_legal_name: string;
    product_info: {
      category: string;
    };
    primary_contact?: {
      name: string;
      email: string;
      phone: string;
    };
    address?: {
      headquarters: string;
      city: string;
      state: string;
      postal_code: string;
    }
  };
  webhook_response?: {
    message: string;
  };
}

export default function PODetails() {
  const { id } = useParams();
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
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

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'PENDING_APPROVAL':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SENT':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'RECEIVED':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  if (!po) return (
    <div className="h-96 flex flex-col items-center justify-center gap-4 text-muted-foreground">
      <AlertCircle className="h-12 w-12 opacity-20" />
      <p className="font-bold text-lg">Purchase Order Not Found</p>
      <Link href="/dashboard/purchase-orders" className="text-primary hover:underline font-bold">Back to list</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/dashboard/purchase-orders" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-2 group">
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Orders
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground">{po.po_number}</h1>
              <div className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusStyles(po.status)}`}>
                {po.status?.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {po.status !== 'RECEIVED' && (
            <Link
              href={`/dashboard/purchase-orders/${po._id}/grn/create`}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:opacity-90 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20"
            >
              <Plus className="h-3.5 w-3.5" />
              Create GRN
            </Link>
          )}
          {po.status === 'RECEIVED' && (
            <Link
              href="/dashboard/grn"
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-green-100 transition-all"
            >
              <Package className="h-3.5 w-3.5" />
              View GRN
            </Link>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-primary/25">
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </button>
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
              <h2 className="font-black uppercase tracking-tight text-sm">Line Items</h2>
            </div>

            <div className="space-y-6 relative z-10">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    <th className="pb-4">Description</th>
                    <th className="pb-4 text-center">Qty</th>
                    <th className="pb-4 text-right">Price</th>
                    <th className="pb-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {po.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-4 text-sm font-medium">{item.description}</td>
                      <td className="py-4 text-sm font-bold text-center">{item.quantity}</td>
                      <td className="py-4 text-sm font-bold text-right">{new Intl.NumberFormat('en-IN').format(item.unit_price)}</td>
                      <td className="py-4 text-sm font-black text-right text-foreground">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-6 border-t border-border/50 flex flex-col items-end gap-2">
                <div className="flex items-center justify-between w-full md:w-64">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Subtotal</span>
                  <span className="font-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(po.grand_total)}</span>
                </div>
                <div className="flex items-center justify-between w-full md:w-64 pt-2 border-t border-border/50">
                  <span className="text-sm font-black text-foreground uppercase tracking-widest">Grand Total</span>
                  <span className="text-xl font-black text-primary">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(po.grand_total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          {po.notes && (
            <div className="card-surface p-8 border border-border/50 bg-amber-50/30">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Notes & Instructions</h3>
              <p className="text-sm font-medium leading-relaxed text-foreground/80 italic">"{po.notes}"</p>
            </div>
          )}
        </div>

        {/* Sidebar Info (1/3) */}
        <div className="space-y-8">
          {/* Vendor Details */}
          <div className="card-surface p-8 border border-border/50 bg-primary/[0.02] space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border/50">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="font-black uppercase tracking-tight text-xs">Vendor Details</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Legal Name</label>
                <p className="font-black text-foreground">{po.vendorId.vendor_legal_name}</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Category</label>
                <div className="mt-1 inline-flex px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-tight">
                  {po.vendorId.product_info?.category}
                </div>
              </div>
              {po.vendorId.primary_contact && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Contact Person</label>
                  <p className="text-sm font-bold">{po.vendorId.primary_contact.name}</p>
                  <p className="text-xs text-muted-foreground font-medium">{po.vendorId.primary_contact.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Logistics */}
          <div className="card-surface p-8 border border-border/50 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border/50">
              <Truck className="h-4 w-4 text-primary" />
              <h2 className="font-black uppercase tracking-tight text-xs">Order Schedule</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Raised On</label>
                  <p className="text-sm font-bold">{new Date(po.po_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground/10" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Delivery Goal</label>
                  <p className="text-sm font-bold text-amber-600">{new Date(po.delivery_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <Truck className="h-8 w-8 text-muted-foreground/10" />
              </div>
            </div>
          </div>

          {/* Org Info (Footer of sidebar) */}
          <div className="p-4 border border-dashed border-border rounded-xl">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block">Bill To</label>
            <p className="text-xs font-bold">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}
