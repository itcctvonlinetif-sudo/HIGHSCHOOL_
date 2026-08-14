import { useState, useEffect } from "react";
import { useGetCctvCameras, useCreateCctvCamera, useUpdateCctvCamera, useDeleteCctvCamera } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Video, Settings2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AdminCCTV() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: cameras, isLoading } = useGetCctvCameras();

  const createMutation = useCreateCctvCamera({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cctv"] }); toast({ title: "Kamera ditambahkan" }); closeForm(); } } });
  const updateMutation = useUpdateCctvCamera({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cctv"] }); toast({ title: "Kamera diupdate" }); closeForm(); } } });
  const deleteMutation = useDeleteCctvCamera({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cctv"] }); toast({ title: "Kamera dihapus" }); } } });

  const [activeTab, setActiveTab] = useState<"cameras" | "access">("cameras");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const nextOrder = (cameras?.length || 0) + 1;
  const defaultForm = { name: "", location: "", streamUrl: "", embedUrl: "", description: "", order: nextOrder, isActive: true };
  const [formData, setFormData] = useState(defaultForm);

  const closeForm = () => { setIsFormOpen(false); setEditingId(null); setFormData({...defaultForm, order: nextOrder}); };
  const openEdit = (item: any) => { setFormData({ name: item.name, location: item.location, streamUrl: item.streamUrl, embedUrl: item.embedUrl || "", description: item.description || "", order: item.order, isActive: item.isActive }); setEditingId(item.id); setIsFormOpen(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) updateMutation.mutate({ id: editingId, data: formData });
    else createMutation.mutate({ data: formData });
  };

  const sortedCameras = [...(cameras || [])].sort((a, b) => a.order - b.order);

  // Access settings state
  const [accessForm, setAccessForm] = useState({
    cctvPageTitle: "",
    cctvPageDescription: "",
    cctvAccessPassword: "",
    hasPassword: false,
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [accessSaving, setAccessSaving] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/admin/cctv-access`)
      .then(r => r.json())
      .then(data => {
        setAccessForm(f => ({
          ...f,
          cctvPageTitle: data.cctvPageTitle || "",
          cctvPageDescription: data.cctvPageDescription || "",
          hasPassword: data.hasPassword || false,
        }));
        setAccessLoading(false);
      })
      .catch(() => setAccessLoading(false));
  }, []);

  const handleSaveAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccessSaving(true);
    try {
      const body: any = {
        cctvPageTitle: accessForm.cctvPageTitle,
        cctvPageDescription: accessForm.cctvPageDescription,
      };
      if (accessForm.cctvAccessPassword !== "") {
        body.cctvAccessPassword = accessForm.cctvAccessPassword;
      }
      const res = await fetch(`${BASE}/api/admin/cctv-access`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Berhasil", description: data.message });
        setAccessForm(f => ({ ...f, cctvAccessPassword: "", hasPassword: f.cctvAccessPassword !== "" ? true : f.hasPassword }));
      } else {
        toast({ variant: "destructive", title: "Gagal", description: data.message || "Terjadi kesalahan" });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Gagal terhubung ke server" });
    } finally {
      setAccessSaving(false);
    }
  };

  const handleRemovePassword = async () => {
    if (!confirm("Hapus password? Halaman CCTV bisa diakses semua orang.")) return;
    setAccessSaving(true);
    try {
      const res = await fetch(`${BASE}/api/admin/cctv-access`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cctvAccessPassword: "" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Password dihapus", description: "Halaman CCTV sekarang terbuka" });
        setAccessForm(f => ({ ...f, hasPassword: false, cctvAccessPassword: "" }));
      } else {
        toast({ variant: "destructive", title: "Gagal", description: data.message });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Gagal terhubung ke server" });
    } finally {
      setAccessSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kamera CCTV</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola daftar kamera CCTV dan pengaturan halaman akses warga.</p>
        </div>
        {activeTab === "cameras" && (
          <button onClick={() => { closeForm(); setIsFormOpen(true); }} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
            <Plus size={18} /> Tambah Kamera
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("cameras")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "cameras" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
        >
          Daftar Kamera
        </button>
        <button
          onClick={() => setActiveTab("access")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "access" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
        >
          <Settings2 size={15} /> Pengaturan Akses
        </button>
      </div>

      {/* Tab: Daftar Kamera */}
      {activeTab === "cameras" && (
        <>
          {isFormOpen && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xl mb-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Video className="text-primary" /> {editingId ? "Edit Konfigurasi Kamera" : "Tambah Kamera Baru"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nama Kamera</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="Cam 01 - Mihrab" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Lokasi Fisik</label>
                    <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="Lantai Utama" required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Stream URL (RTSP/HLS dll)</label>
                    <input type="text" value={formData.streamUrl} onChange={e => setFormData({...formData, streamUrl: e.target.value})} className="w-full border rounded-lg px-3 py-2 font-mono text-sm bg-gray-50" required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 text-blue-700">Embed URL (Iframe Web Player) - Opsional namun disarankan</label>
                    <input type="text" value={formData.embedUrl} onChange={e => setFormData({...formData, embedUrl: e.target.value})} className="w-full border rounded-lg px-3 py-2 font-mono text-sm" placeholder="https://youtube.com/embed/..." />
                    <p className="text-xs text-gray-500 mt-1">Jika diisi, URL ini yang akan dirender sebagai iframe di halaman publik.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pb-4 border-b border-gray-100 mt-4">
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-primary rounded" />
                  <label htmlFor="isActive" className="text-sm font-medium">Kamera Aktif & Tampil</label>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={closeForm} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
                  <button type="submit" className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90">Simpan Konfigurasi</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                  <th className="px-6 py-4 font-semibold">Kamera & Lokasi</th>
                  <th className="px-6 py-4 font-semibold">Tipe Player</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? <tr><td colSpan={4} className="text-center py-8">Loading...</td></tr> :
                 sortedCameras.map((item) => (
                  <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50/50 ${!item.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <Video size={16} className={item.isActive ? "text-red-500 animate-pulse" : "text-gray-400"} />
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-500 ml-6">{item.location}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {item.embedUrl ? <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-mono text-xs">Iframe Web</span> : <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono text-xs">Raw Stream</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.isActive ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-1"><Edit2 size={18} /></button>
                      <button onClick={() => { if(confirm('Hapus konfigurasi kamera?')) deleteMutation.mutate({id: item.id}) }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Tab: Pengaturan Akses */}
      {activeTab === "access" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-2xl">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Pengaturan Halaman & Password</h2>
          <p className="text-sm text-gray-500 mb-6">Atur judul dan password yang dibutuhkan warga untuk mengakses halaman CCTV.</p>

          {accessLoading ? (
            <div className="py-8 text-center text-gray-400">Memuat pengaturan...</div>
          ) : (
            <form onSubmit={handleSaveAccess} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Judul Halaman</label>
                <input
                  type="text"
                  value={accessForm.cctvPageTitle}
                  onChange={e => setAccessForm(f => ({ ...f, cctvPageTitle: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="Live CCTV"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi Halaman</label>
                <textarea
                  value={accessForm.cctvPageDescription}
                  onChange={e => setAccessForm(f => ({ ...f, cctvPageDescription: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                  placeholder="Pantauan langsung area musholla"
                />
              </div>

              <div className="border-t border-gray-100 pt-5">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Password Warga {accessForm.hasPassword && <span className="text-xs font-normal text-green-600 ml-2 bg-green-50 px-2 py-0.5 rounded-full">Password aktif</span>}
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  {accessForm.hasPassword
                    ? "Password sudah diset. Kosongkan jika tidak ingin mengubah password."
                    : "Biarkan kosong jika tidak ingin menggunakan password. Isi untuk mengaktifkan proteksi."}
                </p>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={accessForm.cctvAccessPassword}
                    onChange={e => setAccessForm(f => ({ ...f, cctvAccessPassword: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder={accessForm.hasPassword ? "Biarkan kosong untuk tidak mengubah password" : "Isi untuk mengaktifkan password..."}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {accessForm.hasPassword && (
                  <button
                    type="button"
                    onClick={handleRemovePassword}
                    className="mt-3 text-sm text-red-500 hover:underline"
                  >
                    Hapus password (buka akses untuk semua)
                  </button>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={accessSaving}
                  className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-70"
                >
                  {accessSaving ? "Menyimpan..." : "Simpan Pengaturan"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
