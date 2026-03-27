"use client";

import { useEffect, useState, use } from "react";
import { 
  FileText, 
  ChevronLeft, 
  Save, 
  Package, 
  Calendar, 
  Building2, 
  CheckCircle2,
  Loader2,
  AlertCircle,
  IndianRupee,
  Plus
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  items: POItem[];
  vendorId: {
    vendor_legal_name: string;
  };
}

export default function CreateGRNPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receivedItems, setReceivedItems] = useState<any[]>([]);
  const [organization, setOrganization] = useState<any>(null);
  const [grnNumber, setGrnNumber] = useState(`GRN-${Math.floor(1000 + Math.random() * 9000)}`);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [personResponsible, setPersonResponsible] = useState("Warehouse Admin");

  useEffect(() => {
    fetchPODetails();
    fetchOrgProfile();
  }, [id]);

  const fetchOrgProfile = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const orgId = storedUser.organizationId;
      if (!orgId) return;

      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/organizations/${orgId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrganization(data);
      }
    } catch (err) {
      console.error("Failed to fetch organization profile:", err);
    }
  };

  const fetchPODetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/purchase-orders/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPo(data);
        setReceivedItems(data.items.map((item: POItem) => ({
          ...item,
          receivedQuantity: item.quantity
        })));
      }
    } catch (err) {
      console.error("Failed to fetch PO for GRN:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = (idx: number, val: number) => {
    const updated = [...receivedItems];
    updated[idx].receivedQuantity = val;
    setReceivedItems(updated);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        grnNumber,
        purchaseOrderId: id,
        poNumber: po?.po_number,
        vendorName: po?.vendorId.vendor_legal_name,
        receivedDate,
        notes,
        personResponsible,
        receivedPlaceAddress: organization?.profile ? `${organization.profile.address}, ${organization.profile.city}, ${organization.profile.state}, ${organization.profile.postal_code}` : "SNS Kalvinagar, Valliyampalayam, Coimbatore, Tamil Nadu - 641035",
        items: receivedItems.map(item => ({
          description: item.description,
          orderedQuantity: item.quantity,
          receivedQuantity: item.receivedQuantity
        })),
        submittedAt: new Date().toISOString(),
        organizationId: JSON.parse(localStorage.getItem("user") || "{}").organizationId || "ORG-DEFAULT"
      };

      const res = await fetch(process.env.NEXT_PUBLIC_GRN_POST || 'https://api.agents.snsihub.ai/webhook/GRN', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("✅ Goods Received Note (GRN) synchronized successfully!");
        router.push(`/dashboard/purchase-orders/${id}`);
      } else {
        throw new Error("Failed to synchronize GRN");
      }
    } catch (err) {
      console.error("GRN Synchronization Error:", err);
      alert("❌ Failed to synchronize GRN with the audit system.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
      <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Initializing GRN Manifest...</p>
    </div>
  );

  if (!po) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <AlertCircle className="h-12 w-12 text-error opacity-20" />
      <p className="font-black text-xl">Purchase Order Not Found</p>
      <Link href="/dashboard/purchase-orders" className="text-primary font-bold hover:underline">Back to Orders</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20 mt-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-50 py-4 border-b border-border/10">
        <div className="space-y-1">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group mb-1">
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to PO
          </button>
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                <Package className="h-6 w-6" />
             </div>
             <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
                Create GRN
             </h1>
             <span className="text-[10px] px-3 py-1 bg-primary/5 text-primary rounded-full border border-primary/10 uppercase tracking-widest font-black">
                Verification
             </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-primary/25 disabled:opacity-50 group"
            >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 group-active:scale-95 transition-transform" />}
                <span>Confirm Receipt</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {/* Main Form (2/3) */}
         <div className="md:col-span-2 space-y-8">
            <div className="card-surface p-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                  <Package className="h-40 w-40" />
               </div>

               <div className="flex items-center gap-3 pb-6 border-b border-border/50 mb-8 relative z-10">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                     <h2 className="font-black uppercase tracking-tight text-sm">Inventory Log</h2>
                     <p className="text-[10px] font-bold text-muted-foreground/60 uppercase">Matching against: {po.po_number}</p>
                  </div>
               </div>

               <div className="space-y-6 relative z-10">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 pb-4">
                           <th className="pb-4">Product Detail</th>
                           <th className="pb-4 text-center">Ordered Units</th>
                           <th className="pb-4 text-right">Receiving</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-border/20">
                        {receivedItems.map((item, idx) => (
                           <tr key={idx} className="group hover:bg-muted/5 transition-all">
                              <td className="py-5 text-sm font-bold text-foreground uppercase tracking-tight">{item.description}</td>
                              <td className="py-5 text-sm font-black text-center text-muted-foreground/40">{item.quantity}</td>
                              <td className="py-5 text-right w-32">
                                 <div className="flex items-center justify-end gap-2">
                                    <input 
                                       type="number"
                                       max={item.quantity}
                                       min={0}
                                       value={item.receivedQuantity}
                                       onChange={(e) => handleUpdateQuantity(idx, parseInt(e.target.value) || 0)}
                                       className="w-24 px-4 py-2 bg-muted/30 border border-border rounded-lg text-right text-sm font-black focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                    />
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>

                  <div className="pt-8 space-y-4">
                     <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Discrepancy Notes</h3>
                     </div>
                     <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Condition of goods, packaging issues, or discrepancies..."
                        className="w-full min-h-[140px] p-6 bg-muted/20 border border-border/50 rounded-lg text-sm font-medium focus:ring-4 focus:ring-primary/5 outline-none transition-all italic placeholder:text-muted-foreground/30"
                     />
                  </div>
               </div>
            </div>
         </div>

         {/* Sidebar Metadata (1/3) */}
         <div className="space-y-8">
            <div className="card-surface p-8 space-y-6">
               <div className="flex items-center gap-2 pb-4 border-b border-border/50">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                  <h2 className="font-black uppercase tracking-tight text-xs text-foreground">GRN Manifest</h2>
               </div>
               
               <div className="space-y-6">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.2em]">GRN Reference</label>
                     <p className="text-sm font-black text-foreground uppercase tracking-tight">{grnNumber}</p>
                  </div>

                  <div className="space-y-1 pt-4 border-t border-border/50">
                     <label className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.2em]">Person Responsible</label>
                     <input 
                        type="text"
                        value={personResponsible}
                        onChange={(e) => setPersonResponsible(e.target.value)}
                        className="w-full bg-transparent border-none p-0 text-sm font-black text-foreground focus:ring-0 hover:text-primary transition-colors mt-1"
                     />
                  </div>

                  <div className="space-y-1 pt-4 border-t border-border/50">
                     <label className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.2em]">Received Place Address</label>
                     <p className="text-[11px] font-bold text-muted-foreground leading-tight italic">
                        {organization?.profile ? (
                          `${organization.profile.address}, ${organization.profile.city}, ${organization.profile.state} - ${organization.profile.postal_code}`
                        ) : (
                          "SNS Kalvinagar, Valliyampalayam, Coimbatore, Tamil Nadu - 641035"
                        )}
                     </p>
                  </div>

                  <div className="space-y-1 pt-4 border-t border-border/50">
                     <label className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.2em] flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Date
                     </label>
                     <input 
                        type="date"
                        value={receivedDate}
                        onChange={(e) => setReceivedDate(e.target.value)}
                        className="w-full bg-transparent border-none p-0 text-sm font-black text-foreground focus:ring-0 cursor-pointer hover:text-primary transition-colors mt-1"
                     />
                  </div>

                  <div className="space-y-1 pt-4 border-t border-border/50">
                     <label className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.2em]">Procured From</label>
                     <p className="text-sm font-black text-primary uppercase tracking-tighter leading-tight bg-primary/5 p-3 rounded-lg border border-primary/10 mt-1">{po.vendorId.vendor_legal_name}</p>
                  </div>
               </div>
            </div>

            <div className="p-8 border border-dashed border-border rounded-lg bg-muted/5 space-y-4 font-sans">
               <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-amber-500/10 rounded-full flex items-center justify-center">
                     <AlertCircle className="h-4 w-4 text-amber-600" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Compliance Policy</h4>
               </div>
               <p className="text-[11px] font-medium text-muted-foreground leading-relaxed italic opacity-80">
                  Receipt confirmation triggers the internal audit trail for inventory balance. Ensure physical inspection matches input data.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
