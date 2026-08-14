import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminLayout } from "@/components/admin/AdminLayout";

import { Home } from "@/pages/public/Home";
import { Profil } from "@/pages/public/Profil";
import { Berita } from "@/pages/public/Berita";
import { BeritaDetail } from "@/pages/public/BeritaDetail";
import { Kegiatan } from "@/pages/public/Kegiatan";
import { Galeri } from "@/pages/public/Galeri";
import { CCTV } from "@/pages/public/CCTV";
import { Kontak } from "@/pages/public/Kontak";
import { HalamanDetail } from "@/pages/public/HalamanDetail";

import { AdminLogin } from "@/pages/admin/Login";
import { AdminDashboard } from "@/pages/admin/Dashboard";
import { AdminMenus } from "@/pages/admin/Menus";
import { AdminPages } from "@/pages/admin/Pages";
import { AdminBerita } from "@/pages/admin/Berita";
import { AdminKegiatan } from "@/pages/admin/Kegiatan";
import { AdminGaleri } from "@/pages/admin/Galeri";
import { AdminCCTV } from "@/pages/admin/CCTVAdmin";
import { AdminSettings } from "@/pages/admin/Settings";
import { AdminJadwal } from "@/pages/admin/Jadwal";
import { AdminLayanan } from "@/pages/admin/Layanan";
import { AdminUbahPassword } from "@/pages/admin/UbahPassword";
import { AdminBeranda } from "@/pages/admin/Beranda";
import { AdminTampilan } from "@/pages/admin/Tampilan";
import { AdminFooter } from "@/pages/admin/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const withAdmin = (Component: React.ComponentType) => () => (
  <AdminLayout>
    <Component />
  </AdminLayout>
);

const withPublic = (Component: React.ComponentType) => () => (
  <PublicLayout>
    <Component />
  </PublicLayout>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            {/* Admin Login — no layout wrapper */}
            <Route path="/admin/login" component={AdminLogin} />

            {/* Admin sub-pages — each explicitly registered */}
            <Route path="/admin/menus" component={withAdmin(AdminMenus)} />
            <Route path="/admin/pages" component={withAdmin(AdminPages)} />
            <Route path="/admin/berita" component={withAdmin(AdminBerita)} />
            <Route path="/admin/kegiatan" component={withAdmin(AdminKegiatan)} />
            <Route path="/admin/galeri" component={withAdmin(AdminGaleri)} />
            <Route path="/admin/cctv" component={withAdmin(AdminCCTV)} />
            <Route path="/admin/layanan" component={withAdmin(AdminLayanan)} />
            <Route path="/admin/beranda" component={withAdmin(AdminBeranda)} />
            <Route path="/admin/settings" component={withAdmin(AdminSettings)} />
            <Route path="/admin/tampilan" component={withAdmin(AdminTampilan)} />
            <Route path="/admin/footer" component={withAdmin(AdminFooter)} />
            <Route path="/admin/jadwal" component={withAdmin(AdminJadwal)} />
            <Route path="/admin/ubah-password" component={withAdmin(AdminUbahPassword)} />

            {/* Admin dashboard — must come after sub-pages */}
            <Route path="/admin" component={withAdmin(AdminDashboard)} />

            {/* Public pages */}
            <Route path="/profil" component={withPublic(Profil)} />
            <Route path="/berita/:id" component={withPublic(BeritaDetail)} />
            <Route path="/berita" component={withPublic(Berita)} />
            <Route path="/kegiatan" component={withPublic(Kegiatan)} />
            <Route path="/galeri" component={withPublic(Galeri)} />
            <Route path="/cctv" component={withPublic(CCTV)} />
            <Route path="/kontak" component={withPublic(Kontak)} />
            <Route path="/halaman/:slug" component={withPublic(HalamanDetail)} />
            <Route path="/" component={withPublic(Home)} />

            <Route component={NotFound} />
          </Switch>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
