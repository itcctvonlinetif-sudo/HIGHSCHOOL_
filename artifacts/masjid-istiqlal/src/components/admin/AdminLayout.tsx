import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { AdminSidebar } from "./AdminSidebar";
import { isAuthenticated } from "@/lib/auth";

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated() && location !== "/admin/login") {
      setLocation("/admin/login");
    }
  }, [location, setLocation]);

  // Don't render layout if on login page or redirecting
  if (!isAuthenticated()) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden flex flex-col">
        <header className="bg-white shadow-sm border-b border-border px-8 py-4 md:hidden">
          <h1 className="font-display font-bold text-xl text-primary">Admin Portal</h1>
        </header>
        <div className="p-4 md:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
