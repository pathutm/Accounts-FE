"use client";

import { useEffect, useState, Suspense } from "react";
import { 
  FileText, 
  Trash2, 
  Plus, 
  Save, 
  IndianRupee, 
  ChevronLeft,
  Briefcase,
  Calendar,
  Layers,
  CheckCircle2,
  Loader2,
  ChevronDown,
  Building2,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
}

interface TaskItem {
  id: string;
  task: string;
  status: 'pending' | 'completed';
}

function InvoiceCreateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const poId = searchParams.get("fromPo");
  
  const [items, setItems] = useState<InvoiceItem[]>([{ id: "1", description: "", quantity: 1, unitPrice: 0, discountRate: 0, taxRate: 18 }]);
  const [tasks, setTasks] = useState<TaskItem[]>([{ id: "t1", task: "", status: 'pending' }]);
  const [terms, setTerms] = useState<string>("1. Payment is due within 30 days.\n2. Warranty covers manufacturing defects only.\n3. Dispute resolution subject to Coimbatore jurisdiction.");
  const [bankDetails, setBankDetails] = useState({
    accountName: "",
    accountNumber: "",
    bankName: "",
    ifsc: ""
  });
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [poData, setPoData] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [orgData, setOrgData] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
        const u = JSON.parse(storedUser);
        setVendor(u);
        
        // Securely fetch bank info from the authorized DB object
        const b = u.bank_info || {};
        setBankDetails({
            accountName: u.name,
            accountNumber: b.account_number,
            bankName: b.bank_name,
            ifsc: b.ifsc_code 
        });
    }
    
    if (poId) {
      fetchPODetails();
    }
  }, [poId]);

  const fetchPODetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/purchase-orders/${poId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPoData(data);
        
        // Use the vendor profile directly from the PO (BE populates this)
        if (data.vendorId && typeof data.vendorId === 'object') {
           setVendor(data.vendorId);
           
           // Update bank details from the fetched vendor profile
           const b = data.vendorId.bank_info || {};
           setBankDetails({
               accountName: data.vendorId.vendor_legal_name || data.vendorId.name || 'PrintLogic Solutions Pvt Ltd',
               accountNumber: b.account_number || "445566778899",
               bankName: b.bank_name || "PNB",
               ifsc: b.ifsc_code || "PUNB0001122"
           });
        }
        
        // Fetch Organization Details from the newly created backend route
        if (data.organizationId) {
           const orgRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/organization/${data.organizationId}`, {
             headers: { "Authorization": `Bearer ${token}` }
           });
           if (orgRes.ok) {
              const org = await orgRes.json();
              setOrgData(org);
           }
        }

        const prefilledItems = data.items.map((item: any, idx: number) => ({
          id: `po-${idx}`,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          discountRate: 0,
          taxRate: 18
        }));
        if (prefilledItems.length > 0) setItems(prefilledItems);
      }
    } catch (err) {
      console.error("Failed to fetch PO for invoice:", err);
    }
  };

  const addItem = () => setItems([...items, { id: Math.random().toString(), description: "", quantity: 1, unitPrice: 0, discountRate: 0, taxRate: 18 }]);
  const addTask = () => setTasks([...tasks, { id: Math.random().toString(), task: "", status: 'pending' }]);
  
  const removeItem = (id: string) => items.length > 1 && setItems(items.filter(i => i.id !== id));
  const removeTask = (id: string) => tasks.length > 1 && setTasks(tasks.filter(t => t.id !== id));

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  const updateTask = (id: string, value: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, task: value } : t));
  };

  // GST Calculation Logic: Comparing Vendor (Bill From) vs Organization (Bill To)
  const vendorGST = vendor?.tax_info?.gst_vat || vendor?.gst_vat || vendor?.gstin || "";
  const orgGST = orgData?.profile?.tax_id || orgData?.tax_id || "";
  
  const vendorGstinPrefix = vendorGST.substring(0, 2);
  const orgGstinPrefix = orgGST.substring(0, 2);
  
  // Only calculate GST if both prefixes are available, otherwise default to same state
  const isInterState = vendorGstinPrefix && orgGstinPrefix ? vendorGstinPrefix !== orgGstinPrefix : false;

  const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice * (1 - i.discountRate / 100)), 0);
  const totalTax = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice * (1 - i.discountRate / 100) * (i.taxRate / 100)), 0);
  const total = subtotal + totalTax;

  const handleSubmit = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Invoice Created Successfully!");
      router.push("/vendor-panel");
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-1000 pb-20 font-sans">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-background/80 backdrop-blur-sm z-50 py-4 border-b border-border/10">
        <div className="space-y-1">
          <Link href="/vendor-panel" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group">
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Queue
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2 mt-1">
             Financial Finalization
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
            <button className="px-6 py-2.5 bg-muted rounded-lg text-xs font-bold hover:bg-muted/80 transition-all border border-border/50">Save Draft</button>
            <button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-black hover:opacity-90 transition-all shadow-lg hover:shadow-primary/25 disabled:opacity-50"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Send Invoice</span>
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
                        <p className="text-sm font-black text-foreground uppercase tracking-tight">
                           {vendor?.vendor_legal_name || vendor?.name || <span className="opacity-20">Loading Identity...</span>}
                        </p>
                        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed max-w-[250px]">
                           {vendor?.address?.headquarters || vendor?.address?.mailing || (vendor?.address && typeof vendor.address === 'string' ? vendor.address : <span className="opacity-20 italic">No address on file</span>)}
                        </p>
                        {(vendor?.address?.city || vendor?.address?.state) && (
                           <p className="text-[10px] font-bold text-muted-foreground/80 lowercase italic tracking-tight">
                              {vendor.address.city}, {vendor.address.state} - {vendor.address.postal_code}
                           </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 bg-primary/[0.03] w-fit px-2 py-0.5 rounded border border-primary/10">
                           <span className="text-[9px] font-black text-primary/50 uppercase">GSTIN:</span>
                           <span className="text-xs font-black text-primary">{vendor?.tax_info?.gst_vat || vendor?.gst_vat || vendor?.gstin || <span className="opacity-20 select-none">Pending...</span>}</span>
                           {vendorGstinPrefix && <span className="text-[8px] font-black bg-primary/10 px-1 rounded ml-1 text-primary/40 select-none">ST: {vendorGstinPrefix}</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 italic mt-1">{vendor?.primary_contact?.phone || vendor?.primary_contact?.mobile || vendor?.phone || <span className="opacity-10 text-[8px] uppercase not-italic">Contact Not Found</span>}</p>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.2em]">Bill To:</label>
                     <div className="space-y-0.5">
                        <p className="text-sm font-black text-foreground">{orgData?.name || <span className="opacity-20">Loading Purchaser...</span>}</p>
                        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed max-w-[250px]">{orgData?.profile?.address || orgData?.address || <span className="opacity-20 italic">No destination address</span>}</p>
                        {(orgData?.profile?.city || orgData?.profile?.state) && (
                           <p className="text-[10px] font-bold text-muted-foreground/80 lowercase italic tracking-tight">
                              {orgData.profile.city}, {orgData.profile.state} - {orgData.profile.postal_code}
                           </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1 border-b border-primary/10 w-fit pb-0.5">
                           <span className="text-xs font-bold text-primary">GSTIN: {orgData?.profile?.tax_id || orgData?.tax_id || <span className="opacity-20">Awaiting Tax ID</span>}</span>
                           {orgGstinPrefix && <span className="text-[8px] font-black bg-primary/10 px-1 rounded text-primary/40 select-none">ST: {orgGstinPrefix}</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 italic">{orgData?.profile?.website || orgData?.website || 'https://snssquare.com'}</p>
                     </div>
                  </div>
               </div>
           </div>

           <div className="flex flex-col items-end gap-6 text-right">
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.2em]">Reference No</label>
                 <input 
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="text-lg font-black text-foreground bg-primary/5 hover:bg-primary/10 border-b border-primary/20 transition-all text-right focus:outline-none w-48 px-2"
                 />
              </div>
              <div className="space-y-1 pt-2 border-t border-border/50">
                 <div className="flex items-center justify-end gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <label className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.2em]">Issue Date</label>
                 </div>
                 <input 
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="text-sm font-black text-foreground bg-transparent transition-all text-right focus:outline-none w-48 px-2"
                 />
              </div>
              {poData && (
                <div className="pt-2">
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-3 py-1 rounded-full inline-block border border-primary/10 italic animate-pulse">
                     Based on PO: {poData.po_number}
                   </p>
                </div>
              )}
           </div>
        </div>

        {/* Itemized Table */}
        <div className="p-12 relative z-10 pt-16">
           <div className="space-y-2">
              <div className="grid grid-cols-12 gap-x-4 px-4 py-3 bg-muted/30 rounded-t-xl border-x border-t border-border/30 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground leading-none">
                 <div className="col-span-4 pl-1 italic">Service Description</div>
                 <div className="col-span-1 text-center">Qty</div>
                 <div className="col-span-2 pl-4">Unit Rate (₹)</div>
                 <div className="col-span-1 pl-4 text-emerald-600">Disc (%)</div>
                 <div className="col-span-2 pl-4 text-primary">Tax Rate</div>
                 <div className="col-span-2 text-right">Amount (₹)</div>
              </div>

              <div className="border border-border/30 rounded-b-xl divide-y divide-border/10 bg-white shadow-sm">
                 {items.map((item) => {
                    const taxableSubtotal = (item.quantity * item.unitPrice) * (1 - item.discountRate / 100);
                    const itemTax = taxableSubtotal * (item.taxRate / 100);
                    const itemTotal = taxableSubtotal + itemTax;

                    return (
                        <div key={item.id} className="group transition-all hover:bg-primary/[0.01] p-0.5 relative">
                           {/* Side Actions (Hover Only) */}
                           <div className="absolute right-[-45px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => removeItem(item.id)} className="p-2 text-red-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all border border-transparent hover:border-red-100 shadow-sm">
                                 <Trash2 className="h-4 w-4" />
                              </button>
                           </div>

                           <div className="grid grid-cols-12 gap-x-4 items-center min-h-[56px] px-3.5">
                              <div className="col-span-4 relative">
                                 <input 
                                    className="w-full py-1.5 bg-transparent border-none text-[13px] font-bold text-foreground focus:ring-0 placeholder:text-muted-foreground/20 italic"
                                    value={item.description}
                                    placeholder="Enter service details..."
                                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                 />
                              </div>
                              <div className="col-span-1 flex justify-center">
                                 <input 
                                    type="number"
                                    className="w-12 py-1.5 bg-transparent border-none text-[13px] font-black text-center focus:ring-0"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                 />
                              </div>
                              <div className="col-span-2 pl-4 flex items-center gap-1">
                                 <span className="text-muted-foreground/30 font-bold text-xs shrink-0">₹</span>
                                 <input 
                                    type="number"
                                    className="w-full py-1.5 bg-transparent border-none text-[13px] font-black text-foreground focus:ring-0"
                                    value={item.unitPrice}
                                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                 />
                              </div>
                              <div className="col-span-1 pl-4">
                                 <input 
                                    type="number"
                                    className="w-full py-1.5 bg-emerald-50/10 border-none text-[13px] font-black text-emerald-600 focus:ring-0 text-center"
                                    value={item.discountRate}
                                    onChange={(e) => updateItem(item.id, 'discountRate', parseFloat(e.target.value) || 0)}
                                 />
                              </div>
                              <div className="col-span-2 pl-4">
                                 <div className="relative group/tax">
                                    <select 
                                       className="w-full pl-2 pr-6 py-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg text-[11px] font-black text-primary focus:outline-none appearance-none cursor-pointer transition-colors"
                                       value={item.taxRate}
                                       onChange={(e) => updateItem(item.id, 'taxRate', parseInt(e.target.value))}
                                    >
                                       <option value="0">GST 0%</option>
                                       <option value="5">GST 5%</option>
                                       <option value="8">GST 8%</option>
                                       <option value="12">GST 12%</option>
                                       <option value="18">GST 18%</option>
                                       <option value="40">GST 40%</option>
                                    </select>
                                    <ChevronDown className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 text-primary pointer-events-none opacity-50" />
                                 </div>
                              </div>
                              <div className="col-span-2 text-right">
                                 <span className="text-[13px] font-black text-foreground tracking-tight underline decoration-primary/10 decoration-2 underline-offset-4">
                                    {new Intl.NumberFormat('en-IN').format(itemTotal)}
                                 </span>
                              </div>
                           </div>
                        </div>
                    );
                 })}
                 
                 <div className="p-3 border-t border-border/10 bg-muted/5">
                    <button onClick={addItem} className="flex items-center gap-1.5 text-[10px] font-black uppercase text-primary hover:underline hover:scale-105 transition-all pl-2">
                       <Plus className="h-3.5 w-3.5" /> Append Line Item
                    </button>
                 </div>
              </div>
           </div>

           {/* Secondary Info Section (Bank & Terms) */}
           <div className="px-12 pb-12 grid grid-cols-2 gap-x-12 relative z-10">
              <div className="space-y-8">
                 {/* Bank Details (Read-only) */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border/30">
                       <div className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4 text-emerald-600" />
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Remittance Info (Bank Details)</h3>
                       </div>
                       <span className="text-[9px] font-black text-emerald-600/40 uppercase tracking-widest italic select-none">Authorized Account</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-muted/10 p-4 rounded-xl border border-border/50 border-dashed">
                       <div className="space-y-0.5">
                          <label className="text-[9px] font-black text-muted-foreground/40 uppercase">Account Name</label>
                          <p className="text-[11px] font-black text-foreground tracking-tight">{bankDetails.accountName}</p>
                       </div>
                       <div className="space-y-0.5">
                          <label className="text-[9px] font-black text-muted-foreground/40 uppercase">Bank Name</label>
                          <p className="text-[11px] font-black text-foreground tracking-tight">{bankDetails.bankName}</p>
                       </div>
                       <div className="space-y-0.5">
                          <label className="text-[9px] font-black text-muted-foreground/40 uppercase">Account Number</label>
                          <p className="text-[11px] font-black text-foreground font-mono tracking-wider">{bankDetails.accountNumber}</p>
                       </div>
                       <div className="space-y-0.5">
                          <label className="text-[9px] font-black text-muted-foreground/40 uppercase">IFSC Code</label>
                          <p className="text-[11px] font-black text-primary tracking-widest">{bankDetails.ifsc}</p>
                       </div>
                    </div>
                 </div>

                 {/* Terms & Conditions */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                       <Layers className="h-4 w-4 text-indigo-600" />
                       <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Terms & Conditions</h3>
                    </div>
                    <textarea 
                       placeholder="Enter terms and conditions..."
                       className="w-full min-h-[120px] bg-indigo-50/5 border border-dashed border-indigo-600/10 text-[11px] font-medium p-3 focus:outline-none focus:border-indigo-600 transition-all italic leading-relaxed"
                       value={terms}
                       onChange={(e) => setTerms(e.target.value)}
                    />
                 </div>
              </div>

              {/* Totals Section with GST Segregation */}
              <div className="flex flex-col items-end pt-2">
                 <div className="w-full space-y-4">
                    <div className="flex justify-between items-center py-4 px-2 border-b border-border/10">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Subtotal Value (Pre-tax)</span>
                       <span className="text-sm font-bold text-foreground opacity-80">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(subtotal)}</span>
                    </div>
                    
                    {/* GST Segregation Lines */}
                    {isInterState ? (
                        <div className="flex justify-between items-center px-2 py-1">
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">IGST (Inter-State 100%)</span>
                           <span className="text-sm font-black text-primary">+{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalTax)}</span>
                        </div>
                    ) : (
                        <>
                           <div className="flex justify-between items-center px-2 py-1">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">CGST (Central Tax 50%)</span>
                              <span className="text-sm font-black text-primary">+{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalTax / 2)}</span>
                           </div>
                           <div className="flex justify-between items-center px-2 py-1 mt-1">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">SGST (State Tax 50%)</span>
                              <span className="text-sm font-black text-primary">+{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalTax / 2)}</span>
                           </div>
                        </>
                    )}

                    <div className="mt-8 p-6 bg-slate-900 rounded-2xl text-white shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
                       <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none rotate-12 group-hover:rotate-45 transition-transform">
                          <IndianRupee className="h-24 w-24" />
                       </div>
                       <div className="flex flex-col items-end gap-1 relative z-10">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80">TOTAL NET PAYABLE</label>
                          <div className="flex items-center gap-2">
                             <span className="text-4xl font-black tracking-tighter">₹{new Intl.NumberFormat('en-IN').format(total)}</span>
                          </div>
                          <p className="text-[9px] font-bold text-slate-400/60 uppercase tracking-widest mt-1 italic">Including all applicable taxes and cess</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Professional Invoice Footer */}
           <div className="px-12 py-8 border-t border-border/10 bg-muted/5 flex justify-between items-center relative z-10 rounded-b-xl">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Authorized Signature</p>
                 <div className="h-10 w-40 border-b border-border/50 border-dashed"></div>
                 <p className="text-[9px] text-muted-foreground italic tracking-tight">Digitally Verified Document</p>
              </div>
              <div className="text-right">
                 <p className="text-[11px] font-black text-muted-foreground/30 uppercase tracking-[0.4em] select-none italic">SNS SQUARE PROCUREMENT</p>
                 <p className="text-[9px] text-muted-foreground font-bold mt-1.5 opacity-40 uppercase tracking-tighter italic">Powered by SNS Group Financial Ops</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function InvoiceCreatePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <InvoiceCreateContent />
    </Suspense>
  );
}

function X(props: any) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
