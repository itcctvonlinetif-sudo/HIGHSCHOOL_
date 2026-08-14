import { useState } from "react";
import { useGetPages, useDeletePage } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Eye, Image, Link2, Video, PlusCircle, Minus, Lock, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format } from "date-fns";
import { MediaUploadInput } from "@/components/MediaUploadInput";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

type UrlEntry = { label: string; url: string };

const emptyForm = {
  title: "",
  slug: "",
  content: "",
  isPublished: true,
  imageUrls: [] as UrlEntry[],
  websiteUrls: [] as UrlEntry[],
  videoUrls: [] as UrlEntry[],
  usePassword: false,
  accessPassword: "",
  hasPassword: false,
  removePassword: false,
};

function parseUrls(raw: string | null | undefined): UrlEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) =>
        typeof item === "string" ? { label: "", url: item } : { label: item.label ?? "", url: item.url ?? "" }
      );
    }
  } catch {}
  return [];
}

function UrlListEditor({
  icon: Icon,
  label,
  placeholder,
  hint,
  entries,
  onChange,
  mediaType,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  placeholder: string;
  hint: string;
  entries: UrlEntry[];
  onChange: (v: UrlEntry[]) => void;
  mediaType?: "image" | "video";
}) {
  const add = () => onChange([...entries, { label: "", url: "" }]);
  const remove = (i: number) => onChange(entries.filter((_, idx) => idx !== i));
  const update = (i: number, field: "label" | "url", val: string) => {
    const next = [...entries];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-border">
        <span className="flex items-center gap-2 font-semibold text-sm text-foreground">
          <Icon size={16} className="text-primary" /> {label}
        </span>
        <button type="button" onClick={add}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-semibold transition-colors">
          <PlusCircle size={14} /> Tambah
        </button>
      </div>
      <div className="p-4 space-y-3">
        {entries.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">{hint} — klik "Tambah" untuk menambahkan</p>
        )}
        {entries.map((entry, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1 space-y-1.5">
              <input
                type="text"
                value={entry.label}
                onChange={e => update(i, "label", e.target.value)}
                placeholder="Nama / keterangan (opsional)"
                className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {mediaType ? (
                <MediaUploadInput
                  value={entry.url}
                  onChange={url => update(i, "url", url)}
                  accept={mediaType === "image" ? "image/*" : "video/*"}
                  placeholder={placeholder}
                />
              ) : (
                <input
                  type="url"
                  value={entry.url}
                  onChange={e => update(i, "url", e.target.value)}
                  placeholder={placeholder}
                  className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              )}
            </div>
            <button type="button" onClick={() => remove(i)}
              className="mt-1 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0">
              <Minus size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminPages() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: pages, isLoading } = useGetPages();
  const deleteMutation = useDeletePage({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/pages"] }); toast({ title: "Halaman dihapus" }); } }
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const [showNewPass, setShowNewPass] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (data: typeof emptyForm & { id?: number }) => {
      const payload: any = {
        title: data.title,
        slug: data.slug,
        content: data.content,
        isPublished: data.isPublished,
        imageUrls: JSON.stringify(data.imageUrls.filter(e => e.url.trim())),
        websiteUrls: JSON.stringify(data.websiteUrls.filter(e => e.url.trim())),
        videoUrls: JSON.stringify(data.videoUrls.filter(e => e.url.trim())),
      };
      if (data.removePassword) {
        payload.removePassword = true;
      } else if (data.usePassword && data.accessPassword) {
        payload.accessPassword = data.accessPassword;
      }
      return data.id
        ? apiFetch(`/pages/${data.id}`, { method: "PUT", body: JSON.stringify(payload) })
        : apiFetch("/pages", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      toast({ title: editingId ? "Halaman diperbarui" : "Halaman ditambahkan" });
      closeForm();
    },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  const closeForm = () => { setIsFormOpen(false); setEditingId(null); setFormData(emptyForm); };

  const openEdit = (page: any) => {
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content,
      isPublished: page.isPublished,
      imageUrls: parseUrls(page.imageUrls),
      websiteUrls: parseUrls(page.websiteUrls),
      videoUrls: parseUrls(page.videoUrls),
      usePassword: !!page.hasPassword,
      accessPassword: "",
      hasPassword: !!page.hasPassword,
      removePassword: false,
    });
    setEditingId(page.id);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...formData, id: editingId ?? undefined });
  };

  const setF = (key: keyof typeof emptyForm) => (val: any) =>
    setFormData(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Halaman Statis</h1>
        <button
          onClick={() => { closeForm(); setIsFormOpen(true); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} /> Buat Halaman
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xl mb-6">
          <h2 className="text-xl font-bold mb-6">{editingId ? "Edit Halaman" : "Buat Halaman Baru"}</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title & Slug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Judul Halaman *</label>
                <input type="text" value={formData.title}
                  onChange={e => {
                    const title = e.target.value;
                    setFormData(prev => ({
                      ...prev, title,
                      slug: !editingId
                        ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
                        : prev.slug,
                    }));
                  }}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug URL *</label>
                <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
                  <span className="px-3 py-2 bg-gray-50 text-sm text-primary/60 border-r">/halaman/</span>
                  <input type="text" value={formData.slug}
                    onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                    className="flex-1 px-3 py-2 text-sm focus:outline-none" required />
                </div>
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium mb-1">Konten (HTML didukung)</label>
              <textarea value={formData.content}
                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={8} className="w-full border rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="<h2>Judul Bagian</h2>&#10;<p>Isi paragraf...</p>&#10;<ul><li>Item 1</li></ul>" required />
            </div>

            {/* Image URLs */}
            <UrlListEditor
              icon={Image}
              label="URL Gambar"
              placeholder="https://example.com/gambar.jpg"
              hint="Tambahkan URL gambar yang akan ditampilkan di halaman ini"
              entries={formData.imageUrls}
              onChange={setF("imageUrls")}
              mediaType="image"
            />

            {/* Website URLs */}
            <UrlListEditor
              icon={Link2}
              label="Link Website / Referensi"
              placeholder="https://example.com"
              hint="Tambahkan tautan website atau referensi eksternal"
              entries={formData.websiteUrls}
              onChange={setF("websiteUrls")}
            />

            {/* Video URLs */}
            <UrlListEditor
              icon={Video}
              label="URL Video / YouTube"
              placeholder="https://www.youtube.com/watch?v=..."
              hint="Tambahkan link video YouTube atau upload file video"
              entries={formData.videoUrls}
              onChange={setF("videoUrls")}
              mediaType="video"
            />

            {/* Password protection */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-primary" />
                  <span className="text-sm font-semibold text-gray-800">Proteksi Password</span>
                  {formData.hasPassword && !formData.removePassword && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Aktif</span>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.usePassword}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      usePassword: e.target.checked,
                      removePassword: !e.target.checked && prev.hasPassword,
                      accessPassword: "",
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-300 peer-checked:bg-primary rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
                </label>
              </div>
              {formData.usePassword && (
                <div className="px-4 py-4 space-y-3 bg-white">
                  <p className="text-xs text-gray-500">
                    {formData.hasPassword
                      ? "Halaman ini sudah berpassword. Isi kolom di bawah untuk menggantinya, atau biarkan kosong."
                      : "Pengunjung harus memasukkan password untuk membuka halaman ini."}
                  </p>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      value={formData.accessPassword}
                      onChange={e => setFormData(prev => ({ ...prev, accessPassword: e.target.value }))}
                      placeholder={formData.hasPassword ? "Biarkan kosong untuk tidak mengganti password" : "Masukkan password halaman..."}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button type="button" onClick={() => setShowNewPass(p => !p)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Publish */}
            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="isPublished" checked={formData.isPublished}
                onChange={e => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                className="w-4 h-4 text-primary rounded accent-primary" />
              <label htmlFor="isPublished" className="text-sm font-medium">Publish langsung (tampil ke pengunjung)</label>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
              <button type="button" onClick={closeForm} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
              <button type="submit" disabled={saveMutation.isPending}
                className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 disabled:opacity-60">
                {saveMutation.isPending ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan Halaman"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
              <th className="px-6 py-4 font-semibold">Judul</th>
              <th className="px-6 py-4 font-semibold">URL Halaman</th>
              <th className="px-6 py-4 font-semibold">Media</th>
              <th className="px-6 py-4 font-semibold">Update Terakhir</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Memuat...</td></tr>
            ) : pages?.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Belum ada halaman. Klik "Buat Halaman" untuk mulai.</td></tr>
            ) : pages?.map((page) => {
              const imgs = parseUrls((page as any).imageUrls);
              const webs = parseUrls((page as any).websiteUrls);
              const vids = parseUrls((page as any).videoUrls);
              return (
                <tr key={page.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {(page as any).hasPassword && <Lock size={14} className="text-amber-500 shrink-0" title="Halaman berpassword" />}
                      {page.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 group relative cursor-default">
                    <span className="font-mono text-sm">
                      <span className="text-primary/50">/halaman/</span>
                      <span className="text-gray-600">{page.slug}</span>
                    </span>
                    <span className="hidden group-hover:block absolute bottom-full left-0 mb-1 text-xs bg-gray-800 text-white px-2 py-1 rounded whitespace-nowrap z-10">
                      Gunakan URL ini di Manajemen Menu
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {imgs.length > 0 && <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full"><Image size={11} /> {imgs.length}</span>}
                      {webs.length > 0 && <span className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-0.5 rounded-full"><Link2 size={11} /> {webs.length}</span>}
                      {vids.length > 0 && <span className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded-full"><Video size={11} /> {vids.length}</span>}
                      {imgs.length === 0 && webs.length === 0 && vids.length === 0 && <span className="text-gray-300">—</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{format(new Date(page.updatedAt), "dd/MM/yyyy HH:mm")}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${page.isPublished ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {page.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/halaman/${page.slug}`} target="_blank" className="inline-block p-2 text-gray-500 hover:bg-gray-100 rounded-lg mr-1"><Eye size={18} /></Link>
                    <button onClick={() => openEdit(page)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-1"><Edit2 size={18} /></button>
                    <button onClick={() => { if (confirm("Hapus halaman ini secara permanen?")) deleteMutation.mutate({ id: page.id }); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
