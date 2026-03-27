"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
  ArrowLeft,
  Download,
  IndianRupee,
  Building2, 
  Mail, 
  Phone, 
  Layers,
  Brain,
  Zap,
  Loader2,
  CheckCircle,
  AlertCircle as AlertIcon,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  TrendingDown,
  TrendingUp,
  X,
  Plus,
  Trash2,
  Save
} from "lucide-react";
import Link from "next/link";

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
  payment_history?: Array<{
    payment_id: string;
    amount: number;
    payment_date: string;
    payment_mode: string;
  }>;
  derived_metrics: {
    days_overdue: number;
  };
}

interface AIResult {
  payment_pattern: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  recommended_strategy: string;
  risk_percentage: number;
  insight: string;
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

const generateNextInvoiceId = (invoices: any[]) => {
  if (!invoices || invoices.length === 0) return "INV-001";
  
  const numericIds = invoices.map(inv => {
    const match = inv.invoice_id.match(/\d+$/);
    return match ? parseInt(match[0]) : 0;
  });
  
  const maxId = Math.max(...numericIds);
  const nextIdNum = maxId + 1;
  
  const sampleId = invoices[0].invoice_id;
  const prefixMatch = sampleId.match(/^(.*?)(\d+)$/);
  const prefix = prefixMatch ? prefixMatch[1] : "INV-";
  const padding = prefixMatch ? prefixMatch[2].length : 3;
  
  return prefix + nextIdNum.toString().padStart(padding, '0');
};

export default function CustomerInvoicesPage() {
  const params = useParams();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<"idle" | "success" | "error">("idle");
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [showAiCard, setShowAiCard] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [org, setOrg] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState<any>({
    invoice_id: "",
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: "",
    place_of_supply: "Tamil Nadu",
    currency: "INR",
    items: [
      {
        item_id: `ITM-${Math.random().toString(36).substr(2, 9)}`,
        item_name: "",
        hsn_code: "",
        uom: "Units",
        quantity: 1,
        unit_price: 0
      }
    ],
    payment: {
      status: "UNPAID",
      paid_amount: 0
    },
    terms_type: "payment within 45 days",
    terms_text: "Payment within 45 days",
    tax_details: {
      cgst_percent: 9,
      sgst_percent: 9,
      gst_percent: 0,
      cess_percent: 0
    }
  });
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const orgData = localStorage.getItem("org");
    if (orgData) setOrg(JSON.parse(orgData));
    if (!token) {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch Customer Details
        const custRes = await fetch(`http://localhost:5000/api/customers/${params.id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const custData = await custRes.json();
        setCustomer(custData);

        // Fetch Invoices for this customer
        const invRes = await fetch(`http://localhost:5000/api/invoices?customer_id=${params.id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const invData = await invRes.json();
        setInvoices(Array.isArray(invData) ? invData : []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const analyseCustomer = async () => {
    if (!customer || invoices.length === 0) return;
    
    setAnalyzing(true);
    setAnalysisStatus("idle");

    // 1. Calculate Summary Metrics
    const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.payment.pending_amount, 0);
    const overdueAmount = invoices.reduce((sum, inv) => 
      inv.derived_metrics.days_overdue > 0 ? sum + inv.payment.pending_amount : sum, 0
    );
    
    const overdueInvoices = invoices.filter(inv => inv.derived_metrics.days_overdue > 0);
    const avgDelayDays = overdueInvoices.length > 0
      ? Math.round(overdueInvoices.reduce((sum, inv) => sum + inv.derived_metrics.days_overdue, 0) / overdueInvoices.length)
      : 0;

    // Last payment calculation
    let lastPaymentDate: Date | null = null;
    invoices.forEach(inv => {
      inv.payment_history?.forEach(payment => {
        const pDate = new Date(payment.payment_date);
        if (!lastPaymentDate || pDate > lastPaymentDate) {
          lastPaymentDate = pDate;
        }
      });
    });

    const lastPaymentDaysAgo = lastPaymentDate 
      ? Math.ceil((new Date().getTime() - (lastPaymentDate as Date).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // 2. Prepare Payload
    const payload = {
      customer: {
        customer_id: customer.Customer_ID,
        company_name: customer.Company_Name,
        industry: customer.Industry,
        credit_limit: customer.Credit_Limit,
        preferred_contact: customer.Preferred_Contact,
        contact_email: customer.Contact_Email,
        currency: customer.Currency
      },
      summary: {
        total_invoices: invoices.length,
        total_outstanding: totalOutstanding,
        overdue_amount: overdueAmount,
        avg_delay_days: avgDelayDays,
        last_payment_days_ago: lastPaymentDaysAgo
      },
      invoices: invoices.map(inv => ({
        invoice_id: inv.invoice_id,
        invoice_date: new Date(inv.invoice_date).toISOString().split('T')[0],
        due_date: new Date(inv.due_date).toISOString().split('T')[0],
        status: inv.payment.status,
        amount: inv.invoice_summary.grand_total,
        pending_amount: inv.payment.pending_amount,
        days_overdue: inv.payment.status === "PAID" ? 0 : Math.max(0, Math.ceil((new Date().getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24)))
      }))
    };

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_ANALYSIS_WEBHOOK_URL || "https://api.agents.snsihub.ai/webhook/AR";
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        // Handle n8n structure (data.items[0].json) OR direct structure (data.result)
        const result = data.result?.ai_output || data.items?.[0]?.json?.ai_output;
        
        if (result) {
          setAiResult(result);
          setShowAiCard(true);
          setAnalysisStatus("success");
        } else {
          console.error("AI Output not found in response:", data);
          setAnalysisStatus("error");
        }
      } else {
        setAnalysisStatus("error");
      }
    } catch (err) {
      console.error("Analysis Error:", err);
      setAnalysisStatus("error");
    } finally {
      setAnalyzing(false);
      setTimeout(() => setAnalysisStatus("idle"), 5000);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedInvoice) return;
    
    setSending(true);
    try {
      // 1. Prepare Payload (All available data)
      const payload = {
        invoice: selectedInvoice,
        customer: customer,
        organization: org,
        // Helper fields for quick access in webhook
        summary: {
          invoice_number: selectedInvoice.invoice_id,
          invoice_date: new Date(selectedInvoice.invoice_date).toISOString().split('T')[0],
          due_date: new Date(selectedInvoice.due_date).toISOString().split('T')[0],
          total_amount: selectedInvoice.invoice_summary.grand_total,
        }
      };
      
      // 2. Send to Webhook
      const response = await fetch("https://api.agents.snsihub.ai/webhook/invoice-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        alert("Invoice shared successfully!");
      } else {
        alert("Webhook returned an error.");
      }
    } catch (err: any) {
      console.error("Email Error:", err);
      // Give more specific error information if available
      const errorMsg = err?.message || "Error generating or sending invoice PDF.";
      alert(`Error detail: ${errorMsg}`);
    } finally {
      setSending(false);
    }
  };

  const handleAddItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [
        ...newInvoice.items,
        {
          item_id: `ITM-${Math.random().toString(36).substr(2, 9)}`,
          item_name: "",
          hsn_code: "",
          uom: "Units",
          quantity: 1,
          unit_price: 0
        }
      ]
    });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...newInvoice.items];
    updatedItems.splice(index, 1);
    setNewInvoice({ ...newInvoice, items: updatedItems });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...newInvoice.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewInvoice({ ...newInvoice, items: updatedItems });
  };

  const calculateInvoiceData = () => {
    const subtotal = newInvoice.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0);
    
    // Tax Calculations based on percentage fields
    const cgst = (subtotal * (newInvoice.tax_details.cgst_percent / 100));
    const sgst = (subtotal * (newInvoice.tax_details.sgst_percent / 100));
    const gst_extra = (subtotal * (newInvoice.tax_details.gst_percent / 100)); // Additional GST if any
    const cess = (subtotal * (newInvoice.tax_details.cess_percent / 100));
    
    const total_tax = cgst + sgst + gst_extra + cess;
    const grand_total = subtotal + total_tax;

    return {
      ...newInvoice,
      customer_id: customer?.Customer_ID || params.id,
      items: newInvoice.items.map((item: any) => {
        const itemSubtotal = item.quantity * item.unit_price;
        return {
          ...item,
          amount: {
            subtotal: itemSubtotal,
            gst_percent: newInvoice.tax_details.cgst_percent + newInvoice.tax_details.sgst_percent + newInvoice.tax_details.gst_percent + newInvoice.tax_details.cess_percent,
            tax_breakup: {
              cgst: itemSubtotal * (newInvoice.tax_details.cgst_percent / 100),
              sgst: itemSubtotal * (newInvoice.tax_details.sgst_percent / 100),
              igst: 0,
              gst: itemSubtotal * (newInvoice.tax_details.gst_percent / 100),
              cess: itemSubtotal * (newInvoice.tax_details.cess_percent / 100)
            },
            total: itemSubtotal * (1 + (newInvoice.tax_details.cgst_percent + newInvoice.tax_details.sgst_percent + newInvoice.tax_details.gst_percent + newInvoice.tax_details.cess_percent) / 100)
          }
        };
      }),
      invoice_summary: {
        subtotal,
        tax_breakup: { 
          total_cgst: cgst, 
          total_sgst: sgst, 
          total_igst: 0,
          total_gst: gst_extra,
          total_cess: cess
        },
        grand_total
      },
      payment: {
        ...newInvoice.payment,
        pending_amount: grand_total - newInvoice.payment.paid_amount
      },
      terms_and_conditions: newInvoice.terms_text,
      derived_metrics: {
        days_overdue: 0
      }
    };
  };

  const handleCreateInvoice = async (e: any) => {
    e.preventDefault();
    const finalData = calculateInvoiceData();
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(finalData)
      });

      if (res.ok) {
        const savedInvoice = await res.json();
        setInvoices([savedInvoice, ...invoices]);
        setShowCreateModal(false);
        alert("Invoice Created and Saved to DB Successfully!");
      } else {
        const error = await res.json();
        const detailMsg = error.details && error.details.length > 0 ? `\n- ${error.details.join('\n- ')}` : "";
        alert(`Error creating invoice: ${error.message || "Failed to save to database"}${detailMsg}`);
      }
    } catch (err) {
      console.error("Error creating invoice:", err);
      alert("Failed to connect to the server.");
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
      {/* Header & Back Button */}
      <div className="flex flex-col gap-4">
        <Link 
          href="/dashboard/customers"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors w-fit group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Portfolio
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card p-6 rounded-3xl border border-border shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none">
            <Building2 className="h-40 w-40" />
          </div>
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                <Building2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tight text-foreground">{customer?.Company_Name}</h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2 py-0.5 bg-primary/5 text-primary rounded border border-primary/10 uppercase tracking-widest">{customer?.Customer_ID}</span>
                  <span className="text-sm text-muted-foreground italic font-medium">{customer?.Industry}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <User className="h-3.5 w-3.5 text-primary/60" />
                {customer?.Primary_Contact}
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Mail className="h-3.5 w-3.5 text-primary/60" />
                {customer?.Contact_Email}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 relative z-10 sm:min-w-[200px]">
            <button 
              onClick={analyseCustomer}
              disabled={analyzing}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded transition-all shadow-md w-full font-sans tracking-tight text-sm font-bold
                ${analyzing ? 'bg-primary/20 text-primary/40 cursor-not-allowed' : 
                  analysisStatus === "success" ? 'bg-green-600 text-white' :
                  analysisStatus === "error" ? 'bg-error text-white' :
                  'bg-primary hover:bg-primary-hover text-white active:scale-95'}`}
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : analysisStatus === "success" ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Success
                </>
              ) : analysisStatus === "error" ? (
                <>
                  <AlertIcon className="h-4 w-4" />
                  Error
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Analyze Customer
                </>
              )}
            </button>
            
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-background border border-border text-foreground/60 hover:text-primary rounded transition-all shadow-sm w-full font-sans tracking-tight text-sm font-bold">
              <Download className="h-4 w-4" />
              Export History
            </button>
          </div>
        </div>
      </div>

      {/* AI Analysis Result Card */}
      {showAiCard && aiResult && (
        <div className="animate-in zoom-in-95 fade-in duration-500 relative">
          <div className={`overflow-hidden rounded-xl border shadow-2xl ${
            aiResult.severity === "HIGH" ? "border-red-200 bg-red-50/10" : 
            aiResult.severity === "MEDIUM" ? "border-amber-200 bg-amber-50/10" : 
            "border-green-200 bg-green-50/10"
          }`}>
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/50">
              {/* Left Side: Summary & Score */}
              <div className="p-8 md:w-1/3 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      aiResult.severity === "HIGH" ? "bg-red-500 text-white" : 
                      aiResult.severity === "MEDIUM" ? "bg-amber-500 text-white" : 
                      "bg-green-500 text-white"
                    }`}>
                      <Zap className="h-5 w-5 fill-current" />
                    </div>
                    <div>
                      <h3 className="font-black text-foreground tracking-tight uppercase text-xs">AI Risk Assessment</h3>
                      <p className={`text-sm font-bold ${
                        aiResult.severity === "HIGH" ? "text-red-600" : 
                        aiResult.severity === "MEDIUM" ? "text-amber-600" : 
                        "text-green-600"
                      }`}>{aiResult.severity} RISK DETECTED</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-end gap-1">
                      <span className="text-5xl font-black text-foreground">{aiResult.risk_percentage}%</span>
                      <span className="text-sm font-bold text-muted-foreground pb-2">Risk Score</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out ${
                          aiResult.severity === "HIGH" ? "bg-red-500" : 
                          aiResult.severity === "MEDIUM" ? "bg-amber-500" : 
                          "bg-green-500"
                        }`}
                        style={{ width: `${aiResult.risk_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/50 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <span>Pattern</span>
                    <span className="text-foreground">{aiResult.payment_pattern}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <span>Strategy</span>
                    <span className="text-primary">{aiResult.recommended_strategy}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Details & Insights */}
              <div className="p-8 md:w-2/3 bg-card/50 relative">
                <button 
                  onClick={() => setShowAiCard(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <Brain className="h-4 w-4" />
                      AI INSIGHTS
                    </div>
                    <p className="text-lg font-medium leading-relaxed text-foreground/90 italic">
                       "{aiResult.insight}"
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 flex gap-4">
                      <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center text-primary shadow-sm border border-border/50">
                        {aiResult.severity === "HIGH" ? <ShieldAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Recommended Action</p>
                        <p className="text-sm font-bold text-foreground capitalize">{aiResult.recommended_strategy.toLowerCase()}</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 flex gap-4">
                      <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center text-primary shadow-sm border border-border/50">
                        {aiResult.risk_percentage > 30 ? <TrendingUp className="h-5 w-5 text-red-500" /> : <TrendingDown className="h-5 w-5 text-green-500" />}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Trend Forecast</p>
                        <p className="text-sm font-bold text-foreground">
                          {aiResult.risk_percentage > 30 ? "Rising Exposure" : "Stable Outlook"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="card-surface overflow-hidden border border-border/50">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground">Billing Statement</h3>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const nextId = generateNextInvoiceId(invoices);
                const today = new Date();
                const dueDate = new Date();
                dueDate.setDate(today.getDate() + 45);

                setNewInvoice({
                  invoice_id: nextId,
                  invoice_date: today.toISOString().split('T')[0],
                  due_date: dueDate.toISOString().split('T')[0],
                  place_of_supply: "Tamil Nadu",
                  currency: "INR",
                  items: [
                    {
                      item_id: `ITM-${Math.random().toString(36).substr(2, 9)}`,
                      item_name: "",
                      hsn_code: "",
                      uom: "Units",
                      quantity: 1,
                      unit_price: 0
                    }
                  ],
                  payment: {
                    status: "UNPAID",
                    paid_amount: 0
                  },
                  terms_type: "payment within 45 days",
                  terms_text: "Payment within 45 days",
                  tax_details: {
                    cgst_percent: 9,
                    sgst_percent: 9,
                    gst_percent: 0,
                    cess_percent: 0
                  }
                });
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-black shadow-lg hover:bg-primary-hover transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              CREATE INVOICE
            </button>
            <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
              Total Invoices: {invoices.length}
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Invoice ID</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Due Date</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground text-right">Amount</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground text-right">Pending</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground text-center">Status</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground text-center">Ageing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((invoice) => {
                const status = getStatusStyles(invoice.payment.status);
                const isOverdue = invoice.derived_metrics.days_overdue > 0;
                
                return (
                  <tr key={invoice._id} className="hover:bg-muted/20 transition-all group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300 shadow-sm border border-primary/10">
                          <FileText className="h-5 w-5" />
                        </div>
                        <button 
                          onClick={() => setSelectedInvoice(invoice)}
                          className="font-bold text-primary text-sm tracking-tight text-left"
                        >
                          {invoice.invoice_id}
                        </button>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground font-medium">
                        <Calendar className="h-4 w-4 shrink-0 text-primary/50" />
                        {new Date(invoice.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground font-medium">
                        <Clock className="h-4 w-4 shrink-0 text-amber-500/50" />
                        {new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="p-5 font-mono text-sm font-bold text-foreground text-right">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: invoice.currency }).format(invoice.invoice_summary.grand_total)}
                    </td>
                    <td className="p-5 font-mono text-sm font-bold text-red-600 text-right">
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
                        <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100 uppercase tracking-widest">
                          {invoice.derived_metrics.days_overdue} days
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100 uppercase tracking-widest">On Time</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-20 text-center space-y-4">
                    <div className="h-24 w-24 bg-muted rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-border/50">
                      <Layers className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-bold text-foreground">No Billing Records</p>
                      <p className="text-muted-foreground">This customer has no invoices recorded in the system.</p>
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
                {/* Secondary buttons removed as requested */}
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
                        <span className="text-slate-700 font-bold">{selectedInvoice.items[0]?.hsn_code || "998314"}</span>
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
                    {selectedInvoice.items.map((item, idx) => (
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
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end p-6">
                 <div className="w-1/3 space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 font-bold">Subtotal</span>
                      <span className="text-slate-800 font-bold font-mono">₹{selectedInvoice.invoice_summary.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 font-bold">CGST @ 9%</span>
                      <span className="text-slate-800 font-bold font-mono">₹{selectedInvoice.invoice_summary.tax_breakup.total_cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 font-bold">SGST @ 9%</span>
                      <span className="text-slate-800 font-bold font-mono">₹{selectedInvoice.invoice_summary.tax_breakup.total_sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
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
                  onClick={handleSendEmail}
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
            {/* Template UI End */}
          </div>
        </div>
      )}
      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 overflow-y-auto">
          <div className="bg-card w-full max-w-4xl rounded-2xl shadow-2xl border border-border animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">Create New Invoice</h2>
                  <p className="text-xs text-muted-foreground font-medium">Entering transaction details for {customer?.Company_Name}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="overflow-y-auto overflow-x-hidden p-6 space-y-8 h-full scrollbar-thin scrollbar-thumb-muted-foreground/20">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Invoice ID</label>
                  <input 
                    required
                    className="w-full bg-muted/5 border border-border rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                    placeholder="INV001"
                    value={newInvoice.invoice_id}
                    onChange={(e) => setNewInvoice({...newInvoice, invoice_id: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Invoice Date</label>
                  <input 
                    required
                    type="date"
                    className="w-full bg-muted/5 border border-border rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                    value={newInvoice.invoice_date}
                    onChange={(e) => setNewInvoice({...newInvoice, invoice_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Due Date</label>
                  <input 
                    required
                    type="date"
                    className="w-full bg-muted/5 border border-border rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                    value={newInvoice.due_date}
                    onChange={(e) => setNewInvoice({...newInvoice, due_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Place of Supply</label>
                  <input 
                    required
                    className="w-full bg-muted/5 border border-border rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                    placeholder="Tamil Nadu"
                    value={newInvoice.place_of_supply}
                    onChange={(e) => setNewInvoice({...newInvoice, place_of_supply: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Currency</label>
                  <select 
                    required
                    className="w-full bg-muted/5 border border-border rounded-xl px-4 py-3 text-sm font-black focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none"
                    value={newInvoice.currency}
                    onChange={(e) => setNewInvoice({...newInvoice, currency: e.target.value})}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Status</label>
                   <select 
                    required
                    className="w-full bg-muted/5 border border-border rounded-xl px-4 py-3 text-sm font-black focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none"
                    value={newInvoice.payment.status}
                    onChange={(e) => setNewInvoice({...newInvoice, payment: {...newInvoice.payment, status: e.target.value}})}
                  >
                    <option value="UNPAID">Unpaid</option>
                    <option value="PARTIALLY_PAID">Partially Paid</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary">Line Items</h3>
                  <button 
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-primary hover:bg-primary/5 px-2 py-1 rounded transition-colors"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {newInvoice.items.map((item: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-12 gap-3 items-end p-4 rounded-xl bg-muted/20 border border-border/50 animate-in slide-in-from-left-2">
                      <div className="col-span-12 md:col-span-4 space-y-1">
                        <label className="text-[8px] font-black uppercase text-muted-foreground">Item Name</label>
                        <input 
                          required
                          className="w-full bg-white border border-border rounded-lg px-3 py-1.5 text-xs font-bold"
                          placeholder="e.g. Technical Services"
                          value={item.item_name}
                          onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                        />
                      </div>
                      <div className="col-span-4 md:col-span-2 space-y-1">
                        <label className="text-[8px] font-black uppercase text-muted-foreground">HSN/SAC</label>
                        <input 
                          required
                          className="w-full bg-white border border-border rounded-lg px-3 py-1.5 text-xs font-bold"
                          placeholder="9983"
                          value={item.hsn_code}
                          onChange={(e) => handleItemChange(idx, 'hsn_code', e.target.value)}
                        />
                      </div>
                      <div className="col-span-4 md:col-span-2 space-y-1">
                        <label className="text-[8px] font-black uppercase text-muted-foreground">Qty</label>
                        <input 
                          required
                          type="number"
                          className="w-full bg-white border border-border rounded-lg px-3 py-1.5 text-xs font-bold"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="col-span-4 md:col-span-3 space-y-1">
                        <label className="text-[8px] font-black uppercase text-muted-foreground">Price</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">₹</span>
                          <input 
                            required
                            type="number"
                            className="w-full bg-white border border-border rounded-lg pl-5 pr-3 py-1.5 text-xs font-bold"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="col-span-12 md:col-span-1 flex justify-center pb-0.5">
                        <button 
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={newInvoice.items.length === 1}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax Details Section */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary">Tax Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">CGST (%)</label>
                    <input 
                      required
                      type="number"
                      className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-bold"
                      value={newInvoice.tax_details.cgst_percent}
                      onChange={(e) => setNewInvoice({...newInvoice, tax_details: {...newInvoice.tax_details, cgst_percent: parseFloat(e.target.value) || 0}})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">SGST (%)</label>
                    <input 
                      required
                      type="number"
                      className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-bold"
                      value={newInvoice.tax_details.sgst_percent}
                      onChange={(e) => setNewInvoice({...newInvoice, tax_details: {...newInvoice.tax_details, sgst_percent: parseFloat(e.target.value) || 0}})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Additional GST (%)</label>
                    <input 
                      required
                      type="number"
                      className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-bold"
                      value={newInvoice.tax_details.gst_percent}
                      onChange={(e) => setNewInvoice({...newInvoice, tax_details: {...newInvoice.tax_details, gst_percent: parseFloat(e.target.value) || 0}})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">CESS (%)</label>
                    <input 
                      required
                      type="number"
                      className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-bold"
                      value={newInvoice.tax_details.cess_percent}
                      onChange={(e) => setNewInvoice({...newInvoice, tax_details: {...newInvoice.tax_details, cess_percent: parseFloat(e.target.value) || 0}})}
                    />
                  </div>
                </div>
              </div>

              {/* Terms & Conditions Section */}
              <div className="space-y-4 pt-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-border pb-2">Terms & Conditions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Select Terms Template</label>
                    <select 
                      required
                      className="w-full bg-muted/5 border border-border rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      value={newInvoice.terms_type}
                      onChange={(e) => {
                        const val = e.target.value;
                        const isEditable = [
                          "payment within 45 days", 
                          "2% discount on earily payment", 
                          "50% advace for new customer"
                        ].includes(val);
                        
                        setNewInvoice({
                          ...newInvoice,
                          terms_type: val,
                          terms_text: isEditable ? val.charAt(0).toUpperCase() + val.slice(1) : val
                        });
                      }}
                    >
                      <option value="payment within 45 days">payment within 45 days (Editable)</option>
                      <option value="full payment">full payment</option>
                      <option value="Partial Payment">Partial Payment</option>
                      <option value="2% discount on earily payment">2% discount on earily payment (Editable)</option>
                      <option value="50% advace for new customer">50% advace for new customer (Editable)</option>
                    </select>
                  </div>
                  
                  {/* Terms Editor - only if editable or just always allow refinement */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Final Terms Description</label>
                    <input 
                      required
                      className="w-full bg-muted/5 border border-border rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-50"
                      value={newInvoice.terms_text}
                      disabled={["full payment", "Partial Payment"].includes(newInvoice.terms_type)}
                      onChange={(e) => setNewInvoice({...newInvoice, terms_text: e.target.value})}
                      placeholder="Enter specific term details..."
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-6 border-t border-border flex justify-between items-center bg-muted/10 -mx-6 -mb-6 p-6 rounded-b-2xl">
                <div className="text-sm font-black text-slate-800">
                  <span className="text-muted-foreground uppercase text-[10px] block font-bold">Estimated Grand Total</span>
                  <span className="text-lg">₹{
                    (newInvoice.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0) * 
                    (1 + (newInvoice.tax_details.cgst_percent + newInvoice.tax_details.sgst_percent + newInvoice.tax_details.gst_percent + newInvoice.tax_details.cess_percent) / 100))
                    .toLocaleString('en-IN', { minimumFractionDigits: 2 })
                  }</span>
                  <span className="text-[8px] text-muted-foreground ml-2">
                    (Inc. {newInvoice.tax_details.cgst_percent + newInvoice.tax_details.sgst_percent + newInvoice.tax_details.gst_percent + newInvoice.tax_details.cess_percent}% Total Tax)
                  </span>
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex items-center gap-2 px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-black shadow-xl hover:bg-primary-hover transition-all active:scale-95"
                  >
                    <Save className="h-4 w-4" />
                    SAVE INVOICE
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
