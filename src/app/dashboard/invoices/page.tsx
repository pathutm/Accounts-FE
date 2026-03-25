"use client";

import { useEffect, useState } from "react";
import { 
  FileText, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PauseCircle,
  Search,
  Download,
  Filter,
  MoreVertical,
  ExternalLink,
  IndianRupee,
  Layers
} from "lucide-react";

interface Invoice {
  _id: string;
  invoice_id: string;
  customer_id: string;
  invoice_date: string;
  due_date: string;
  currency: string;
  invoice_summary: {
    grand_total: number;
  };
  payment: {
    status: "PAID" | "UNPAID" | "PARTIALLY_PAID";
    paid_amount: number;
    pending_amount: number;
  };
  derived_metrics: {
    days_overdue: number;
  };
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case "PAID":
      return { 
        bg: "bg-green-50", 
        text: "text-green-600", 
        border: "border-green-200", 
        icon: <CheckCircle2 className="h-3.5 w-3.5" /> 
      };
    case "PARTIALLY_PAID":
      return { 
        bg: "bg-amber-50", 
        text: "text-amber-600", 
        border: "border-amber-200", 
        icon: <PauseCircle className="h-3.5 w-3.5" /> 
      };
    case "UNPAID":
      return { 
        bg: "bg-red-50", 
        text: "text-red-600", 
        border: "border-red-200", 
        icon: <AlertCircle className="h-3.5 w-3.5" /> 
      };
    default:
      return { 
        bg: "bg-muted", 
        text: "text-muted-foreground", 
        border: "border-border", 
        icon: null 
      };
  }
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:5000/api/invoices", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setInvoices(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching invoices:", err);
        setLoading(false);
      });
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoice_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.customer_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || inv.payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Sales Invoices</h2>
          <p className="text-muted-foreground">Manage billings, track payments, and monitor overdue collectibles.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search Invoice or Customer ID..."
              className="pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 hover:border-primary/50 transition-all w-80 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-all shadow-sm outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partial</option>
            <option value="UNPAID">Unpaid</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-md">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="card-surface overflow-hidden border border-border/50">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground sticky left-0 bg-card/95 backdrop-blur-sm z-10 w-[180px]">Invoice ID</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Customer ID</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Due Date</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Pending</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground text-center">Status</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground text-center">Overdue</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInvoices.map((invoice) => {
                const status = getStatusStyles(invoice.payment.status);
                const isOverdue = invoice.derived_metrics.days_overdue > 0;
                
                return (
                  <tr key={invoice._id} className="hover:bg-muted/20 transition-all group">
                    <td className="p-5 sticky left-0 bg-card/95 backdrop-blur-sm shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                          <FileText className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-foreground text-sm tracking-tight">{invoice.invoice_id}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-foreground px-2 py-0.5 bg-muted rounded-md">{invoice.customer_id}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground font-medium">
                        <Calendar className="h-4 w-4 shrink-0" />
                        {new Date(invoice.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground font-medium">
                        <Clock className="h-4 w-4 shrink-0" />
                        {new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="p-5 font-mono text-sm font-bold text-foreground">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: invoice.currency }).format(invoice.invoice_summary.grand_total)}
                    </td>
                    <td className="p-5 font-mono text-sm font-bold text-red-600">
                      {invoice.payment.pending_amount > 0 
                        ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: invoice.currency }).format(invoice.payment.pending_amount)
                        : "—"}
                    </td>
                    <td className="p-5 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${status.bg} ${status.text} ${status.border}`}>
                        {status.icon}
                        {invoice.payment.status.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      {isOverdue ? (
                        <div className="inline-flex flex-col">
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">
                            {invoice.derived_metrics.days_overdue} days
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg border border-green-100 uppercase tracking-tighter">On Time</span>
                      )}
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-primary">
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <button className="p-2 hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-20 text-center space-y-4">
                    <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <Layers className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-bold text-foreground">No invoices found</p>
                      <p className="text-muted-foreground">Adjust your filters or search terms to see results.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
