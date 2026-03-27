"use client";

import { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
  Layers,
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  X,
  Loader2
} from "lucide-react";

interface InvoiceItem {
  item_id: string;
  item_name: string;
  hsn_code?: string;
  uom?: string;
  quantity: number;
  unit_price: number;
  amount: {
    subtotal: number;
    gst_percent: number;
    tax_breakup: {
      cgst: number;
      sgst: number;
      igst: number;
    };
    total: number;
  };
}

interface Invoice {
  _id: string;
  invoice_id: string;
  customer_id: string;
  invoice_date: string;
  due_date: string;
  place_of_supply: string;
  currency: string;
  items: InvoiceItem[];
  invoice_summary: {
    subtotal: number;
    tax_breakup: {
      total_cgst: number;
      total_sgst: number;
      total_igst: number;
    };
    grand_total: number;
  };
  payment: {
    status: "PAID" | "UNPAID" | "PARTIALLY_PAID";
    paid_amount: number;
    pending_amount: number;
    last_payment_date?: string;
  };
  derived_metrics: {
    days_overdue: number;
  };
}

interface Customer {
  _id: string;
  Customer_ID: string;
  Company_Name: string;
  Industry: string;
  Primary_Contact: string;
  Contact_Email: string;
  Credit_Limit: number;
  Preferred_Contact: string;
  Currency: string;
  City: string;
  Country: string;
  Tax_ID: string;
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
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [org, setOrg] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const orgData = localStorage.getItem("org");
    if (orgData) setOrg(JSON.parse(orgData));
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

  const handleViewInvoice = async (invoice: Invoice) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/customers/${invoice.customer_id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const custData = await res.json();
      setCustomer(custData);
      setSelectedInvoice(invoice);
    } catch (err) {
      console.error("Error fetching customer for invoice:", err);
      // Still show invoice even if customer fetch fails (will show partial info)
      setSelectedInvoice(invoice);
    }
  };

  const handleSendEmail = async (directInvoice?: Invoice, directCustomer?: Customer) => {
    const inv = directInvoice || selectedInvoice;
    const cust = directCustomer || customer;
    
    if (!inv) return;
    
    setSending(true);
    try {
      // If we don't have customer data yet (e.g. quick send), fetch it first
      let activeCustomer = cust;
      if (!activeCustomer) {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/customers/${inv.customer_id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        activeCustomer = await res.json();
      }

      const payload = {
        // Detailed Context
        invoice: inv,
        customer: activeCustomer,
        organization: org,
        
        // Specific fields requested
        summary: {
          invoice_id: inv.invoice_id,
          customer_id: inv.customer_id,
          invoice_date: new Date(inv.invoice_date).toISOString().split('T')[0],
          due_date: new Date(inv.due_date).toISOString().split('T')[0],
          amount: inv.invoice_summary.grand_total,
          pending: inv.payment.pending_amount,
          status: inv.payment.status,
          overdue_days: inv.derived_metrics.days_overdue
        }
      };
      
      const response = await fetch("https://api.agents.snsihub.ai/webhook/Remainder_Email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        alert(`Reminder sent for ${inv.invoice_id}!`);
      } else {
        alert("Webhook returned an error.");
      }
    } catch (err: any) {
      console.error("Email Error:", err);
      alert(`Error detail: ${err?.message || "Failed to send email."}`);
    } finally {
      setSending(false);
    }
  };

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
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleViewInvoice(invoice)}>
                        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                          <FileText className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-foreground text-sm tracking-tight hover:text-primary transition-colors">{invoice.invoice_id}</span>
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
                        <button 
                          onClick={() => handleViewInvoice(invoice)}
                          className="p-2 hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-primary"
                          title="View Invoice"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleSendEmail(invoice)}
                          className={`p-2 hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-amber-600 ${sending ? 'animate-pulse' : ''}`}
                          title="Send Reminder Email"
                          disabled={sending}
                        >
                          <Mail className="h-4 w-4" />
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
      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center z-[100] p-4 overflow-y-auto pt-16">
          <div className="bg-white text-slate-800 w-full max-w-4xl rounded-lg shadow-2xl relative animate-in zoom-in-95 duration-300">
            {/* Modal Actions */}
            <div className="bg-slate-100 px-6 py-3 border-b flex justify-between items-center no-print">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedInvoice(null)}
                  className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-200 rounded text-xs font-bold transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <div className="w-[1px] h-4 bg-slate-300"></div>
                <h4 className="font-bold text-slate-700">Invoice {selectedInvoice.invoice_id}</h4>
              </div>
              <div className="flex gap-2">
                {/* Close Button Removed from here as requested previously */}
              </div>
            </div>
            
            {/* Template UI Start */}
            <div className="p-0 bg-white" id="invoice-printable" ref={invoiceRef}>
              {/* Header */}
              <div className="flex h-32">
                <div className="bg-[#002B5B] text-white w-3/5 p-6 flex flex-col justify-center">
                  <h1 className="text-2xl font-bold mb-1">{org?.name || "SNS Square Pvt Ltd"}</h1>
                  <p className="text-[10px] opacity-80 leading-relaxed max-w-xs">
                    No. 12, 2nd Floor, Anna Nagar West, Chennai, Tamil Nadu – 600040
                  </p>
                  <div className="mt-2 text-[10px] opacity-80 flex gap-4">
                    <span>GSTIN: 33AABCS1234F1Z5</span>
                    <span>PAN: AABCS1234F</span>
                  </div>
                </div>
                <div className="bg-[#407BFF] text-white w-2/5 p-6 flex flex-col justify-center items-end text-right">
                  <h2 className="text-3xl font-light tracking-wider mb-2">TAX INVOICE</h2>
                  <p className="text-xs font-bold">{selectedInvoice.invoice_id}</p>
                  <p className="text-[10px] opacity-90">
                    {new Date(selectedInvoice.invoice_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Info Bar */}
              <div className="grid grid-cols-4 border-b">
                <div className="p-3 border-r bg-slate-50/50">
                  <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Invoice Date</p>
                  <p className="text-xs font-bold">{new Date(selectedInvoice.invoice_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="p-3 border-r bg-slate-50/50">
                  <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Due Date</p>
                  <p className="text-xs font-bold">{new Date(selectedInvoice.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="p-3 border-r bg-slate-50/50">
                  <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Currency</p>
                  <p className="text-xs font-bold">{selectedInvoice.currency}</p>
                </div>
                <div className="p-3 bg-slate-50/50">
                  <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Payment Status</p>
                  <p className={`text-xs font-black ${
                    selectedInvoice.payment.status === 'PAID' ? 'text-green-600' : 
                    selectedInvoice.payment.status === 'PARTIALLY_PAID' ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {selectedInvoice.payment.status}
                  </p>
                </div>
              </div>

              {/* Bill To & Invoice Details */}
              <div className="grid grid-cols-2">
                <div className="p-6 border-r">
                   <h3 className="text-[#407BFF] font-black text-[10px] uppercase tracking-wider mb-3">BILL TO</h3>
                   <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800">{customer?.Company_Name}</p>
                      <p className="text-[10px] text-slate-500 max-w-xs">{customer?.City}, {customer?.Country}</p>
                      <p className="text-[10px] text-slate-500 uppercase">GSTIN: {customer?.Tax_ID || "33AAPCA1234B1Z6"}</p>
                   </div>
                </div>
                <div className="p-6">
                   <h3 className="text-[#407BFF] font-black text-[10px] uppercase tracking-wider mb-3">INVOICE DETAILS</h3>
                   <div className="space-y-2">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400 font-bold uppercase">Place of Supply:</span>
                        <span className="text-slate-700 font-bold">{selectedInvoice.place_of_supply}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400 font-bold uppercase">HSN / SAC Code:</span>
                        <span className="text-slate-700 font-bold">{selectedInvoice.items?.[0]?.hsn_code || "998314"}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400 font-bold uppercase">Payment Terms:</span>
                        <span className="text-slate-700 font-bold">Net 45</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400 font-bold uppercase">Due in:</span>
                        <span className={`font-black ${selectedInvoice.derived_metrics.days_overdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {selectedInvoice.derived_metrics.days_overdue > 0 ? `${selectedInvoice.derived_metrics.days_overdue} Days Overdue` : "Upcoming"}
                        </span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="w-full">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#112D4E] text-white text-left uppercase text-[9px] tracking-widest font-bold">
                      <th className="p-3 w-12 text-center">#</th>
                      <th className="p-3">Description of Service</th>
                      <th className="p-3 text-center">HSN/SAC</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx} className="border-b text-slate-700">
                        <td className="p-3 text-[10px] text-center">{idx + 1}</td>
                        <td className="p-3">
                          <p className="text-[11px] font-bold text-slate-800">{item.item_name}</p>
                          <p className="text-[9px] text-slate-400 italic">Services rendered</p>
                        </td>
                        <td className="p-3 text-[10px] text-center">{item.hsn_code || "—"}</td>
                        <td className="p-3 text-[10px] text-center">{item.quantity}</td>
                        <td className="p-3 text-[10px] text-right font-mono font-bold">₹{item.unit_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-[10px] text-right font-mono font-bold">₹{item.amount.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    {!selectedInvoice.items && (
                      <tr className="border-b text-slate-700">
                        <td className="p-3 text-[10px] text-center">1</td>
                        <td className="p-3">
                          <p className="text-[11px] font-bold text-slate-800">Professional Services</p>
                          <p className="text-[9px] text-slate-400 italic">Technical consultation</p>
                        </td>
                        <td className="p-3 text-[10px] text-center">998314</td>
                        <td className="p-3 text-[10px] text-center">1</td>
                        <td className="p-3 text-[10px] text-right font-mono font-bold">₹{selectedInvoice.invoice_summary.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-[10px] text-right font-mono font-bold">₹{selectedInvoice.invoice_summary.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end p-6">
                 <div className="w-1/3 space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 font-bold">Subtotal</span>
                      <span className="text-slate-800 font-bold font-mono">₹{(selectedInvoice.invoice_summary.subtotal || selectedInvoice.invoice_summary.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {selectedInvoice.invoice_summary.tax_breakup && (
                      <>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400 font-bold">CGST @ 9%</span>
                          <span className="text-slate-800 font-bold font-mono">₹{selectedInvoice.invoice_summary.tax_breakup.total_cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400 font-bold">SGST @ 9%</span>
                          <span className="text-slate-800 font-bold font-mono">₹{selectedInvoice.invoice_summary.tax_breakup.total_sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </>
                    )}
                    <div className="bg-[#112D4E] text-white p-2 mt-2 flex justify-between items-center rounded-sm">
                      <span className="text-xs font-black uppercase tracking-widest">Grand Total</span>
                      <span className="text-sm font-black font-mono">₹{selectedInvoice.invoice_summary.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[11px] bg-green-50 p-2 border-l-4 border-green-500 text-green-700 font-bold">
                      <span className="uppercase tracking-widest text-[9px]">Amount Paid</span>
                      <span className="font-mono">- ₹{selectedInvoice.payment.paid_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                 </div>
              </div>

              {/* Payment Details */}
              <div className="px-6 py-4 bg-slate-50 border-t border-b">
                 <h3 className="text-[#407BFF] font-black text-[10px] uppercase tracking-wider mb-2">PAYMENT DETAILS</h3>
                 <p className="text-[10px] text-slate-600 font-medium">
                   <span className="font-bold text-slate-800">Bank:</span> {org?.bankName || "HDFC Bank"} | 
                   <span className="font-bold text-slate-800 ml-2">Account Name:</span> {org?.name || "SNS Square Pvt Ltd"} | 
                   <span className="font-bold text-slate-800 ml-2">A/C No:</span> 50200012345678
                 </p>
                 <p className="text-[10px] text-slate-600 font-medium mt-1">
                   <span className="font-bold text-slate-800">IFSC:</span> HDFC0001234 | 
                   <span className="font-bold text-slate-800 ml-2">Branch:</span> Anna Nagar, Chennai | 
                   <span className="font-bold text-slate-800 ml-2">UPI:</span> snssquare@hdfc
                 </p>
              </div>

              {/* Footer */}
              <div className="grid grid-cols-2 h-20">
                 <div className="p-4 border-r">
                    <h3 className="text-[#407BFF] font-black text-[9px] uppercase tracking-wider mb-1">TERMS & CONDITIONS</h3>
                    <p className="text-[8px] text-slate-400">1. Payment Terms: Net 45</p>
                 </div>
                 <div className="bg-[#EBF1FF] p-4 flex flex-col justify-end items-center">
                    <p className="text-[#002B5B] font-black text-[9px] uppercase tracking-widest border-t border-[#002B5B] pt-1">AUTHORIZED SIGNATORY</p>
                 </div>
              </div>

              {/* Action Buttons at Bottom */}
              <div className="p-6 border-t bg-slate-50 flex justify-center gap-4 no-print">
                <button 
                  onClick={() => handleSendEmail()}
                  disabled={sending}
                  className="flex items-center gap-2 px-8 py-3 bg-[#407BFF] text-white rounded-lg text-sm font-black hover:bg-[#3261cc] transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      SENDING...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      SEND EMAIL
                    </>
                  )}
                </button>
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-8 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-lg text-sm font-black hover:bg-slate-100 transition-all shadow-sm active:scale-95"
                >
                  <Download className="h-4 w-4" />
                  DOWNLOAD / PRINT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
