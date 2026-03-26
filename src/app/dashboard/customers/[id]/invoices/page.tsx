"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  X
} from "lucide-react";
import Link from "next/link";

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

  useEffect(() => {
    const token = localStorage.getItem("token");
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
          <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
            Total Invoices: {invoices.length}
          </span>
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
                        <span className="font-bold text-foreground text-sm tracking-tight">{invoice.invoice_id}</span>
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
    </div>
  );
}
