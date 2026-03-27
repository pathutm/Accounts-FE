"use client";

import { useEffect, useState } from "react";
import { 
  Layers, 
  Search, 
  Filter, 
  Download, 
  ChevronDown, 
  Calendar, 
  User, 
  FileText,
  IndianRupee,
  CheckCircle2,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface InvoiceItem {
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  amount: {
    subtotal: number;
    gst_percent: number;
    tax_breakup: {
      cgst: number;
      sgst: number;
      igst: number;
      gst?: number;
      cess?: number;
    };
    total: number;
  };
}

interface Invoice {
  _id: string;
  invoice_id: string;
  customer_id: string;
  invoice_date: string;
  items: InvoiceItem[];
  currency: string;
}

interface Customer {
  _id: string;
  Customer_ID: string;
  Company_Name: string;
}

interface ItemRow {
  invoice_no: string;
  date_of_purchase: string;
  customer_name: string;
  item_name: string;
  sub_total: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  grand_total: number;
  revenue_type: "Capital Income" | "Operating Income";
  currency: string;
}

export default function ItemsServicePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Advanced Filter States
  const [revenueFilter, setRevenueFilter] = useState("all");
  const [invoiceFilter, setInvoiceFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [itemFilter, setItemFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setFetchError("Unauthorized: No token found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch Invoices
        const invRes = await fetch("http://localhost:5000/api/invoices", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!invRes.ok) throw new Error(`Invoice fetch failed: ${invRes.statusText}`);
        const invData = await invRes.json();
        const invoicesArray = Array.isArray(invData) ? invData : [];
        setInvoices(invoicesArray);

        // Fetch Customers to map names
        const custRes = await fetch("http://localhost:5000/api/customers", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (custRes.ok) {
          const custData = await custRes.json();
          const custMap: Record<string, string> = {};
          if (Array.isArray(custData)) {
            custData.forEach((c: Customer) => {
              if (c.Customer_ID) {
                custMap[c.Customer_ID] = c.Company_Name || c.Customer_ID;
              }
            });
          }
          setCustomers(custMap);
        }
        
        console.log(`Successfully fetched ${invoicesArray.length} invoices`);
      } catch (err: any) {
        console.error("Data Fetch Error:", err);
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Use useMemo for derived data to ensure reliability
  const allItems = (invoices || []).flatMap(inv => 
    (inv.items || []).map(item => ({
      invoice_no: inv.invoice_id || "N/A",
      date_of_purchase: inv.invoice_date,
      customer_name: customers[inv.customer_id] || inv.customer_id || "Unknown",
      item_name: item.item_name || "Untitled Item",
      sub_total: item.amount?.subtotal || 0,
      cgst: item.amount?.tax_breakup?.cgst || 0,
      sgst: item.amount?.tax_breakup?.sgst || 0,
      igst: item.amount?.tax_breakup?.igst || 0,
      cess: item.amount?.tax_breakup?.cess || 0,
      grand_total: item.amount?.total || 0,
      revenue_type: "Operating Income",
      currency: inv.currency || "INR"
    })) as ItemRow[]
  );

  // Helper for advanced invoice number filtering
  const matchesInvoiceId = (invoice_no: string, filter: string) => {
    if (!filter) return true;
    const cleanFilter = filter.trim();
    const numericPart = parseInt(invoice_no.replace(/\D/g, ''));
    
    if (cleanFilter.includes('-')) {
      const parts = cleanFilter.split('-');
      const start = parseInt(parts[0]);
      const end = parseInt(parts[1]);
      return !isNaN(numericPart) && numericPart >= start && numericPart <= end;
    }
    
    if (cleanFilter.includes(',')) {
      const list = cleanFilter.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      return list.includes(numericPart);
    }
    
    return invoice_no.toLowerCase().includes(cleanFilter.toLowerCase());
  };

  const filteredItems = allItems.filter(item => {
    const matchesInvoice = matchesInvoiceId(item.invoice_no, invoiceFilter);
    
    const itemDate = new Date(item.date_of_purchase);
    const start = fromDate ? new Date(fromDate) : null;
    const end = toDate ? new Date(toDate) : null;
    if (start) start.setHours(0,0,0,0);
    if (end) end.setHours(23,59,59,999);
    const matchesDate = (!start || itemDate >= start) && (!end || itemDate <= end);
    
    const matchesCustomer = customerFilter === "all" || item.customer_name === customerFilter;
    const matchesItem = itemFilter === "all" || item.item_name === itemFilter;
    
    return matchesInvoice && matchesDate && matchesCustomer && matchesItem;
  });

  const uniqueCustomers = Array.from(new Set(allItems.map(i => i.customer_name))).filter(Boolean).sort();
  const uniqueItemNames = Array.from(new Set(allItems.map(i => i.item_name))).filter(Boolean).sort();

  // Calculate Footer Totals
  const totals = filteredItems.reduce((acc, current) => ({
    sub_total: acc.sub_total + current.sub_total,
    cgst: acc.cgst + current.cgst,
    sgst: acc.sgst + current.sgst,
    igst: acc.igst + current.igst,
    cess: acc.cess + current.cess,
    grand_total: acc.grand_total + current.grand_total,
  }), { sub_total: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, grand_total: 0 });

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
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Items / Services</h2>
          <p className="text-muted-foreground font-medium uppercase text-xs tracking-[0.1em]">Ledger Analytics & Breakdown</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setInvoiceFilter("");
              setFromDate("");
              setToDate("");
              setCustomerFilter("all");
              setItemFilter("all");
              setRevenueFilter("all");
            }}
            className="px-4 py-2 text-xs font-black text-muted-foreground uppercase hover:text-primary transition-colors"
          >
            Clear Filters
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md active:scale-95">
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="card-surface overflow-hidden border border-border/50 bg-white shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse min-w-[1500px]">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="p-5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground sticky left-0 bg-white/95 backdrop-blur-sm z-10 w-[180px]">Invoice ID</th>
                <th className="p-5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="p-5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Customer</th>
                <th className="p-5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Item / Service</th>
                <th className="p-5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground text-right italic">Sub Total</th>
                <th className="p-5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground text-center">CGST</th>
                <th className="p-5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground text-center">SGST</th>
                <th className="p-5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground text-center">IGST</th>
                <th className="p-5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground text-center">CESS</th>
                <th className="p-5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground text-right bg-primary/5">Grand Total</th>
                <th className="p-5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground text-center">Revenue Type</th>
              </tr>
              {/* Advanced Filter Row */}
              <tr className="bg-slate-50 border-b border-border">
                <td className="p-3 px-4 sticky left-0 bg-white/95 backdrop-blur-sm z-10 border-r">
                   <input 
                     placeholder="ID (e.g. 1-10 or 1,2)" 
                     className="w-full px-3 py-2 text-[10px] border border-border rounded-lg bg-card font-bold outline-none focus:ring-2 focus:ring-primary/20"
                     value={invoiceFilter}
                     onChange={(e) => setInvoiceFilter(e.target.value)}
                   />
                </td>
                <td className="p-3 px-4 min-w-[240px]">
                   <div className="flex items-center gap-1">
                     <input 
                       type="date"
                       className="w-full px-2 py-1.5 text-[10px] border border-border rounded-lg outline-none cursor-pointer"
                       value={fromDate}
                       onChange={(e) => setFromDate(e.target.value)}
                     />
                     <span className="text-[10px] font-bold text-slate-400 font-mono">▸</span>
                     <input 
                       type="date"
                       className="w-full px-2 py-1.5 text-[10px] border border-border rounded-lg outline-none cursor-pointer"
                       value={toDate}
                       onChange={(e) => setToDate(e.target.value)}
                     />
                   </div>
                </td>
                <td className="p-3 px-4">
                   <select 
                     className="w-full px-3 py-2 text-[10px] font-bold border border-border rounded-lg bg-card outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                     value={customerFilter}
                     onChange={(e) => setCustomerFilter(e.target.value)}
                   >
                     <option value="all">Select Customer...</option>
                     {uniqueCustomers.map(name => (
                       <option key={name} value={name}>{name}</option>
                     ))}
                   </select>
                </td>
                <td className="p-3 px-4 border-r">
                   <select 
                     className="w-full px-3 py-2 text-[10px] font-bold border border-border rounded-lg bg-card outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                     value={itemFilter}
                     onChange={(e) => setItemFilter(e.target.value)}
                   >
                     <option value="all">Select Item...</option>
                     {uniqueItemNames.map(name => (
                       <option key={name} value={name}>{name}</option>
                     ))}
                   </select>
                </td>
                <td colSpan={7} className="bg-muted/5"></td>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.map((item, idx) => {
                const isCapital = item.revenue_type === "Capital Income";
                return (
                  <tr key={`${item.invoice_no}-${idx}`} className="hover:bg-muted/30 transition-all group">
                    <td className="p-5 sticky left-0 bg-white/95 backdrop-blur-sm shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                          <FileText className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-foreground text-sm tracking-tight">{item.invoice_no}</span>
                      </div>
                    </td>
                    <td className="p-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                         <Calendar className="h-4 w-4 shrink-0" />
                         {new Date(item.date_of_purchase).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-foreground px-2 py-0.5 bg-muted rounded-md">{item.customer_name}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-muted-foreground/60" />
                        <span className="text-sm font-bold text-foreground">{item.item_name}</span>
                      </div>
                    </td>
                    <td className="p-5 font-mono text-sm font-bold text-slate-700 text-right">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: item.currency }).format(item.sub_total)}
                    </td>
                    <td className="p-5 text-center font-mono text-sm font-semibold text-slate-500">
                      ₹{item.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-5 text-center font-mono text-sm font-semibold text-slate-500">
                      ₹{item.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-5 text-center font-mono text-sm font-semibold text-slate-500">
                      ₹{item.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-5 text-center font-mono text-sm font-semibold text-slate-500">
                      ₹{item.cess.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-5 font-mono text-sm font-black text-slate-900 text-right bg-slate-50/30">
                       {new Intl.NumberFormat('en-IN', { style: 'currency', currency: item.currency }).format(item.grand_total)}
                    </td>
                    <td className="p-5 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                        isCapital 
                          ? "bg-purple-50 text-purple-600 border-purple-200 shadow-sm shadow-purple-100" 
                          : "bg-blue-50 text-blue-600 border-blue-200 shadow-sm shadow-blue-100"
                      }`}>
                        {isCapital ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        {item.revenue_type}
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-32 text-center bg-slate-50/30">
                    <div className="h-24 w-24 bg-white/80 rounded-full flex items-center justify-center mx-auto shadow-xl mb-6 ring-4 ring-primary/5">
                      <Layers className="h-10 w-10 text-primary opacity-20 animate-pulse" />
                    </div>
                    <p className="text-xl font-bold text-slate-800 uppercase tracking-widest">No Matches Found</p>
                    <p className="text-xs text-muted-foreground mt-2 font-bold uppercase tracking-tighter opacity-70">Adjust your criteria or range above</p>
                  </td>
                </tr>
              )}
            </tbody>
            {/* Footer Totals Row */}
            {filteredItems.length > 0 && (
              <tfoot className="border-t-2 border-primary bg-slate-900 text-white font-bold sticky bottom-0 z-10 shadow-[-4px_0_20px_rgba(0,0,0,0.2)]">
                <tr className="uppercase text-[10px] tracking-[0.2em]">
                  <td colSpan={4} className="p-6 text-right font-black border-r border-white/10 opacity-70">Filtered Totals Summary</td>
                  <td className="p-6 font-mono text-sm font-black text-right border-r border-white/5">
                    ₹{totals.sub_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-6 text-center font-mono text-[11px] font-bold opacity-80 border-r border-white/5">
                    ₹{totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-6 text-center font-mono text-[11px] font-bold opacity-80 border-r border-white/5">
                    ₹{totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-6 text-center font-mono text-[11px] font-bold opacity-80 border-r border-white/5">
                    ₹{totals.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-6 text-center font-mono text-[11px] font-bold opacity-80 border-r border-white/5">
                    ₹{totals.cess.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-6 font-mono text-[18px] font-black text-white text-right bg-primary/20">
                    ₹{totals.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-6 bg-white/5"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
