import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, Menu, FileText, Newspaper, 
  Calendar, Image as ImageIcon, Video, Settings, 
  Clock, LogOut, LayoutGrid, KeyRound, LayoutTemplate, Palette, PanelBottom
} from "lucide-react";
import { removeAuthToken } from "@/lib/auth";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/beranda", label: "Manajemen Beranda", icon: LayoutTemplate },
  { href: "/admin/menus", label: "Manajemen Menu", icon: Menu },
  { href: "/admin/pages", label: "Halaman Statis", icon: FileText },
  { href: "/admin/layanan", label: "Layanan", icon: LayoutGrid },
  { href: "/admin/berita", label: "Berita & Artikel", icon: Newspaper },
  { href: "/admin/kegiatan", label: "Kegiatan", icon: Calendar },
  { href: "/admin/galeri", label: "Galeri Foto", icon: ImageIcon },
  { href: "/admin/cctv", label: "Live CCTV", icon: Video },
  { href: "/admin/jadwal", label: "Jadwal Shalat", icon: Clock },
  { href: "/admin/settings", label: "Pengaturan Situs", icon: Settings },
  { href: "/admin/tampilan", label: "Pengaturan Tampilan", icon: Palette },
  { href: "/admin/footer", label: "Pengaturan Footer", icon: PanelBottom },
  { href: "/admin/ubah-password", label: "Ubah Password", icon: KeyRound },
];

export function AdminSidebar() {
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    removeAuthToken();
    setLocation("/admin/login");
  };

  return (
    <aside className="w-64 bg-primary text-primary-foreground hidden md:flex flex-col h-screen sticky top-0 border-r-4 border-secondary">
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-8 h-8 brightness-0 invert" />
        <h2 className="font-display font-bold text-xl text-secondary">Admin Portal</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {adminLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${isActive 
                  ? "bg-secondary text-primary font-bold shadow-lg" 
                  : "text-primary-foreground/80 hover:bg-white/10 hover:text-white"}
              `}
            >
              <Icon size={20} className={isActive ? "text-primary" : "text-primary-foreground/70"} />
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/10">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors"
        >
          <LogOut size={20} />
          Keluar
        </button>
        <Link href="/" className="w-full mt-2 flex items-center justify-center text-xs text-primary-foreground/50 hover:text-white transition-colors">
          Kembali ke Website
        </Link>
      </div>
    </aside>
  );
}
