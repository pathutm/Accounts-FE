"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, ShieldAlert } from "lucide-react";

interface Category {
  _id: string;
  type: string;
  label: string;
  behavior: string;
  risk: string;
  strategy: {
    title: string;
    action: string;
  };
  outcome: {
    best_case: string;
    worst_case: string;
  };
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "LOW":
      return "text-green-600 bg-green-50 border-green-200";
    case "MEDIUM_LOW":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "MEDIUM":
      return "text-amber-600 bg-amber-50 border-amber-200";
    case "HIGH":
      return "text-orange-600 bg-orange-50 border-orange-200";
    case "VERY_HIGH":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-muted-foreground bg-muted border-border";
  }
};

const getRiskIcon = (risk: string) => {
  switch (risk) {
    case "LOW":
      return <CheckCircle2 className="h-4 w-4" />;
    case "MEDIUM_LOW":
      return <Info className="h-4 w-4" />;
    case "MEDIUM":
      return <AlertCircle className="h-4 w-4" />;
    case "HIGH":
      return <AlertTriangle className="h-4 w-4" />;
    case "VERY_HIGH":
      return <ShieldAlert className="h-4 w-4" />;
    default:
      return null;
  }
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Category Master Table</h2>
        <p className="text-muted-foreground">
          Comprehensive classification of payment behaviors and collection strategies.
        </p>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="p-4 font-semibold text-sm">Classification</th>
                <th className="p-4 font-semibold text-sm">Behavior</th>
                <th className="p-4 font-semibold text-sm">Risk Level</th>
                <th className="p-4 font-semibold text-sm">Strategy & Action</th>
                <th className="p-4 font-semibold text-sm">Outcomes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((item) => (
                <tr key={item._id} className="hover:bg-muted/30 transition-colors group">
                  <td className="p-4">
                    <span className="font-medium text-foreground">{item.label}</span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                    {item.behavior}
                  </td>
                  <td className="p-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRiskColor(item.risk)}`}>
                      {getRiskIcon(item.risk)}
                      {item.risk}
                    </div>
                  </td>
                  <td className="p-4 max-w-xs">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-foreground">{item.strategy.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {item.strategy.action}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">
                          <strong className="text-foreground">Best:</strong> {item.outcome.best_case}
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">
                          <strong className="text-foreground">Worst:</strong> {item.outcome.worst_case}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
