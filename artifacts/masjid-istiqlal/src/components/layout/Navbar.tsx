import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu as MenuIcon, X } from "lucide-react";
import { useGetMenus, useGetSettings } from "@workspace/api-client-react";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: menus } = useGetMenus();
  const { data: settings } = useGetSettings();

  const activeMenus = Array.isArray(menus) ? menus.filter(m => m.isActive).sort((a, b) => a.order - b.order) : [];

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-primary/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-primary/5 flex items-center justify-center border border-secondary/30 group-hover:border-secondary transition-colors">
              <img 
                src={`${import.meta.env.BASE_URL}images/logo.png`} 
                alt="Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-primary leading-tight">
                {settings?.siteName || "Musholla Nurul Iman"}
              </h1>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {settings?.tagline || "Official Website"}
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {activeMenus.map((menu) => {
              const isExternal = menu.url.startsWith("http://") || menu.url.startsWith("https://");
              const linkClass = `px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                location === menu.url
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-foreground hover:bg-primary/5 hover:text-primary"
              }`;
              return isExternal ? (
                <a key={menu.id} href={menu.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {menu.label}
                </a>
              ) : (
                <Link key={menu.id} href={menu.url} className={linkClass}>
                  {menu.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t border-primary/10 bg-white shadow-lg">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {activeMenus.map((menu) => {
              const isExternal = menu.url.startsWith("http://") || menu.url.startsWith("https://");
              const mobileClass = `block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                location === menu.url
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-foreground hover:bg-primary/5 hover:text-primary"
              }`;
              return isExternal ? (
                <a key={menu.id} href={menu.url} target="_blank" rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)} className={mobileClass}>
                  {menu.label}
                </a>
              ) : (
                <Link key={menu.id} href={menu.url} onClick={() => setIsOpen(false)} className={mobileClass}>
                  {menu.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
