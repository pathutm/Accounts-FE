"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Save, 
  FileText, 
  Building2, 
  Calendar, 
  Truck, 
  IndianRupee,
  ChevronLeft,
  Briefcase,
  Zap,
  ShieldAlert,
  ShieldCheck,
  X,
  Loader2
} from "lucide-react";
import Link from "next/link";

interface POItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function CreatePurchaseOrder() {
  const [vendor, setVendor] = useState("");
  const [vendors, setVendors] = useState<any[]>([]);
  const [poNumber, setPoNumber] = useState(`PO-${Math.floor(1000 + Math.random() * 9000)}`);
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [items, setItems] = useState<POItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0 }
  ]);
  const [notes, setNotes] = useState("");
  const [webhookResponse, setWebhookResponse] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/vendors`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setVendors(data);
        }
      } catch (err) {
        console.error("Failed to fetch vendors:", err);
      }
    };

    fetchVendors();
  }, []);

  const handleSavePO = async () => {
    if (!vendor) {
      alert("Please select a vendor");
      return;
    }

    try {
      const selectedVendor = vendors.find(v => v._id === vendor);
      const category = selectedVendor?.product_info?.category;
      
      if (!category) {
        alert("Selected vendor has no category mapping");
        return;
      }

      const token = localStorage.getItem("token");
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      // 1. Fetch current budget for this category
      const budgetRes = await fetch(`${baseUrl}/api/budgets/category/${encodeURIComponent(category)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      let budgetData = null;
      if (budgetRes.ok) {
        budgetData = await budgetRes.json();
      } else {
        console.warn("Budget data not available for this category");
      }

      // 2. Prepare payload
      const payload = {
        po_request: {
          po_number: poNumber,
          po_date: poDate,
          delivery_date: deliveryDate,
          vendor: {
            id: selectedVendor._id,
            name: selectedVendor.vendor_legal_name,
            category: category,
            email: selectedVendor.primary_contact?.email
          },
          items: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total: item.quantity * item.unitPrice
          })),
          grand_total: total,
          notes: notes
        },
        budget_analysis: budgetData ? {
          fiscal_year: budgetData.fiscal_year,
          category: budgetData.category,
          total_budget: budgetData.total_budget,
          spent_amount: budgetData.spent_amount,
          allocated_amount: budgetData.allocated_amount,
          remaining_budget: budgetData.remaining_budget,
          utilization_percentage: ((budgetData.spent_amount + budgetData.allocated_amount) / budgetData.total_budget * 100).toFixed(2),
          new_proposed_total: total,
          will_exceed_budget: (budgetData.remaining_budget - total) < 0
        } : "NO_BUDGET_DATA"
      };

      console.log("Sending payload to webhook:", payload);
      setIsSubmitting(true);
      setWebhookResponse(null);

      // 3. Trigger Webhook
      const webhookUrl = process.env.NEXT_PUBLIC_PO_BUDGET_WEBHOOK || "https://api.agents.snsihub.ai/webhook/PO";
      
      const webhookRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (webhookRes.ok) {
        const result = await webhookRes.json();
        console.log("Full Webhook Response:", result);
        
        let message = "PO Request sent successfully!";
        
        // Handle result.message structure provided by user
        if (result?.result?.message) {
          message = result.result.message;
        }
        // Handle n8n-style array response: [{ json: { message: "..." } }]
        else if (Array.isArray(result) && result[0]?.json?.message) {
          message = result[0].json.message;
        } 
        // Handle direct object response: { message: "..." }
        else if (result?.message) {
          message = result.message;
        }
        // Handle nested json object: { json: { message: "..." } }
        else if (result?.json?.message) {
          message = result.json.message;
        }
        
        setWebhookResponse(message);

      } else {
        setWebhookResponse("Error: Could not process budget analysis via AI agent.");
      }

    } catch (err) {
      console.error("Error saving PO:", err);
      setWebhookResponse("A system error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), description: "", quantity: 1, unitPrice: 0 }]);
  };

  const fillSampleData = () => {
    if (vendors.length > 0) {
      setVendor(vendors[0]._id);
    }
    
    // Set delivery date to 7 days from now
    const dummyDate = new Date();
    dummyDate.setDate(dummyDate.getDate() + 7);
    setDeliveryDate(dummyDate.toISOString().split('T')[0]);

    setItems([
      { id: "1", description: "ThinkPad X1 Carbon Gen 11 (32GB RAM, 1TB SSD)", quantity: 2, unitPrice: 165000 },
      { id: "2", description: "Dell UltraSharp 27\" 4K Monitor (U2723QE)", quantity: 4, unitPrice: 48500 },
      { id: "3", description: "Logitech MX Master 3S Wireless Mouse", quantity: 5, unitPrice: 8900 }
    ]);

    setNotes("Priority delivery requested. Please ensure items are well-packaged for fragile transport. All laptops must come with global warranty documentation.");
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof POItem, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  
  const subtotal = calculateSubtotal();
  const total = subtotal;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20">
      {/* Webhook Response Alert */}
      {webhookResponse && (
        <div className={`p-6 rounded-xl border animate-in slide-in-from-top-4 duration-500 flex items-start gap-4 shadow-xl ${
          webhookResponse.toLowerCase().includes('exceeds') || webhookResponse.toLowerCase().includes('error')
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
            webhookResponse.toLowerCase().includes('exceeds') || webhookResponse.toLowerCase().includes('error')
              ? 'bg-red-100'
              : 'bg-emerald-100'
          }`}>
            {webhookResponse.toLowerCase().includes('exceeds') 
              ? <ShieldAlert className="h-5 w-5 text-red-600" />
              : <ShieldCheck className="h-5 w-5 text-emerald-600" />
            }
          </div>
          <div className="space-y-1">
            <h3 className="font-black uppercase tracking-tight text-xs">AI Financial Guard - Response</h3>
            <p className="text-sm font-medium leading-relaxed">{webhookResponse}</p>
          </div>
          <button 
            onClick={() => setWebhookResponse(null)}
            className="ml-auto p-1 hover:bg-black/5 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-2 group">
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
              <Plus className="h-6 w-6" />
            </div>
            Raise Purchase Order
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fillSampleData}
            className="flex items-center gap-2 px-4 py-3 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg text-sm font-bold transition-all border border-border/50"
          >
            <Zap className="h-4 w-4 text-amber-500 fill-amber-500/20" />
            <span>Fill Sample Data</span>
          </button>
          <button 
            onClick={handleSavePO}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-primary/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Purchase Order</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Vendor & Details */}
          <div className="card-surface p-8 space-y-6 border border-border/50">
            <div className="flex items-center gap-2 pb-4 border-b border-border/50">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-lg">Vendor Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Select Vendor</label>
                <select 
                  className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                >
                  <option value="">Choose a vendor...</option>
                  {vendors.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.vendor_legal_name} ({v.product_info?.category || 'General'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Expected Delivery</label>
                <div className="relative">
                  <Truck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="date" 
                    className="w-full pl-11 pr-4 py-3 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="card-surface p-8 space-y-6 border border-border/50 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none">
                <Briefcase className="h-40 w-40" />
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-border/50 relative z-10">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-lg">Order Items</h2>
              </div>
              <button 
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-xs font-bold transition-all text-foreground/80"
              >
                <Plus className="h-3 w-3" />
                Add Item
              </button>
            </div>

            <div className="space-y-4 relative z-10">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-end animate-in slide-in-from-left-2 duration-300">
                  <div className="col-span-12 md:col-span-4 space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Description</label>
                    <input 
                      type="text" 
                      placeholder="Enter item description..."
                      className="w-full px-4 py-2.5 bg-muted/20 border border-border rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Qty</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-2.5 bg-muted/20 border border-border rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium text-center"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-8 md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Price (₹)</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-2.5 bg-muted/20 border border-border rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-10 md:col-span-3 space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Total (₹)</label>
                    <div className="w-full px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-lg text-sm font-black text-primary flex items-center h-[42px]">
                      {new Intl.NumberFormat('en-IN').format(item.quantity * item.unitPrice)}
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-1 flex items-center justify-end">
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="card-surface p-8 space-y-4 border border-border/50">
            <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Notes & Special Instructions</label>
            <textarea 
              className="w-full px-4 py-4 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm min-h-[100px]"
              placeholder="Add any specific requirements or delivery instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-8">
          <div className="card-surface p-8 space-y-6 border border-border/50 bg-primary/[0.02]">
            <div className="flex items-center gap-2 pb-4 border-b border-border/50">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-lg">PO Summary</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-black">PO Number</span>
                <span className="font-bold font-mono bg-muted px-2 py-0.5 rounded text-primary">{poNumber}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-black">PO Date</span>
                <span className="font-bold">{new Date(poDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              
              <div className="h-px bg-border/50 my-6" />
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-border/50 mt-4">
                  <span className="text-lg font-black tracking-tight">Grand Total</span>
                  <span className="text-2xl font-black text-primary flex items-center gap-1">
                    <IndianRupee className="h-5 w-5" />
                    {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-6 rounded-xl space-y-3">
            <h4 className="text-amber-800 font-bold text-sm flex items-center gap-2 uppercase tracking-tight">
              <Plus className="h-4 w-4" />
              Guidelines
            </h4>
            <ul className="text-xs text-amber-700 space-y-2 list-disc pl-4 font-medium leading-relaxed">
              <li>Ensure vendor details are verified.</li>
              <li>PO will undergo internal approval workflow.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
