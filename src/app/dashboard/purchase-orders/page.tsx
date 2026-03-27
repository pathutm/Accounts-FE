"use client";

import { useEffect, useState } from "react";
import { 
  Plus, 
  FileText, 
  Search, 
  Filter, 
  MoreVertical, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Send,
  AlertCircle,
  Building2,
  Calendar,
  IndianRupee,
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
    product_info: {
      category: string;
    };
  };
  webhook_response?: {
    message: string;
  };
}

export default function PurchaseOrders() {
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPOs();
  }, []);

  const fetchPOs = async () => {
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
      console.error("Failed to fetch POs:", err);
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

  const filteredPOs = pos.filter(po => 
    po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.vendorId.vendor_legal_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
              <FileText className="h-6 w-6" />
            </div>
            Purchase Orders
          </h1>
          <p className="text-muted-foreground font-medium pl-14">Manage and track your procurement requests</p>
        </div>
        <Link 
          href="/dashboard/purchase-orders/create"
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-primary/25 active:scale-95 group"
        >
          <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
          <span>Raise New PO</span>
        </Link>
      </div>

      <div className="card-surface p-6 border border-border/50">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by PO number or vendor..."
              className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-bold transition-all">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredPOs.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-8 w-8 opacity-20" />
            </div>
            <p className="font-bold">No purchase orders found</p>
            <Link href="/dashboard/purchase-orders/create" className="text-primary hover:underline font-bold text-sm">
              Raise your first PO
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <th className="pb-4 pl-4">PO Details</th>
                  <th className="pb-4">Vendor & Category</th>
                  <th className="pb-4">Total Amount</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredPOs.map((po) => (
                  <tr key={po._id} className="group hover:bg-muted/30 transition-colors">
                    <td className="py-4 pl-4">
                      <div className="space-y-1">
                        <Link 
                          href={`/dashboard/purchase-orders/${po._id}`}
                          className="font-black text-foreground hover:text-primary transition-colors flex items-center gap-2 group/link"
                        >
                          {po.po_number}
                          <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                        </Link>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold">
                          <Calendar className="h-3 w-3" />
                          {new Date(po.po_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {po.vendorId.vendor_legal_name}
                        </div>
                        <div className="text-[10px] inline-flex px-2 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/20 font-black uppercase tracking-tight">
                          {po.vendorId.product_info?.category}
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1.5 font-black text-foreground">
                        <IndianRupee className="h-3.5 w-3.5 text-primary" />
                        {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(po.grand_total)}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-tight ${getStatusStyles(po.status)}`}>
                        {po.status === 'APPROVED' && <CheckCircle2 className="h-3 w-3" />}
                        {po.status === 'REJECTED' && <XCircle className="h-3 w-3" />}
                        {po.status === 'PENDING_APPROVAL' && <Clock className="h-3 w-3" />}
                        {po.status === 'SENT' && <Send className="h-3 w-3" />}
                        {po.status ? po.status.replace('_', ' ') : 'PENDING'}
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <Link 
                        href={`/dashboard/purchase-orders/${po._id}/grn/create`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-indigo-200"
                      >
                        <Plus className="h-3 w-3" />
                        Create GRN
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
  );
}
