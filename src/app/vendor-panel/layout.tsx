"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  FileText, 
  LogOut, 
  TrendingUp,
  Menu,
  X,
  Package,
  MessageSquare
} from "lucide-react";

export default function VendorPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      router.push("/");
    } else {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'vendor') {
          router.push("/dashboard");
        } else {
          setUser(parsedUser);
        }
      } catch (e) {
        router.push("/");
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  if (!user) return null;

  const sidebarItems = [
    { name: "Received Orders", href: "/vendor-panel", icon: Package },
    { name: "My Invoices", href: "/vendor-panel/invoices", icon: FileText },
    { name: "Client Messages", href: "/vendor-panel/messages", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-background flex font-sans">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-card border-r border-border transition-all duration-300 flex flex-col fixed h-full z-20`}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <TrendingUp className="h-6 w-6 text-primary shrink-0" />
              <span className="font-bold text-lg text-foreground truncate">Vendor Portal</span>
            </div>
          ) : (
            <TrendingUp className="h-6 w-6 text-primary mx-auto" />
          )}
        </div>

        <nav className="flex-1 px-4 space-y-6 overflow-y-auto scrollbar-none mt-4">
           <div className="space-y-2">
            {isSidebarOpen && (
              <h3 className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                Main Menu
              </h3>
            )}
            <div className="space-y-1">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all group ${
                      isActive 
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "group-hover:text-primary transition-colors"}`} />
                    {isSidebarOpen && <span className="font-semibold text-sm tracking-tight">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-error hover:bg-error/10 transition-all font-bold group`}
          >
            <LogOut className="h-5 w-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="text-sm tracking-tight">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-20"}`}>
        <header className="h-16 bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-10 flex items-center justify-between px-8">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-muted rounded-lg text-muted-foreground"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-black text-primary uppercase tracking-widest leading-tight">{user.role}</p>
              <p className="text-sm font-bold text-foreground leading-tight">{user.name}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 shadow-inner">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
