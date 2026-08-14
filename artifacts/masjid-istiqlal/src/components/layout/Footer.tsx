import { Link } from "wouter";
import { useGetSettings } from "@workspace/api-client-react";
import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail } from "lucide-react";

type FooterLink = { label: string; url: string };

const DEFAULT_FOOTER_LINKS: FooterLink[] = [
  { label: "Beranda", url: "/" },
  { label: "Profil", url: "/profil" },
  { label: "Berita & Artikel", url: "/berita" },
  { label: "Jadwal Kegiatan", url: "/kegiatan" },
  { label: "Live CCTV", url: "/cctv" },
];

function getFooterLinks(value: unknown): FooterLink[] {
  if (typeof value !== "string") return DEFAULT_FOOTER_LINKS;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return DEFAULT_FOOTER_LINKS;
    const links = parsed.filter(
      (item): item is FooterLink =>
        item && typeof item.label === "string" && item.label.trim() &&
        typeof item.url === "string" && item.url.trim(),
    );
    return links.length ? links : DEFAULT_FOOTER_LINKS;
  } catch {
    return DEFAULT_FOOTER_LINKS;
  }
}

export function Footer() {
  const { data: settings } = useGetSettings();
  const footerSettings = settings as any;
  const quickLinks = getFooterLinks(footerSettings?.footerQuickLinks);
  const quickLinksTitle = footerSettings?.footerQuickLinksTitle || "Tautan Cepat";
  const contactTitle = footerSettings?.footerContactTitle || "Kontak Kami";
  const copyright = footerSettings?.footerCopyright || "All rights reserved.";
  const showAdminLink = footerSettings?.footerShowAdminLink !== "false";

  return (
    <footer
      className="pt-16 pb-8 border-t-[6px]"
      style={{
        backgroundColor: "hsl(var(--footer-bg))",
        color: "hsl(var(--footer-text))",
        borderColor: "hsl(var(--secondary))",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8">
          
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src={`${import.meta.env.BASE_URL}images/logo.png`} 
                alt="Logo" 
                className="w-12 h-12 object-contain brightness-0 invert"
              />
              <h2 className="font-display text-2xl font-bold text-secondary">
                {settings?.siteName || "Musholla Nurul Iman"}
              </h2>
            </div>
            <p className="text-primary-foreground/80 max-w-sm leading-relaxed">
              {settings?.description || "Pusat peribadatan dan syiar Islam yang mengedepankan nilai-nilai toleransi dan kedamaian."}
            </p>
            <div className="flex gap-4 pt-2">
              {settings?.facebook && (
                <a href={settings.facebook} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-primary transition-colors">
                  <Facebook size={20} />
                </a>
              )}
              {settings?.twitter && (
                <a href={settings.twitter} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-primary transition-colors">
                  <Twitter size={20} />
                </a>
              )}
              {settings?.instagram && (
                <a href={settings.instagram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-primary transition-colors">
                  <Instagram size={20} />
                </a>
              )}
              {settings?.youtube && (
                <a href={settings.youtube} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-primary transition-colors">
                  <Youtube size={20} />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-xl font-bold text-secondary mb-6 relative inline-block">
              {quickLinksTitle}
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-secondary rounded-full"></span>
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => {
                const isExternal = /^https?:\/\//i.test(link.url);
                return (
                  <li key={`${link.url}-${index}`}>
                    {isExternal ? (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-foreground/80 hover:text-secondary hover:translate-x-1 inline-block transition-all"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.url} className="text-primary-foreground/80 hover:text-secondary hover:translate-x-1 inline-block transition-all">
                        {link.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-xl font-bold text-secondary mb-6 relative inline-block">
              {contactTitle}
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-secondary rounded-full"></span>
            </h3>
            <ul className="space-y-4 text-primary-foreground/80">
              <li className="flex items-start gap-3">
                <MapPin className="text-secondary shrink-0 mt-1" size={20} />
                <span>{settings?.address || "Jl. Taman Wijaya Kusuma, Ps. Baru, Kecamatan Sawah Besar, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10710"}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-secondary shrink-0" size={20} />
                <span>{settings?.phone || "(021) 3811708"}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-secondary shrink-0" size={20} />
                <span>{settings?.email || "info@istiqlal.or.id"}</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-primary-foreground/60 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} {settings?.siteName || "Musholla Nurul Iman"}. {copyright}</p>
          {showAdminLink && (
            <Link href="/admin/login" className="hover:text-secondary transition-colors">Admin Portal</Link>
          )}
        </div>
      </div>
    </footer>
  );
}
