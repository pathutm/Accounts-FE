"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [org, setOrg] = useState<any>(null);

  useEffect(() => {
    const storedOrg = localStorage.getItem("org");
    if (storedOrg) {
      setOrg(JSON.parse(storedOrg));
    }
  }, []);

  if (!org) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome back, {org.name}
        </h2>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your organization&apos;s cashflow status today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Total Revenue</h3>
            <span className="text-primary font-bold text-xl">$124,500</span>
          </div>
          <p className="text-sm text-muted-foreground">
            +12.5% from last month
          </p>
        </div>
        
        <div className="card-surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Active Invoices</h3>
            <span className="text-warning font-bold text-xl">42</span>
          </div>
          <p className="text-sm text-muted-foreground">
            8 pending approval
          </p>
        </div>

        <div className="card-surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Pending Expenses</h3>
            <span className="text-error font-bold text-xl">$12,240</span>
          </div>
          <p className="text-sm text-muted-foreground">
            -2.4% from last month
          </p>
        </div>
      </div>

      <div className="card-surface p-8">
        <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
        <p className="text-muted-foreground italic">No recent activity to display.</p>
      </div>
    </div>
  );
}
