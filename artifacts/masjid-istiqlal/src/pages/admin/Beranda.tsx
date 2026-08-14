import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { MediaUploadInput } from "@/components/MediaUploadInput";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, X,
  Newspaper, Calendar, BookOpen, Users, MapPin, Heart, Star,
  Phone, Mail, Globe, Shield, Gift, Award, Lightbulb, Mic,
  Music, Camera, Video, Bookmark, Building, Clock, Info,
  HelpCircle, LayoutGrid, ExternalLink, ChevronRight,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  BookOpen, Users, MapPin, Heart, Star,
  Phone, Mail, Globe, Shield, Gift, Award,
  Lightbulb, Mic, Music, Camera, Video, Bookmark,
  Building, Clock, Calendar, Info, HelpCircle, LayoutGrid,
  Newspaper, ExternalLink,
};
const ICON_LIST = Object.keys(ICONS);

type DisplayStyle = "cards" | "video-carousel";

type CardItem = {
  title: string;
  description: string;
  icon: string;
  linkUrl: string;
  linkLabel: string;
};

type VideoItem = {
  youtubeUrl: string;
  title: string;
  category: string;
};

type SectionConfig = {
  displayStyle?: DisplayStyle;
  items?: CardItem[];
  videos?: VideoItem[];
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

function parseCfg(raw: string): SectionConfig {
  try { return JSON.parse(raw); } catch { return {}; }
}

function IconPreview({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) {
  const Comp = ICONS[name] ?? BookOpen;
  return <Comp size={size} className={className} />;
}

const emptyCard = (): CardItem => ({ title: "", description: "", icon: "BookOpen", linkUrl: "", linkLabel: "Selengkapnya" });
const emptyVideo = (): VideoItem => ({ youtubeUrl: "", title: "", category: "" });

function getYtId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function AdminBeranda() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings } = useGetSettings();
  const updateSettings = useUpdateSettings({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/settings"] }),
    },
  });

  const showPrayerTimes = (settings as any)?.showPrayerTimes !== "false";

  function togglePrayerTimes() {
    const next = !showPrayerTimes;
    updateSettings.mutate({ data: { showPrayerTimes: next ? "true" : "false" } as any });
    toast({ title: next ? "Widget waktu sholat ditampilkan" : "Widget waktu sholat disembunyikan" });
  }

  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [displayStyle, setDisplayStyle] = useState<DisplayStyle>("cards");
  const [cards, setCards] = useState<CardItem[]>([emptyCard()]);
  const [videos, setVideos] = useState<VideoItem[]>([emptyVideo()]);
  const [iconPickerIdx, setIconPickerIdx] = useState<number | null>(null);

  async function fetchSections() {
    setIsLoading(true);
    try {
      const r = await fetch(`${BASE}/api/homepage-sections`);
      setSections(await r.json());
    } catch {
      toast({ title: "Gagal memuat data", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { fetchSections(); }, []);

  function openAdd() {
    setEditingSection(null);
    setTitle(""); setSubtitle(""); setIsVisible(true);
    setDisplayStyle("cards");
    setCards([emptyCard()]); setVideos([emptyVideo()]);
    setIconPickerIdx(null);
    setModalOpen(true);
  }

  function openEdit(s: HomepageSection) {
    setEditingSection(s);
    setTitle(s.title); setSubtitle(s.subtitle ?? ""); setIsVisible(s.isVisible);
    const cfg = parseCfg(s.config);
    const style = cfg.displayStyle ?? "cards";
    setDisplayStyle(style);
    setCards(cfg.items?.length ? cfg.items : [emptyCard()]);
    setVideos(cfg.videos?.length ? cfg.videos : [emptyVideo()]);
    setIconPickerIdx(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let config: SectionConfig = { displayStyle };
    if (displayStyle === "cards") {
      const validCards = cards.filter(c => c.title);
      if (!validCards.length) { toast({ title: "Tambahkan minimal satu kartu dengan judul", variant: "destructive" }); return; }
      config.items = validCards;
    } else {
      const validVideos = videos.filter(v => v.youtubeUrl);
      if (!validVideos.length) { toast({ title: "Tambahkan minimal satu URL video", variant: "destructive" }); return; }
      config.videos = validVideos;
    }
    const payload = {
      type: "custom",
      title, subtitle: subtitle || null, isVisible,
      order: editingSection?.order ?? (sections.length > 0 ? Math.max(...sections.map(s => s.order)) + 1 : 10),
      config: JSON.stringify(config),
    };
    try {
      if (editingSection) {
        await fetch(`${BASE}/api/homepage-sections/${editingSection.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        toast({ title: "Seksi berhasil diperbarui" });
      } else {
        await fetch(`${BASE}/api/homepage-sections`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        toast({ title: "Seksi baru berhasil ditambahkan" });
      }
      setModalOpen(false); fetchSections();
    } catch { toast({ title: "Gagal menyimpan", variant: "destructive" }); }
  }

  async function toggleVisibility(s: HomepageSection) {
    await fetch(`${BASE}/api/homepage-sections/${s.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...s, isVisible: !s.isVisible }) });
    fetchSections();
    toast({ title: !s.isVisible ? "Ditampilkan" : "Disembunyikan" });
  }

  async function deleteSection(id: number) {
    if (!confirm("Hapus seksi beranda ini?")) return;
    await fetch(`${BASE}/api/homepage-sections/${id}`, { method: "DELETE" });
    toast({ title: "Seksi dihapus" }); fetchSections();
  }

  async function moveSection(globalIdx: number, dir: "up" | "down") {
    const sorted = [...sections];
    const target = dir === "up" ? globalIdx - 1 : globalIdx + 1;
    if (target < 0 || target >= sorted.length) return;
    [sorted[globalIdx], sorted[target]] = [sorted[target], sorted[globalIdx]];
    await fetch(`${BASE}/api/homepage-sections-reorder`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sections: sorted.map((s, i) => ({ id: s.id, order: i + 1 })) }) });
    fetchSections();
  }

  const updateCard = (idx: number, field: keyof CardItem, val: string) =>
    setCards(c => c.map((card, i) => i === idx ? { ...card, [field]: val } : card));
  const updateVideo = (idx: number, field: keyof VideoItem, val: string) =>
    setVideos(v => v.map((vid, i) => i === idx ? { ...vid, [field]: val } : vid));

  const autoSections = sections.filter(s => s.type === "news" || s.type === "events");
  const customSections = sections.filter(s => s.type === "custom");

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Beranda</h1>
          <p className="text-sm text-gray-500 mt-1">Atur konten seksi yang tampil di halaman utama website</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
          <Plus size={18} /> Tambah Seksi Baru
        </button>
      </div>

      {/* Prayer Times Widget Toggle */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Widget Beranda</h2>
        <div className={`bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 ${!showPrayerTimes ? "opacity-60" : ""}`}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-600">
            <Clock size={18} />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-800">Waktu Sholat</p>
            <p className="text-xs text-gray-400">Widget jadwal sholat dan hitung mundur di bagian atas beranda</p>
          </div>
          <button
            onClick={togglePrayerTimes}
            className={`p-1.5 rounded-lg transition-colors ${showPrayerTimes ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-50"}`}
            title={showPrayerTimes ? "Sembunyikan" : "Tampilkan"}
          >
            {showPrayerTimes ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
      </div>

      {/* Auto sections */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Seksi Otomatis</h2>
        <div className="space-y-2">
          {autoSections.map(s => (
            <div key={s.id} className={`bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 ${!s.isVisible ? "opacity-60" : ""}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.type === "news" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>
                {s.type === "news" ? <Newspaper size={18} /> : <Calendar size={18} />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{s.title}</p>
                <p className="text-xs text-gray-400">Diisi otomatis dari manajemen {s.type === "news" ? "berita" : "kegiatan"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={s.type === "news" ? "/admin/berita" : "/admin/kegiatan"} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">Kelola <ChevronRight size={12} /></Link>
                <button onClick={() => toggleVisibility(s)} className={`p-1.5 rounded-lg ${s.isVisible ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-50"}`}>
                  {s.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom sections */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Seksi Kustom</h2>
        {isLoading ? (
          <p className="text-gray-400 text-sm py-8 text-center">Memuat...</p>
        ) : customSections.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl py-12 text-center text-gray-400">
            <LayoutGrid size={36} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">Belum ada seksi kustom</p>
            <p className="text-sm mt-1">Klik "Tambah Seksi Baru" untuk memulai</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customSections.map((s) => {
              const globalIdx = sections.indexOf(s);
              const cfg = parseCfg(s.config);
              const style = cfg.displayStyle ?? "cards";
              const count = style === "video-carousel" ? (cfg.videos?.length ?? 0) : (cfg.items?.length ?? 0);
              return (
                <div key={s.id} className={`bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm ${!s.isVisible ? "opacity-50" : ""}`}>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => moveSection(globalIdx, "up")} disabled={globalIdx === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-20"><ChevronUp size={14} /></button>
                    <button onClick={() => moveSection(globalIdx, "down")} disabled={globalIdx === sections.length - 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-20"><ChevronDown size={14} /></button>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style === "video-carousel" ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"}`}>
                    {style === "video-carousel" ? <Video size={20} /> : <LayoutGrid size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{s.title}</p>
                    <p className="text-sm text-gray-400">
                      {style === "video-carousel" ? "Carousel Video" : "Grid Kartu"} · {count} item{!s.isVisible ? " · Tersembunyi" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleVisibility(s)} className={`p-2 rounded-lg ${s.isVisible ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-50"}`}>
                      {s.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button onClick={() => openEdit(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                    <button onClick={() => deleteSection(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mb-10">
            <div className="flex items-center justify-between px-6 py-5 border-b sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-xl font-bold">{editingSection ? "Edit Seksi" : "Tambah Seksi Baru"}</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-5">
                {/* Basic info */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Judul Seksi <span className="text-red-500">*</span></label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="contoh: Video Terkini, Layanan Unggulan..." className="w-full border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Deskripsi <span className="text-gray-400 font-normal">(opsional)</span></label>
                  <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Teks penjelasan singkat di bawah judul..." className="w-full border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>

                {/* Display style */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Tampilan Seksi</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setDisplayStyle("cards")}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${displayStyle === "cards" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${displayStyle === "cards" ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>
                        <LayoutGrid size={16} />
                      </div>
                      <div className="text-left">
                        <p className={`font-semibold text-sm ${displayStyle === "cards" ? "text-primary" : "text-gray-700"}`}>Grid Kartu</p>
                        <p className="text-xs text-gray-400">Kartu dengan ikon & link</p>
                      </div>
                    </button>
                    <button type="button" onClick={() => setDisplayStyle("video-carousel")}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${displayStyle === "video-carousel" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${displayStyle === "video-carousel" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                        <Video size={16} />
                      </div>
                      <div className="text-left">
                        <p className={`font-semibold text-sm ${displayStyle === "video-carousel" ? "text-red-600" : "text-gray-700"}`}>Carousel Video</p>
                        <p className="text-xs text-gray-400">Thumbnail video YouTube</p>
                      </div>
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={isVisible} onChange={e => setIsVisible(e.target.checked)} className="w-4 h-4 rounded text-primary" />
                  <span className="text-sm font-medium">Tampilkan di beranda</span>
                </label>

                {/* Cards editor */}
                {displayStyle === "cards" && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold">Daftar Kartu <span className="text-red-500">*</span></label>
                      <button type="button" onClick={() => setCards(c => [...c, emptyCard()])} className="flex items-center gap-1 text-sm text-primary font-semibold hover:underline">
                        <Plus size={14} /> Tambah Kartu
                      </button>
                    </div>
                    <div className="space-y-4">
                      {cards.map((card, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kartu {idx + 1}</span>
                            {cards.length > 1 && <button type="button" onClick={() => setCards(c => c.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 p-1 rounded"><X size={14} /></button>}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ikon</label>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => setIconPickerIdx(iconPickerIdx === idx ? null : idx)} className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:border-primary transition-colors text-sm">
                                <IconPreview name={card.icon} size={16} className="text-primary" />
                                <span className="text-gray-600">{card.icon}</span>
                              </button>
                            </div>
                            {iconPickerIdx === idx && (
                              <div className="mt-2 p-3 bg-white border rounded-xl grid grid-cols-8 gap-1.5 shadow-lg">
                                {ICON_LIST.map(name => (
                                  <button key={name} type="button" title={name} onClick={() => { updateCard(idx, "icon", name); setIconPickerIdx(null); }}
                                    className={`p-2 rounded-lg hover:bg-primary/10 flex items-center justify-center ${card.icon === name ? "bg-primary/15 text-primary" : "text-gray-500"}`}>
                                    <IconPreview name={name} size={16} />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Judul Kartu <span className="text-red-500">*</span></label>
                              <input type="text" value={card.title} onChange={e => updateCard(idx, "title", e.target.value)} placeholder="contoh: Pendaftaran Nikah" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Deskripsi</label>
                              <textarea value={card.description} onChange={e => updateCard(idx, "description", e.target.value)} rows={2} placeholder="Penjelasan singkat..." className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Link / URL</label>
                                <input type="text" value={card.linkUrl} onChange={e => updateCard(idx, "linkUrl", e.target.value)} placeholder="/halaman atau https://..." className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Label Tombol</label>
                                <input type="text" value={card.linkLabel} onChange={e => updateCard(idx, "linkLabel", e.target.value)} placeholder="Selengkapnya" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Videos editor */}
                {displayStyle === "video-carousel" && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold">Daftar Video <span className="text-red-500">*</span></label>
                      <button type="button" onClick={() => setVideos(v => [...v, emptyVideo()])} className="flex items-center gap-1 text-sm text-red-600 font-semibold hover:underline">
                        <Plus size={14} /> Tambah Video
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">Masukkan URL YouTube, URL video Google Drive, atau upload file video langsung dari perangkat Anda. Pastikan file Google Drive disetel “Siapa saja yang memiliki link dapat melihat”.</p>
                    <div className="space-y-3">
                      {videos.map((vid, idx) => {
                        const ytId = getYtId(vid.youtubeUrl);
                        const isLocal = vid.youtubeUrl.startsWith("/api/storage");
                        return (
                          <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <div className="flex items-start gap-3">
                              {/* Thumbnail preview */}
                              <div className="w-16 h-24 rounded-lg overflow-hidden bg-gray-200 shrink-0 border border-gray-300">
                                {ytId ? (
                                  <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="thumb" className="w-full h-full object-cover" />
                                ) : isLocal ? (
                                  <video src={vid.youtubeUrl} className="w-full h-full object-cover" muted preload="metadata" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400"><Video size={20} /></div>
                                )}
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Video {idx + 1}</span>
                                  {videos.length > 1 && <button type="button" onClick={() => setVideos(v => v.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 p-0.5 rounded"><X size={14} /></button>}
                                </div>
                                <MediaUploadInput
                                  value={vid.youtubeUrl}
                                  onChange={(url) => updateVideo(idx, "youtubeUrl", url)}
                                  accept="video/*"
                                   placeholder="YouTube atau Google Drive URL..."
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Judul (opsional)</label>
                                    <input type="text" value={vid.title} onChange={e => updateVideo(idx, "title", e.target.value)} placeholder="Judul video..." className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Badge Label</label>
                                    <input type="text" value={vid.category} onChange={e => updateVideo(idx, "category", e.target.value)} placeholder="STUDY, PRAYER..." className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-200 rounded-lg text-sm">Batal</button>
                <button type="submit" className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 text-sm">
                  {editingSection ? "Simpan Perubahan" : "Tambah Seksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
