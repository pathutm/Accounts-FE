"use client";

import { useEffect, useState } from "react";
import { 
  Package, 
  Search, 
  Filter, 
  ArrowUpRight,
  FileText,
  Calendar,
  User,
  MapPin,
  Clock,
  Loader2,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function GRNPage() {
  const [grns, setGrns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchGRNs();
  }, []);

  const fetchGRNs = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/grns`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Simple organization filtering for prototype
        setGrns(data.filter((g: any) => g.organizationId === user.organizationId));
      }
    } catch (err) {
      console.error("Failed to fetch GRNs:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGrns = grns.filter(g => 
    g.grnNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.poNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.vendorName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
      <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Loading Audit Logs...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
             <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                <Package className="h-6 w-6" />
             </div>
             Goods Received Notes
          </h1>
          <p className="text-sm text-muted-foreground font-medium">Internal audit logs for received materials and services</p>
        </div>
      </div>

      {/* Filters/Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search by GRN, PO, or Vendor..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all hover:bg-muted/30"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-xl text-sm font-black hover:bg-muted transition-all active:scale-95 text-muted-foreground hover:text-foreground">
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* GRN Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGrns.map((grn) => (
          <div key={grn._id} className="card-surface group hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5 overflow-hidden flex flex-col bg-card">
            <div className="p-6 space-y-4 flex-1">
               <div className="flex items-start justify-between">
                  <div className="h-12 w-12 rounded-xl bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center text-primary transition-colors border border-primary/10 shadow-inner">
                     <Package className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[9px] px-2 py-0.5 bg-green-500/5 text-green-600 rounded-full border border-green-500/10 uppercase tracking-widest font-black">
                      {grn.status || 'RECEIVED'}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 bg-amber-500/5 text-amber-600 rounded-full border border-amber-500/10 uppercase tracking-widest font-black">
                      Match: {grn.matchStatus || 'PENDING'}
                    </span>
                  </div>
               </div>
               
               <div>
                  <h3 className="text-lg font-black tracking-tight uppercase group-hover:text-primary transition-colors">{grn.grnNumber}</h3>
                  <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1 italic">{grn.vendorName}</p>
               </div>

               <div className="space-y-3 pt-6 border-t border-border/50">
                  <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground/60">
                     <FileText className="h-4 w-4 text-primary/40 shrink-0" />
                     <span className="truncate">Origin: {grn.poNumber}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground/60">
                     <Calendar className="h-4 w-4 text-primary/40 shrink-0" />
                     <span className="truncate">{new Date(grn.receivedDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground/60">
                     <User className="h-4 w-4 text-primary/40 shrink-0" />
                     <span className="truncate">{grn.personResponsible}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground/40 leading-tight">
                     <MapPin className="h-3.5 w-3.5 text-primary/20 shrink-0" />
                     <span className="italic line-clamp-1">{grn.receivedPlaceAddress}</span>
                  </div>
               </div>
            </div>
            
            <Link 
              href={`/dashboard/purchase-orders/${grn.purchaseOrderId}`}
              className="p-4 bg-muted/20 border-t border-border flex items-center justify-between group-hover:bg-primary group-hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em]"
            >
              Verify Tracking
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ))}
      </div>

      {filteredGrns.length === 0 && (
        <div className="h-[40vh] flex flex-col items-center justify-center gap-6 border border-dashed border-border rounded-3xl bg-card transition-all">
          <div className="h-16 w-16 bg-muted/20 rounded-2xl flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground/20" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-bold text-foreground">No Audit Logs Found</p>
            <p className="text-sm text-muted-foreground font-medium italic">Material receipts will appear here once verified</p>
          </div>
        </div>
      )}
    </div>
  );
}
