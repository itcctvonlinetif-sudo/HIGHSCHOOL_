import { useState } from "react";
import { useGetGallery, useCreateGalleryItem, useUpdateGalleryItem, useDeleteGalleryItem } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Image as ImageIcon, Video, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MediaUploadInput } from "@/components/MediaUploadInput";
import { toGDriveImageUrl } from "@/lib/gdrive";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function getImageSrc(url: string) {
  if (!url) return "";
  if (url.startsWith("/api/storage")) return `${BASE}${url}`;
  return toGDriveImageUrl(url);
}

function getYtId(url: string): string | null {
  const m = url?.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function isLocalVideo(url: string) {
  return url?.startsWith("/api/storage") || url?.startsWith("blob:");
}

/* ─── Photo Tab ─────────────────────────────────────────────── */
function FotoTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: gallery, isLoading } = useGetGallery();
  const photos = gallery?.filter(i => (i as any).type !== "video") ?? [];

  const createMutation = useCreateGalleryItem({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/gallery"] }); toast({ title: "Foto ditambahkan" }); closeForm(); } } });
  const updateMutation = useUpdateGalleryItem({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/gallery"] }); toast({ title: "Foto diupdate" }); closeForm(); } } });
  const deleteMutation = useDeleteGalleryItem({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/gallery"] }); toast({ title: "Foto dihapus" }); } } });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const defaultForm = { title: "", imageUrl: "", category: "Umum", isActive: true };
  const [formData, setFormData] = useState(defaultForm);

  const closeForm = () => { setIsFormOpen(false); setEditingId(null); setFormData(defaultForm); };
  const openEdit = (item: any) => { setFormData({ title: item.title, imageUrl: item.imageUrl, category: item.category, isActive: item.isActive }); setEditingId(item.id); setIsFormOpen(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) { toast({ title: "Gambar harus diisi", variant: "destructive" }); return; }
    const payload = { ...formData, type: "photo" };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate({ data: payload });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{photos.length} foto</p>
        <button onClick={() => { closeForm(); setIsFormOpen(true); }} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
          <Plus size={18} /> Tambah Foto
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xl mb-6">
          <h2 className="text-xl font-bold mb-6">{editingId ? "Edit Foto" : "Tambah Foto Baru"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Judul / Deskripsi Foto</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kategori</label>
                <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="e.g. Arsitektur, Kegiatan" required />
              </div>
              <div className="md:col-span-2">
                <MediaUploadInput
                  label="Gambar (Upload File atau Link URL)"
                  value={formData.imageUrl}
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  accept="image/*"
                  placeholder="https://..."
                />
              </div>
            </div>
            {formData.imageUrl && (
              <div className="mt-4 p-2 bg-gray-50 border rounded-lg inline-block">
                <img src={getImageSrc(formData.imageUrl)} alt="Preview" className="h-32 object-contain rounded" onError={(e) => (e.currentTarget.style.display='none')} />
              </div>
            )}
            <div className="flex items-center gap-2 pb-4 border-b border-gray-100 mt-4">
              <input type="checkbox" id="isActiveFoto" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-primary rounded" />
              <label htmlFor="isActiveFoto" className="text-sm font-medium">Tampilkan di Galeri</label>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={closeForm} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
              <button type="submit" className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90">Simpan Foto</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="py-8 text-center text-gray-400">Memuat...</div>
      ) : photos.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <ImageIcon size={40} className="mx-auto mb-3 opacity-30" />
          <p>Belum ada foto. Klik "Tambah Foto" untuk mulai.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((item) => (
            <div key={item.id} className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group ${!item.isActive ? 'opacity-50' : ''}`}>
              <div className="aspect-square bg-gray-100 relative">
                <img src={getImageSrc(item.imageUrl)} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                  {item.category}
                </div>
                {item.imageUrl?.startsWith("/api/storage") && (
                  <div className="absolute top-2 left-2 bg-primary/80 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">Lokal</div>
                )}
              </div>
              <div className="p-4">
                <p className="font-medium text-sm text-gray-900 truncate mb-3" title={item.title}>{item.title}</p>
                <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                  <button onClick={() => openEdit(item)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Edit2 size={16} /></button>
                  <button onClick={() => { if(confirm('Hapus foto ini?')) deleteMutation.mutate({id: item.id}) }} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Video Tab ─────────────────────────────────────────────── */
function VideoTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: gallery, isLoading } = useGetGallery();
  const videos = gallery?.filter(i => (i as any).type === "video") ?? [];

  const createMutation = useCreateGalleryItem({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/gallery"] }); toast({ title: "Video ditambahkan" }); closeForm(); } } });
  const updateMutation = useUpdateGalleryItem({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/gallery"] }); toast({ title: "Video diupdate" }); closeForm(); } } });
  const deleteMutation = useDeleteGalleryItem({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/gallery"] }); toast({ title: "Video dihapus" }); } } });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const defaultForm = { title: "", imageUrl: "", category: "", isActive: true };
  const [formData, setFormData] = useState(defaultForm);

  const closeForm = () => { setIsFormOpen(false); setEditingId(null); setFormData(defaultForm); };
  const openEdit = (item: any) => { setFormData({ title: item.title, imageUrl: item.imageUrl, category: item.category, isActive: item.isActive }); setEditingId(item.id); setIsFormOpen(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) { toast({ title: "URL atau file video harus diisi", variant: "destructive" }); return; }
    const payload = { ...formData, type: "video" };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate({ data: payload });
  };

  function VideoThumb({ url }: { url: string }) {
    const ytId = getYtId(url);
    const local = isLocalVideo(url);
    if (ytId) return <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="thumb" className="w-full h-full object-cover" />;
    if (local) return <video src={`${BASE}${url}`} className="w-full h-full object-cover" muted preload="metadata" />;
    return <div className="w-full h-full flex items-center justify-center text-gray-400"><Video size={24} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{videos.length} video</p>
        <button onClick={() => { closeForm(); setIsFormOpen(true); }} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
          <Plus size={18} /> Tambah Video
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xl mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">{editingId ? "Edit Video" : "Tambah Video Baru"}</h2>
            <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              {/* Preview thumbnail */}
              <div className="w-24 h-36 rounded-xl overflow-hidden bg-gray-200 shrink-0 border border-gray-300">
                {formData.imageUrl ? <VideoThumb url={formData.imageUrl} /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><Video size={28} /></div>}
              </div>
              <div className="flex-1 space-y-3">
                <MediaUploadInput
                  label="URL YouTube atau Upload File Video"
                  value={formData.imageUrl}
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  accept="video/*"
                  placeholder="https://youtube.com/watch?v=... atau https://youtu.be/..."
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Judul Video</label>
                    <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Judul video..." required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Badge Label <span className="text-gray-400 font-normal">(opsional)</span></label>
                    <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="CERAMAH, KAJIAN..." />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 pb-3 border-b border-gray-100">
              <input type="checkbox" id="isActiveVideo" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-primary rounded" />
              <label htmlFor="isActiveVideo" className="text-sm font-medium">Tampilkan di Galeri</label>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={closeForm} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
              <button type="submit" className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">Simpan Video</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="py-8 text-center text-gray-400">Memuat...</div>
      ) : videos.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Video size={40} className="mx-auto mb-3 opacity-30" />
          <p>Belum ada video. Klik "Tambah Video" untuk mulai.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((item) => {
            const ytId = getYtId(item.imageUrl);
            const local = isLocalVideo(item.imageUrl);
            return (
              <div key={item.id} className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-start gap-4 ${!item.isActive ? 'opacity-50' : ''}`}>
                <div className="w-20 h-28 rounded-lg overflow-hidden bg-gray-200 shrink-0 border border-gray-300">
                  {ytId ? (
                    <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="thumb" className="w-full h-full object-cover" />
                  ) : local ? (
                    <video src={`${BASE}${item.imageUrl}`} className="w-full h-full object-cover" muted preload="metadata" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><Video size={24} /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 truncate">{item.title || "Tanpa judul"}</p>
                      {item.category && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase tracking-wider">{item.category}</span>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(item)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Edit2 size={16} /></button>
                      <button onClick={() => { if(confirm('Hapus video ini?')) deleteMutation.mutate({id: item.id}) }} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-400 truncate">{item.imageUrl}</p>
                  {!item.isActive && <span className="inline-block mt-1 text-xs text-gray-400 italic">Tersembunyi</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export function AdminGaleri() {
  const [tab, setTab] = useState<"foto" | "video">("foto");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Galeri</h1>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab("foto")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "foto" ? "bg-white shadow text-primary" : "text-gray-500 hover:text-gray-700"}`}
        >
          <ImageIcon size={16} /> Foto
        </button>
        <button
          onClick={() => setTab("video")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "video" ? "bg-white shadow text-red-600" : "text-gray-500 hover:text-gray-700"}`}
        >
          <Video size={16} /> Video
        </button>
      </div>

      {tab === "foto" ? <FotoTab /> : <VideoTab />}
    </div>
  );
}
