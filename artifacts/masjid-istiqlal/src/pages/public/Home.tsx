import { useState, useEffect } from "react";
import { useGetSettings, useGetNews, useGetEvents } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { PrayerTimesWidget } from "@/components/PrayerTimesWidget";
import { Link } from "wouter";
import {
  ArrowRight, Calendar, MapPin, Users, BookOpen, LayoutGrid,
  Heart, Star, Home as HomeIcon, Phone, Mail, Globe, Shield,
  Gift, Award, Lightbulb, Mic, Music, Camera, Video, Bookmark,
  Building, Clock, Info, HelpCircle, ChevronRight, X, ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { toGDriveImageUrl } from "@/lib/gdrive";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  BookOpen, Users, MapPin, Heart, Star, Home: HomeIcon,
  Phone, Mail, Globe, Shield, Gift, Award,
  Lightbulb, Mic, Music, Camera, Video, Bookmark,
  Building, Clock, Calendar, ChevronRight, Info, HelpCircle, LayoutGrid,
};

type Layanan = {
  id: number; title: string; description: string; icon: string;
  linkUrl: string | null; isActive: boolean; order: number;
  popupEnabled: boolean;
  popupTitle: string | null; popupSubtitle: string | null;
  popupImageUrl: string | null; popupInstructions: string | null;
  popupHighlightTitle: string | null; popupHighlightContent: string | null;
};

type GalleryItem = {
  id: number; title: string; imageUrl: string; category: string | null; isActive: boolean;
};

type SectionConfig = {
  count?: number;
  youtubeUrl?: string;
  buttonLabel?: string;
  items?: Array<{ label: string; url: string }>;
};

type HomepageSection = {
  id: number;
  type: string;
  title: string;
  subtitle: string | null;
  isVisible: boolean;
  order: number;
  config: string;
};

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function getMediaSrc(url: string) {
  if (!url) return "";
  if (url.startsWith("/api/storage")) return `${BASE}${url}`;
  return toGDriveImageUrl(url);
}

function parseConfig(raw: string): SectionConfig {
  try { return JSON.parse(raw); } catch { return {}; }
}

function getYoutubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  if (url.includes("youtube.com/embed/")) return url;
  return null;
}

function LayananPopup({ item, onClose }: { item: Layanan; onClose: () => void }) {
  const IconComp = ICON_MAP[item.icon] ?? BookOpen;
  const instructions = item.popupInstructions
    ? item.popupInstructions.split("\n").map(l => l.trim()).filter(Boolean)
    : [];
  const highlightLines = item.popupHighlightContent
    ? item.popupHighlightContent.split("\n").map(l => l.trim())
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <IconComp size={24} />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">
                {item.popupTitle || item.title}
              </h2>
              {item.popupSubtitle && (
                <p className="text-sm text-muted-foreground">{item.popupSubtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          <div className={`gap-6 ${item.popupImageUrl && (instructions.length > 0 || highlightLines.length > 0) ? 'grid grid-cols-1 md:grid-cols-2' : 'flex flex-col items-center'}`}>
            {item.popupImageUrl && (
              <div className="flex justify-center">
                <img src={toGDriveImageUrl(item.popupImageUrl!)} alt="QR / Gambar" className="rounded-2xl border border-border max-h-80 object-contain shadow-md" />
              </div>
            )}
            {(instructions.length > 0 || highlightLines.length > 0) && (
              <div className="space-y-5">
                {instructions.length > 0 && (
                  <div className="bg-gray-50 rounded-2xl p-5 border border-border">
                    <h3 className="font-bold text-primary flex items-center gap-2 mb-3">
                      <span className="text-lg">≔</span> Panduan Pembayaran
                    </h3>
                    <ol className="space-y-2">
                      {instructions.map((line, i) => (
                        <li key={i} className="flex gap-3 text-sm text-foreground">
                          <span className="shrink-0 font-bold text-primary">{i + 1}.</span>
                          <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {highlightLines.length > 0 && (
                  <div className="bg-primary text-primary-foreground rounded-2xl p-5">
                    {item.popupHighlightTitle && (
                      <h3 className="font-bold text-secondary flex items-center gap-2 mb-3">
                        🕌 {item.popupHighlightTitle}
                      </h3>
                    )}
                    <div className="space-y-2">
                      {highlightLines.map((line, i) => {
                        if (!line) return <div key={i} className="h-1" />;
                        const isArabic = /[\u0600-\u06FF]/.test(line);
                        const isItalic = line.startsWith('"') && line.endsWith('"');
                        return (
                          <p key={i} className={`${isArabic ? 'text-right text-2xl font-bold leading-relaxed text-secondary' : ''} ${isItalic ? 'italic text-sm text-primary-foreground/80' : ''} ${!isArabic && !isItalic ? 'text-sm text-primary-foreground/90 text-center' : ''}`}>
                            {line}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            {!item.popupImageUrl && instructions.length === 0 && highlightLines.length === 0 && (
              <p className="text-muted-foreground text-center">{item.description}</p>
            )}
          </div>
        </div>
        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full transition-colors">
            TUTUP
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Section renderers ───────── */

function NewsSection({ section, news }: { section: HomepageSection; news: any[] }) {
  const cfg = parseConfig(section.config);
  const count = cfg.count ?? 3;
  const items = news.slice(0, count);
  const buttonLabel = cfg.buttonLabel || "Lihat Semua";

  return (
    <section className="py-20 bg-primary/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="font-display text-4xl font-bold text-primary mb-4">{section.title}</h2>
            {section.subtitle && <p className="text-muted-foreground max-w-2xl">{section.subtitle}</p>}
          </div>
          <Link href="/berita" className="hidden md:flex items-center gap-2 font-semibold text-primary hover:text-secondary transition-colors">
            {buttonLabel} <ArrowRight size={20} />
          </Link>
        </div>
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Belum ada berita yang diterbitkan.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {items.map(item => (
              <Link key={item.id} href={`/berita/${item.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border">
                <div className="h-48 overflow-hidden bg-gray-200">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-primary/5">
                      <BookOpen size={40} className="text-primary/20" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="text-sm text-secondary font-bold mb-2">
                    {format(new Date(item.createdAt), 'dd MMM yyyy')}
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground line-clamp-3 text-sm">{item.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
        <div className="md:hidden text-center mt-8">
          <Link href="/berita" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-colors">
            {buttonLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

function EventsSection({ section, events }: { section: HomepageSection; events: any[] }) {
  const cfg = parseConfig(section.config);
  const count = cfg.count ?? 3;
  const items = events.filter(e => e.isActive).slice(0, count);
  const buttonLabel = cfg.buttonLabel || "Semua Kegiatan";

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-4xl font-bold text-primary mb-4 text-center">{section.title}</h2>
        {section.subtitle && <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">{section.subtitle}</p>}
        {!section.subtitle && <div className="mb-12" />}
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Belum ada kegiatan yang dijadwalkan.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(event => (
              <div key={event.id} className="flex gap-6 p-6 rounded-2xl border border-border hover:shadow-lg transition-all bg-background">
                <div className="flex flex-col items-center justify-center w-20 h-20 rounded-xl bg-primary text-primary-foreground shrink-0">
                  <span className="text-2xl font-bold">{format(new Date(event.startDate), 'dd')}</span>
                  <span className="text-xs uppercase font-medium">{format(new Date(event.startDate), 'MMM')}</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2">{event.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar size={14} />
                    <span>{format(new Date(event.startDate), 'HH:mm')} WIB</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={14} />
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="text-center mt-10">
          <Link href="/kegiatan" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-colors">
            {buttonLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

function VideoSection({ section }: { section: HomepageSection }) {
  const cfg = parseConfig(section.config);
  const embedUrl = getYoutubeEmbedUrl(cfg.youtubeUrl ?? "");
  const buttonLabel = cfg.buttonLabel || "Tonton Semua Video";

  return (
    <section className="py-20 bg-primary/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-4xl font-bold text-primary mb-4 text-center">{section.title}</h2>
        {section.subtitle && <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">{section.subtitle}</p>}
        {!section.subtitle && <div className="mb-10" />}
        {embedUrl ? (
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-border aspect-video">
            <iframe
              src={embedUrl}
              title={section.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ) : cfg.youtubeUrl ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-border">
            <Video size={48} className="text-primary/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Klik tombol di bawah untuk menonton video</p>
            <a href={cfg.youtubeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-colors">
              <Video size={18} /> Buka di YouTube
            </a>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-border text-muted-foreground">
            URL video belum dikonfigurasi.
          </div>
        )}
        {cfg.youtubeUrl && (
          <div className="text-center mt-8">
            <a
              href={cfg.youtubeUrl.replace("embed/", "watch?v=")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-colors"
            >
              {buttonLabel} <ExternalLink size={16} />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function GallerySection({ section, gallery }: { section: HomepageSection; gallery: GalleryItem[] }) {
  const cfg = parseConfig(section.config);
  const count = cfg.count ?? 6;
  const items = gallery.filter(g => g.isActive).slice(0, count);
  const buttonLabel = cfg.buttonLabel || "Lihat Galeri";

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-4xl font-bold text-primary mb-4 text-center">{section.title}</h2>
        {section.subtitle && <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">{section.subtitle}</p>}
        {!section.subtitle && <div className="mb-12" />}
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Belum ada foto di galeri.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map(item => (
              <div key={item.id} className="group relative overflow-hidden rounded-2xl aspect-square bg-gray-100">
                <img
                  src={getMediaSrc(item.imageUrl)}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <p className="text-white font-semibold text-sm">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="text-center mt-10">
          <Link href="/galeri" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-colors">
            {buttonLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

function LinksSection({ section }: { section: HomepageSection }) {
  const cfg = parseConfig(section.config);
  const items = cfg.items ?? [];

  return (
    <section className="py-20 bg-primary/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-4xl font-bold text-primary mb-4 text-center">{section.title}</h2>
        {section.subtitle && <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">{section.subtitle}</p>}
        {!section.subtitle && <div className="mb-12" />}
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Belum ada tautan yang dikonfigurasi.</p>
        ) : (
          <div className={`grid gap-4 ${items.length <= 2 ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto' : 'grid-cols-2 md:grid-cols-3'}`}>
            {items.map((item, i) => {
              const isExternal = item.url.startsWith("http");
              const Tag = isExternal ? "a" : Link;
              const props = isExternal
                ? { href: item.url, target: "_blank", rel: "noopener noreferrer" }
                : { href: item.url };
              return (
                <Tag
                  key={i}
                  {...(props as any)}
                  className="flex items-center justify-between gap-3 px-6 py-5 bg-white rounded-2xl border border-border hover:border-primary hover:shadow-lg transition-all group"
                >
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{item.label}</span>
                  {isExternal ? <ExternalLink size={18} className="text-muted-foreground group-hover:text-primary shrink-0" /> : <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary shrink-0" />}
                </Tag>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

type CardItem = { title: string; description: string; icon: string; linkUrl: string; linkLabel: string };
type VideoItem = { youtubeUrl: string; title: string; category: string };
type SectionCfg = { displayStyle?: "cards" | "video-carousel"; items?: CardItem[]; videos?: VideoItem[] };

function getYtId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function isYoutubeShort(url: string): boolean {
  return url.includes("/shorts/");
}

function isLocalStorage(url: string): boolean {
  return url.startsWith("/api/storage") || url.startsWith("blob:");
}

function getGDriveId(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("drive.google.com")) return null;
    const idParam = parsed.searchParams.get("id");
    if (idParam) return idParam;
    const m = parsed.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function VideoCarouselSection({ section, cfg }: { section: HomepageSection; cfg: SectionCfg }) {
  const videos = cfg.videos ?? [];
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  useEffect(() => {
    if (!activeVideo) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActiveVideo(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeVideo]);

  const activeYtId = activeVideo ? getYtId(activeVideo.youtubeUrl) : null;
  const activeIsShort = activeVideo ? isYoutubeShort(activeVideo.youtubeUrl) : false;
  const activeIsLocal = activeVideo ? isLocalStorage(activeVideo.youtubeUrl) : false;
  const activeGDriveId = activeVideo ? getGDriveId(activeVideo.youtubeUrl) : null;
  const activeIsGDrive = !!activeGDriveId;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="font-display text-4xl font-bold text-primary mb-2">{section.title}</h2>
          {section.subtitle && <p className="text-muted-foreground text-sm">{section.subtitle}</p>}
        </div>

        {videos.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Belum ada video yang ditambahkan.</p>
        ) : (
          /* max 5 per row, wrap to next row if more, centered */
          <div className="flex flex-wrap justify-center gap-5 max-w-[1080px] mx-auto">
            {videos.map((vid, i) => {
              const ytId = getYtId(vid.youtubeUrl);
              const isShort = isYoutubeShort(vid.youtubeUrl);
              const isLocal = isLocalStorage(vid.youtubeUrl);
              const thumbUrl = ytId
                ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                : null;
              const cardH = 320;

              return (
                <button
                  key={i}
                  onClick={() => setActiveVideo(vid)}
                  className="group flex flex-col text-left cursor-pointer"
                  style={{ width: "200px" }}
                >
                  <div
                    className="relative rounded-2xl overflow-hidden bg-gray-900 shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1"
                    style={{ width: "200px", height: `${cardH}px` }}
                  >
                    {isLocal ? (
                      <video
                        src={getMediaSrc(vid.youtubeUrl)}
                        className="absolute inset-0 w-full h-full object-cover"
                        muted
                        preload="metadata"
                      />
                    ) : thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={vid.title}
                        className="absolute inset-0 w-full h-full group-hover:scale-110 transition-transform duration-500"
                        style={{ objectFit: "cover", objectPosition: "center center" }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <Video size={40} className="text-white/30" />
                      </div>
                    )}

                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.05) 70%, transparent 100%)" }}
                    />

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 border border-white/40 flex items-center justify-center backdrop-blur-sm opacity-70 group-hover:opacity-100 group-hover:bg-white/90 group-hover:scale-110 transition-all duration-300">
                        <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[14px] border-t-transparent border-b-transparent border-l-white group-hover:border-l-primary ml-1" />
                      </div>
                    </div>

                    {vid.category && (
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded tracking-widest uppercase shadow">
                          {vid.category}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="mt-2.5 text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                    {vid.title || "Video"}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Video Modal — Google Drive and regular videos use landscape; shorts/local use portrait */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
          onClick={() => setActiveVideo(null)}
        >
          <div
            className={`relative ${activeIsShort || activeIsLocal ? "w-full max-w-xs" : "w-full max-w-3xl"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white flex items-center gap-1 text-sm transition-colors"
            >
              <X size={20} /> Tutup
            </button>

            {activeVideo.title && (
              <p className="text-white font-semibold mb-3 text-lg line-clamp-1">{activeVideo.title}</p>
            )}

            {/* Player — portrait 9:16 for shorts/local, landscape 16:9 for YouTube/Drive */}
            <div
              className="relative w-full rounded-2xl overflow-hidden bg-black shadow-2xl"
              style={{ paddingBottom: activeIsShort || activeIsLocal ? "177.78%" : "56.25%" }}
            >
              {activeIsLocal ? (
                <video
                  className="absolute inset-0 w-full h-full"
                  src={getMediaSrc(activeVideo.youtubeUrl)}
                  controls
                  autoPlay
                />
              ) : activeYtId ? (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${activeYtId}?autoplay=1&rel=0`}
                  title={activeVideo.title || "Video"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : activeIsGDrive ? (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://drive.google.com/file/d/${activeGDriveId}/preview`}
                  title={activeVideo.title || "Video Google Drive"}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900 text-white">
                  <p className="text-sm text-white/60">Tidak dapat memuat video</p>
                  <a
                    href={activeVideo.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm font-semibold text-secondary hover:underline"
                  >
                    Buka sumber video <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>

            {!activeIsLocal && (
              <a
                href={activeVideo.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-1 text-white/60 hover:text-white text-xs transition-colors w-fit"
              >
                <ExternalLink size={12} /> Buka sumber video
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function CustomSection({ section }: { section: HomepageSection }) {
  const cfg = parseConfig(section.config) as SectionCfg;

  if (cfg.displayStyle === "video-carousel") {
    return <VideoCarouselSection section={section} cfg={cfg} />;
  }

  const items = cfg.items ?? [];
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-display text-4xl font-bold text-primary mb-4">{section.title}</h2>
          {section.subtitle && <p className="text-muted-foreground max-w-2xl mx-auto">{section.subtitle}</p>}
        </div>
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Belum ada konten.</p>
        ) : (
          <div className={`grid grid-cols-1 gap-8 ${items.length === 1 ? '' : items.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
            {items.map((item, i) => {
              const IconComp = ICON_MAP[item.icon] ?? BookOpen;
              const isExternal = item.linkUrl?.startsWith("http");
              const hasLink = !!item.linkUrl;
              return (
                <div key={i} className="p-8 rounded-2xl border border-border transition-all duration-300 group bg-background hover:border-secondary hover:shadow-xl hover:-translate-y-1">
                  <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:bg-secondary group-hover:text-primary transition-colors">
                    <IconComp size={28} />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-foreground mb-3">{item.title}</h3>
                  {item.description && <p className="text-muted-foreground">{item.description}</p>}
                  {hasLink && (
                    isExternal ? (
                      <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary group-hover:text-secondary transition-colors">
                        {item.linkLabel || "Selengkapnya"} <ChevronRight size={16} />
                      </a>
                    ) : (
                      <Link href={item.linkUrl} className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary group-hover:text-secondary transition-colors">
                        {item.linkLabel || "Selengkapnya"} <ChevronRight size={16} />
                      </Link>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/* ───────── Main Home component ───────── */
export function Home() {
  const { data: settings } = useGetSettings();
  const { data: news } = useGetNews({ published: true });
  const { data: events } = useGetEvents();
  const [activePopup, setActivePopup] = useState<Layanan | null>(null);

  const { data: layananData } = useQuery<Layanan[]>({
    queryKey: ["/api/layanan"],
    queryFn: () => fetch(`${BASE}/api/layanan`).then(r => {
      if (!r.ok) throw new Error("Failed to fetch layanan");
      return r.json();
    }),
  });

  const { data: galleryData } = useQuery<GalleryItem[]>({
    queryKey: ["/api/gallery"],
    queryFn: () => fetch(`${BASE}/api/gallery`).then(r => {
      if (!r.ok) throw new Error("Failed to fetch gallery");
      return r.json();
    }),
  });

  const { data: sectionsData } = useQuery<HomepageSection[]>({
    queryKey: ["/api/homepage-sections"],
    queryFn: () => fetch(`${BASE}/api/homepage-sections`).then(r => {
      if (!r.ok) throw new Error("Failed to fetch homepage sections");
      return r.json();
    }),
  });

  const activeLayanan = Array.isArray(layananData)
    ? layananData.filter(l => l.isActive).sort((a, b) => a.order - b.order)
    : [];

  const allNews = news ?? [];
  const allEvents = events ?? [];
  const allGallery = galleryData ?? [];
  const sections = (sectionsData ?? []).filter(s => s.isVisible).sort((a, b) => a.order - b.order);

  const handleLayananClick = (item: Layanan) => {
    if (item.popupEnabled) {
      setActivePopup(item);
    } else if (item.linkUrl) {
      window.location.href = item.linkUrl;
    }
  };

  return (
    <div className="w-full">
      {activePopup && (
        <LayananPopup item={activePopup} onClose={() => setActivePopup(null)} />
      )}

      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-primary/40 z-10" />
        <img
          src={(settings as any)?.heroImageUrl || `${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover scale-105 animate-[pulse_20s_ease-in-out_infinite_alternate]"
        />
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white drop-shadow-lg">
            {settings?.heroTitle || "Selamat Datang di Musholla Nurul Iman"}
          </h1>
          <p className="text-lg md:text-2xl text-white/90 font-medium drop-shadow-md">
            {settings?.heroSubtitle || "Simbol Kemerdekaan, Toleransi, dan Peradaban Islam"}
          </p>
          <div className="pt-8">
            <Link href="/profil" className="px-8 py-4 bg-secondary text-primary font-bold rounded-full hover:bg-white transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 inline-block">
              Jelajahi Profil
            </Link>
          </div>
        </div>
      </section>

      {/* Prayer Times */}
      {(settings as any)?.showPrayerTimes !== "false" && (
        <section className="relative z-30 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 mb-16">
          <PrayerTimesWidget />
        </section>
      )}

      {/* Layanan Section */}
      {activeLayanan.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`grid grid-cols-1 gap-8 ${activeLayanan.length === 2 ? 'md:grid-cols-2' : activeLayanan.length >= 3 ? 'md:grid-cols-3' : ''}`}>
              {activeLayanan.map(item => {
                const IconComp = ICON_MAP[item.icon] ?? BookOpen;
                const isClickable = item.popupEnabled || !!item.linkUrl;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleLayananClick(item)}
                    className={`p-8 rounded-2xl border border-border transition-all duration-300 group bg-background ${isClickable ? 'cursor-pointer hover:border-secondary hover:shadow-xl hover:-translate-y-1' : ''}`}
                  >
                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:bg-secondary group-hover:text-primary transition-colors">
                      <IconComp size={28} />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-foreground mb-3">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                    {isClickable && (
                      <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary group-hover:text-secondary transition-colors">
                        Selengkapnya <ChevronRight size={16} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Dynamic sections */}
      {sections.map(section => {
        if (section.type === "news") return <NewsSection key={section.id} section={section} news={allNews} />;
        if (section.type === "events") return <EventsSection key={section.id} section={section} events={allEvents} />;
        if (section.type === "video") return <VideoSection key={section.id} section={section} />;
        if (section.type === "gallery") return <GallerySection key={section.id} section={section} gallery={allGallery} />;
        if (section.type === "links") return <LinksSection key={section.id} section={section} />;
        if (section.type === "custom") return <CustomSection key={section.id} section={section} />;
        return null;
      })}
    </div>
  );
}
