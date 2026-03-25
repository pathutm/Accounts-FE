"use client";

import { useEffect, useState } from "react";
import { 
  Building2, 
  MapPin, 
  User, 
  Mail, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  ShieldAlert,
  ShieldQuestion,
  Search,
  Download,
  Filter,
  MoreVertical,
  Calendar,
  Briefcase,
  Contact2
} from "lucide-react";

interface Customer {
  _id: string;
  Customer_ID: string;
  Company_Name: string;
  Industry: string;
  Country: string;
  City: string;
  Customer_Since: string;
  Credit_Limit: number;
  Credit_Score: number;
  Risk_Category: string;
  Preferred_Contact: string;
  Account_Manager: string;
  Contract_Type: string;
  Currency: string;
  Tax_ID: string;
  Primary_Contact: string;
  Contact_Email: string;
}

const getRiskStyles = (risk: string) => {
  switch (risk) {
    case "LOW":
      return { 
        bg: "bg-green-50", 
        text: "text-green-600", 
        border: "border-green-200", 
        icon: <ShieldCheck className="h-3 w-3" /> 
      };
    case "MEDIUM_LOW":
    case "MEDIUM":
      return { 
        bg: "bg-amber-50", 
        text: "text-amber-600", 
        border: "border-amber-200", 
        icon: <ShieldQuestion className="h-3 w-3" /> 
      };
    case "HIGH":
    case "VERY_HIGH":
      return { 
        bg: "bg-red-50", 
        text: "text-red-600", 
        border: "border-red-200", 
        icon: <ShieldAlert className="h-3 w-3" /> 
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

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:5000/api/customers", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setCustomers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching customers:", err);
        setLoading(false);
      });
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.Company_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.Customer_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.Industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Customer Portfolio</h2>
          <p className="text-muted-foreground">Comprehensive overview of client relationships, credit terms, and risk profiling.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name, ID or industry..."
              className="pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 hover:border-primary/50 transition-all w-80 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-all shadow-sm">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-md">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="card-surface overflow-hidden border border-border/50">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse min-w-[1600px]">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground sticky left-0 bg-card/95 backdrop-blur-sm z-10 w-[300px]">Company & Industry</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Location</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Client Since</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Credit Limit</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground text-center">Credit Score</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Risk Category</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Account Manager</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Tax ID</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Primary Contact</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCustomers.map((customer) => {
                const risk = getRiskStyles(customer.Risk_Category);
                return (
                  <tr key={customer._id} className="hover:bg-muted/20 transition-all group">
                    <td className="p-5 sticky left-0 bg-card/95 backdrop-blur-sm shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300 shadow-inner">
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                          <span className="font-bold text-foreground text-sm truncate">{customer.Company_Name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-muted rounded text-muted-foreground whitespace-nowrap">{customer.Customer_ID}</span>
                            <span className="text-xs text-muted-foreground truncate italic">{customer.Industry}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <MapPin className="h-3.5 w-3.5 text-primary/70" />
                          <span>{customer.City}</span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-5">{customer.Country}</span>
                      </div>
                    </td>
                    <td className="p-5 text-sm text-foreground">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                        {customer.Customer_Since}
                      </div>
                    </td>
                    <td className="p-5 font-mono text-sm font-bold text-foreground">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: customer.Currency }).format(customer.Credit_Limit)}
                    </td>
                    <td className="p-5 text-center">
                      <div className={`text-lg font-black ${getScoreColor(customer.Credit_Score)}`}>
                        {customer.Credit_Score}
                      </div>
                      <div className="w-16 h-1.5 bg-muted rounded-full mx-auto mt-1 overflow-hidden">
                        <div 
                          className={`h-full ${customer.Credit_Score >= 80 ? 'bg-green-500' : customer.Credit_Score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${customer.Credit_Score}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-5">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${risk.bg} ${risk.text} ${risk.border}`}>
                        {risk.icon}
                        {customer.Risk_Category.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="p-5 text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-primary/60" />
                        {customer.Account_Manager}
                      </div>
                    </td>
                    <td className="p-5 font-mono text-xs text-muted-foreground uppercase">
                      {customer.Tax_ID}
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Contact2 className="h-4 w-4 text-primary/70" />
                          <span>{customer.Primary_Contact}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[150px]">{customer.Contact_Email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <button className="p-2 hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredCustomers.length === 0 && (
            <div className="p-20 text-center space-y-4">
              <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Search className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold text-foreground">No matches found</p>
                <p className="text-muted-foreground">Adjust your filters or search terms to find what you&apos;re looking for.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
