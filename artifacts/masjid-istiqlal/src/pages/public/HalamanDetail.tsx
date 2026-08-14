import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Image as ImageIcon, Video as VideoIcon, Globe, Lock, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { toGDriveImageUrl } from "@/lib/gdrive";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type UrlEntry = { label: string; url: string };

type Page = {
  id: number;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  updatedAt: string;
  imageUrls: string | null;
  websiteUrls: string | null;
  videoUrls: string | null;
  hasPassword?: boolean;
};

function parseUrls(raw: string | null | undefined): UrlEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) =>
        typeof item === "string" ? { label: "", url: item } : { label: item.label ?? "", url: item.url ?? "" }
      ).filter(e => e.url);
    }
  } catch {}
  return [];
}

function getYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function isVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

function PasswordGate({ slug, onGranted }: { slug: string; onGranted: () => void }) {
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/pages/slug/${slug}/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem(`page_access_${slug}`, "true");
        onGranted();
      } else {
        setError(data.message || "Password salah");
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">Halaman Terlindungi</h1>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-20">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Lock size={36} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Terlindungi</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Halaman ini membutuhkan password untuk dapat diakses.
          </p>

          <form onSubmit={handleVerify} className="text-left space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="Masukkan password..."
                  required
                  autoFocus
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {error && <p className="text-red-500 text-sm mt-2">⚠ {error}</p>}
            </div>
            <button type="submit" disabled={verifying}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-70">
              {verifying ? "Memverifikasi..." : "Buka Halaman"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function HalamanDetail() {
  const [, params] = useRoute("/halaman/:slug");
  const slug = params?.slug ?? "";
  const [accessGranted, setAccessGranted] = useState(() =>
    sessionStorage.getItem(`page_access_${slug}`) === "true"
  );

  const { data: page, isLoading, isError } = useQuery<Page>({
    queryKey: ["/api/pages", slug],
    queryFn: () =>
      fetch(`${BASE}/api/pages/slug/${slug}`).then(async r => {
        if (!r.ok) throw new Error("Page not found");
        return r.json();
      }),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Memuat halaman...</div>
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold text-primary mb-4">Halaman Tidak Ditemukan</h1>
          <p className="text-muted-foreground">Halaman yang Anda cari tidak tersedia atau belum dipublikasikan.</p>
        </div>
      </div>
    );
  }

  if (page.hasPassword && !accessGranted) {
    return <PasswordGate slug={slug} onGranted={() => setAccessGranted(true)} />;
  }

  const images = parseUrls(page.imageUrls);
  const websites = parseUrls(page.websiteUrls);
  const videos = parseUrls(page.videoUrls);

  const handleLock = () => {
    sessionStorage.removeItem(`page_access_${slug}`);
    setAccessGranted(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="bg-primary py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">{page.title}</h1>
          {page.updatedAt && (
            <p className="mt-4 text-primary-foreground/70 text-sm">
              Terakhir diperbarui:{" "}
              {new Date(page.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
          {page.hasPassword && (
            <button
              onClick={handleLock}
              title="Kunci akses halaman"
              className="absolute right-4 top-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 border border-white/30 rounded-lg text-xs text-white transition-all"
            >
              <LockKeyhole size={13} /> Kunci
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">

        {/* HTML Content */}
        {page.content && (
          <div
            className="prose prose-lg prose-green max-w-none
              prose-headings:font-display prose-headings:text-primary
              prose-h2:text-3xl prose-h2:border-b prose-h2:border-border prose-h2:pb-3 prose-h2:mb-6
              prose-h3:text-xl prose-h3:text-primary/80
              prose-p:text-foreground prose-p:leading-relaxed
              prose-li:text-foreground
              prose-strong:text-primary
              prose-a:text-primary prose-a:underline hover:prose-a:text-secondary"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        )}

        {/* Images */}
        {images.length > 0 && (
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-display font-bold text-primary mb-6 pb-3 border-b border-border">
              <ImageIcon size={22} /> Galeri Gambar
            </h2>
            <div className={`grid gap-4 ${images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"}`}>
              {images.map((item, i) => (
                <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="group block rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-shadow">
                  <img
                    src={toGDriveImageUrl(item.url)}
                    alt={item.label || `Gambar ${i + 1}`}
                    className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Gambar+tidak+tersedia"; }}
                  />
                  {item.label && (
                    <div className="px-3 py-2 bg-white text-sm text-muted-foreground">{item.label}</div>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-display font-bold text-primary mb-6 pb-3 border-b border-border">
              <VideoIcon size={22} /> Video
            </h2>
            <div className="space-y-6">
              {videos.map((item, i) => {
                const ytId = getYoutubeId(item.url);
                const isFile = isVideoFile(item.url);
                return (
                  <div key={i}>
                    {item.label && <p className="text-sm font-semibold text-foreground mb-2">{item.label}</p>}
                    {ytId ? (
                      <div className="relative w-full rounded-xl overflow-hidden border border-border shadow-md" style={{ paddingBottom: "56.25%" }}>
                        <iframe
                          className="absolute inset-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${ytId}`}
                          title={item.label || `Video ${i + 1}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : isFile ? (
                      <video controls className="w-full rounded-xl border border-border shadow-md">
                        <source src={item.url} />
                        Browser Anda tidak mendukung video.
                      </video>
                    ) : (
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary hover:shadow-md transition-all text-primary font-semibold">
                        <VideoIcon size={20} />
                        <span className="flex-1 truncate">{item.label || item.url}</span>
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Website Links */}
        {websites.length > 0 && (
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-display font-bold text-primary mb-6 pb-3 border-b border-border">
              <Globe size={22} /> Tautan & Referensi
            </h2>
            <div className="space-y-3">
              {websites.map((item, i) => (
                <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-white hover:border-primary hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                    <Globe size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.label && <p className="font-semibold text-foreground text-sm">{item.label}</p>}
                    <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                  </div>
                  <ExternalLink size={16} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
