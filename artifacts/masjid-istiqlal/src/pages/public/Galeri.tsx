import { useState, useEffect } from "react";
import { useGetGallery } from "@workspace/api-client-react";
import { toGDriveImageUrl } from "@/lib/gdrive";
import { Image as ImageIcon, Video, X } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function getImgSrc(url: string) {
  if (!url) return "";
  if (url.startsWith("/api/storage")) return `${BASE}${url}`;
  return toGDriveImageUrl(url);
}

function getYtId(url: string): string | null {
  const m = url?.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function isYoutubeShort(url: string) { return url?.includes("/shorts/"); }
function isLocalVideo(url: string) { return url?.startsWith("/api/storage") || url?.startsWith("blob:"); }

function getGDriveId(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("drive.google.com")) return null;
    const idParam = parsed.searchParams.get("id");
    if (idParam) return idParam;
    const match = parsed.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/* ─── Video thumbnail carousel ──────────────────────────────── */
function VideoGallery({ videos }: { videos: any[] }) {
  const [active, setActive] = useState<any | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  if (videos.length === 0) {
    return <div className="py-20 text-center text-muted-foreground">Belum ada video yang tersedia.</div>;
  }

  const activeYtId = active ? getYtId(active.imageUrl) : null;
  const activeIsShort = active ? isYoutubeShort(active.imageUrl) : false;
  const activeIsLocal = active ? isLocalVideo(active.imageUrl) : false;
  const activeGDriveId = active ? getGDriveId(active.imageUrl) : null;
  const activeIsGDrive = !!activeGDriveId;

  return (
    <>
      <div className="flex flex-wrap justify-center gap-5 max-w-[1080px] mx-auto">
        {videos.map((vid, i) => {
          const ytId = getYtId(vid.imageUrl);
          const local = isLocalVideo(vid.imageUrl);
          const gdriveId = getGDriveId(vid.imageUrl);
          const thumbUrl = ytId
            ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
            : gdriveId
              ? `https://drive.google.com/thumbnail?id=${gdriveId}&sz=w1000`
              : null;

          return (
            <button
              key={vid.id}
              onClick={() => setActive(vid)}
              className="group flex flex-col text-left cursor-pointer"
              style={{ width: "200px" }}
            >
              <div
                className="relative rounded-2xl overflow-hidden bg-gray-900 shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1"
                style={{ width: "200px", height: "320px" }}
              >
                {local ? (
                  <video src={`${BASE}${vid.imageUrl}`} className="absolute inset-0 w-full h-full object-cover" muted preload="metadata" />
                ) : thumbUrl ? (
                  <img src={thumbUrl} alt={vid.title} className="absolute inset-0 w-full h-full group-hover:scale-110 transition-transform duration-500 object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <Video size={40} className="text-white/30" />
                  </div>
                )}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 border border-white/40 flex items-center justify-center backdrop-blur-sm opacity-70 group-hover:opacity-100 group-hover:bg-white/90 group-hover:scale-110 transition-all duration-300">
                    <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[14px] border-t-transparent border-b-transparent border-l-white group-hover:border-l-primary ml-1" />
                  </div>
                </div>
                {vid.category && (
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded tracking-widest uppercase shadow">{vid.category}</span>
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

      {/* Modal */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
          onClick={() => setActive(null)}
        >
          <div
            className={`relative ${activeIsShort || activeIsLocal ? "w-full max-w-xs" : "w-full max-w-3xl"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActive(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white flex items-center gap-1 text-sm transition-colors"
            >
              <X size={20} /> Tutup
            </button>
            {active.title && (
              <p className="text-white font-semibold mb-3 text-lg line-clamp-1">{active.title}</p>
            )}
            <div
              className="relative w-full rounded-2xl overflow-hidden bg-black shadow-2xl"
              style={{ paddingBottom: activeIsShort || activeIsLocal ? "177.78%" : "56.25%" }}
            >
              {activeIsLocal ? (
                <video className="absolute inset-0 w-full h-full" src={getImgSrc(active.imageUrl)} controls autoPlay />
              ) : activeYtId ? (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${activeYtId}?autoplay=1&rel=0`}
                  title={active.title || "Video"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : activeIsGDrive ? (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://drive.google.com/file/d/${activeGDriveId}/preview`}
                  title={active.title || "Video Google Drive"}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900 text-white">
                  <p className="text-sm text-white/60">Tidak dapat memuat video</p>
                  <a href={active.imageUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline text-white/80 hover:text-white">Buka di tab baru</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export function Galeri() {
  const { data: gallery, isLoading } = useGetGallery();
  const [tab, setTab] = useState<"foto" | "video">("foto");
  const [activePhoto, setActivePhoto] = useState<any | null>(null);

  useEffect(() => {
    if (!activePhoto) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActivePhoto(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activePhoto]);

  if (isLoading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  const photos = gallery?.filter(i => i.isActive && (i as any).type !== "video") ?? [];
  const videos = gallery?.filter(i => i.isActive && (i as any).type === "video") ?? [];

  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="bg-primary pt-20 pb-12 px-4 mb-12">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">Galeri</h1>
          <p className="text-primary-foreground/80 text-lg">Dokumentasi keindahan dan kegiatan Musholla Nurul Iman</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tab switcher */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mx-auto mb-10">
          <button
            onClick={() => setTab("foto")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === "foto" ? "bg-white shadow text-primary" : "text-gray-500 hover:text-gray-700"}`}
          >
            <ImageIcon size={16} /> Foto <span className="ml-1 text-xs opacity-60">({photos.length})</span>
          </button>
          <button
            onClick={() => setTab("video")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === "video" ? "bg-white shadow text-red-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Video size={16} /> Video <span className="ml-1 text-xs opacity-60">({videos.length})</span>
          </button>
        </div>

        {/* Foto tab */}
        {tab === "foto" && (
          <>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
              {photos.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePhoto(item)}
                  className="break-inside-avoid relative group rounded-2xl overflow-hidden shadow-md cursor-zoom-in text-left block w-full"
                  aria-label={`Perbesar foto ${item.title}`}
                >
                  <img
                    src={getImgSrc(item.imageUrl) || `https://images.unsplash.com/photo-${1584551246679 + index}-0?w=600&q=80`}
                    alt={item.title}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <span className="text-secondary text-xs font-bold uppercase tracking-wider mb-1">{item.category}</span>
                    <h3 className="text-white font-bold text-lg leading-tight">{item.title}</h3>
                  </div>
                </button>
              ))}
            </div>
            {photos.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">Belum ada foto yang tersedia.</div>
            )}

            {/* Photo lightbox */}
            {activePhoto && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
                style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
                onClick={() => setActivePhoto(null)}
              >
                <div
                  className="relative flex items-center justify-center w-full min-w-0 min-h-[50vh] max-w-[92vw] max-h-[88vh] rounded-2xl overflow-hidden bg-black/30 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={getImgSrc(activePhoto.imageUrl)}
                    alt={activePhoto.title}
                    className="max-w-full max-h-[88vh] w-auto h-auto object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setActivePhoto(null)}
                    className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-3 py-2 text-sm text-white/90 hover:bg-black/80 hover:text-white transition-colors"
                  >
                    <X size={18} /> Tutup
                  </button>
                  {(activePhoto.title || activePhoto.category) && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-5 pt-10 pb-4 text-white">
                      {activePhoto.category && <p className="text-secondary text-xs font-bold uppercase tracking-wider">{activePhoto.category}</p>}
                      {activePhoto.title && <p className="font-semibold">{activePhoto.title}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Video tab */}
        {tab === "video" && <VideoGallery videos={videos} />}
      </div>
    </div>
  );
}
