import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, CheckCircle, XCircle, GripVertical } from "lucide-react";
import { MediaUploadInput } from "@/components/MediaUploadInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const ICON_OPTIONS = [
  "BookOpen", "Users", "MapPin", "Heart", "Star", "Home",
  "Phone", "Mail", "Globe", "Shield", "Gift", "Award",
  "Lightbulb", "Mic", "Music", "Camera", "Video", "Bookmark",
  "Building", "Clock", "Calendar", "Info", "HelpCircle",
];

type Layanan = {
  id: number;
  title: string;
  description: string;
  icon: string;
  linkUrl: string | null;
  order: number;
  isActive: boolean;
  popupEnabled: boolean;
  popupTitle: string | null;
  popupSubtitle: string | null;
  popupImageUrl: string | null;
  popupInstructions: string | null;
  popupHighlightTitle: string | null;
  popupHighlightContent: string | null;
};

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const emptyForm = {
  title: "", description: "", icon: "BookOpen", linkUrl: "", order: 0, isActive: true,
  popupEnabled: false,
  popupTitle: "", popupSubtitle: "", popupImageUrl: "",
  popupInstructions: "", popupHighlightTitle: "", popupHighlightContent: "",
};

export function AdminLayanan() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Layanan | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: items = [], isLoading } = useQuery<Layanan[]>({
    queryKey: ["/api/layanan"],
    queryFn: () => apiFetch("/layanan"),
  });

  const saveMut = useMutation({
    mutationFn: (data: { id?: number; form: typeof emptyForm }) =>
      data.id
        ? apiFetch(`/layanan/${data.id}`, { method: "PUT", body: JSON.stringify(data.form) })
        : apiFetch("/layanan", { method: "POST", body: JSON.stringify(data.form) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/layanan"] });
      setOpen(false);
      toast({ title: editing ? "Layanan berhasil diperbarui" : "Layanan berhasil ditambahkan" });
    },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/layanan/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/layanan"] }); toast({ title: "Layanan dihapus" }); },
    onError: () => toast({ title: "Gagal menghapus", variant: "destructive" }),
  });

  const reorderMut = useMutation({
    mutationFn: ({ id, newOrder, item }: { id: number; newOrder: number; item: Layanan }) =>
      apiFetch(`/layanan/${id}`, { method: "PUT", body: JSON.stringify({ ...item, order: newOrder }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/layanan"] }),
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, order: items.length });
    setOpen(true);
  };

  const openEdit = (item: Layanan) => {
    setEditing(item);
    setForm({
      title: item.title, description: item.description,
      icon: item.icon, linkUrl: item.linkUrl ?? "", order: item.order, isActive: item.isActive,
      popupEnabled: item.popupEnabled,
      popupTitle: item.popupTitle ?? "",
      popupSubtitle: item.popupSubtitle ?? "",
      popupImageUrl: item.popupImageUrl ?? "",
      popupInstructions: item.popupInstructions ?? "",
      popupHighlightTitle: item.popupHighlightTitle ?? "",
      popupHighlightContent: item.popupHighlightContent ?? "",
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast({ title: "Judul dan deskripsi wajib diisi", variant: "destructive" }); return;
    }
    saveMut.mutate({ id: editing?.id, form: { ...form, linkUrl: form.linkUrl || null } as any });
  };

  const moveItem = (item: Layanan, dir: "up" | "down") => {
    const sorted = [...items].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(i => i.id === item.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swap = sorted[swapIdx];
    reorderMut.mutate({ id: item.id, newOrder: swap.order, item });
    reorderMut.mutate({ id: swap.id, newOrder: item.order, item: swap });
  };

  const sorted = [...items].sort((a, b) => a.order - b.order);

  const f = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">Layanan</h1>
          <p className="text-muted-foreground mt-1">Kelola kartu layanan dan popup konten di halaman beranda</p>
        </div>
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 gap-2">
          <Plus size={16} /> Tambah Layanan
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">Memuat data...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-2xl">
          <GripVertical size={40} className="mx-auto mb-3 opacity-30" />
          <p>Belum ada layanan. Klik "Tambah Layanan" untuk memulai.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-4 p-5 bg-white rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveItem(item, "up")} disabled={idx === 0} className="p-1 text-muted-foreground hover:text-primary disabled:opacity-20 transition-colors"><ChevronUp size={16} /></button>
                <button onClick={() => moveItem(item, "down")} disabled={idx === sorted.length - 1} className="p-1 text-muted-foreground hover:text-primary disabled:opacity-20 transition-colors"><ChevronDown size={16} /></button>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {item.icon.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-bold text-foreground">{item.title}</h3>
                  {item.isActive ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle size={11} /> Aktif</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full"><XCircle size={11} /> Nonaktif</span>
                  )}
                  {item.popupEnabled && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Popup Aktif</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => openEdit(item)} className="gap-1.5">
                  <Pencil size={14} /> Edit
                </Button>
                <Button variant="outline" size="sm"
                  className="text-red-500 border-red-200 hover:bg-red-50 gap-1.5"
                  onClick={() => { if (confirm("Hapus layanan ini?")) deleteMut.mutate(item.id); }}
                >
                  <Trash2 size={14} /> Hapus
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit: ${editing.title}` : "Tambah Layanan Baru"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="info">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="info" className="flex-1">Informasi Kartu</TabsTrigger>
              <TabsTrigger value="popup" className="flex-1">Konten Popup</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div>
                <Label className="mb-1.5 block">Judul Layanan *</Label>
                <Input value={form.title} onChange={f("title")} placeholder="contoh: Zakat & Wakaf" />
              </div>
              <div>
                <Label className="mb-1.5 block">Deskripsi Singkat *</Label>
                <Textarea value={form.description} onChange={f("description")} placeholder="Deskripsi yang tampil di kartu beranda..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">Ikon</Label>
                  <Select value={form.icon} onValueChange={val => setForm(p => ({ ...p, icon: val }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map(ic => <SelectItem key={ic} value={ic}>{ic}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block">Urutan</Label>
                  <Input type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isActive" checked={form.isActive}
                  onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-primary" />
                <Label htmlFor="isActive">Tampilkan kartu di beranda</Label>
              </div>
              <div>
                <Label className="mb-1.5 block">Link Tujuan (jika popup nonaktif)</Label>
                <Input value={form.linkUrl} onChange={f("linkUrl")} placeholder="contoh: /halaman/museum-istiqlal atau kosongkan" />
                <p className="text-xs text-muted-foreground mt-1">Jika popup diaktifkan, link ini diabaikan. Kosongkan agar klik tidak melakukan apa-apa.</p>
              </div>
            </TabsContent>

            <TabsContent value="popup" className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <strong>Popup</strong> akan muncul saat pengunjung mengklik kartu layanan di beranda. Jika popup diaktifkan, "Link Tujuan" di tab Informasi Kartu akan diabaikan.
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="popupEnabled" checked={form.popupEnabled}
                  onChange={e => setForm(p => ({ ...p, popupEnabled: e.target.checked }))}
                  className="w-4 h-4 accent-primary" />
                <Label htmlFor="popupEnabled">Aktifkan popup saat kartu diklik</Label>
              </div>
              {form.popupEnabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-1.5 block">Judul Popup</Label>
                      <Input value={form.popupTitle} onChange={f("popupTitle")} placeholder="contoh: Zakat & Wakaf" />
                    </div>
                    <div>
                      <Label className="mb-1.5 block">Subjudul / Keterangan</Label>
                      <Input value={form.popupSubtitle} onChange={f("popupSubtitle")} placeholder="contoh: Scan QRIS di bawah ini" />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Gambar (QRIS / Foto)</Label>
                    <MediaUploadInput
                      value={form.popupImageUrl}
                      onChange={url => setForm(p => ({ ...p, popupImageUrl: url }))}
                      accept="image/*"
                      placeholder="https://... atau kosongkan jika tidak ada gambar"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Panduan / Instruksi</Label>
                    <p className="text-xs text-muted-foreground mb-1.5">Satu baris = satu langkah. Akan ditampilkan sebagai daftar bernomor.</p>
                    <Textarea value={form.popupInstructions} onChange={f("popupInstructions")} rows={4}
                      placeholder={"Lakukan transfer dari ATM, M-banking, i-banking\nSimpan bukti transfer dan konfirmasi via WhatsApp: 0811-8882-1818"} />
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm font-semibold text-foreground mb-3">Blok Sorotan (Opsional)</p>
                    <div>
                      <Label className="mb-1.5 block">Judul Sorotan</Label>
                      <Input value={form.popupHighlightTitle} onChange={f("popupHighlightTitle")} placeholder="contoh: Niat Menunaikan Zakat" />
                    </div>
                    <div className="mt-3">
                      <Label className="mb-1.5 block">Isi Sorotan</Label>
                      <p className="text-xs text-muted-foreground mb-1.5">Dapat berisi teks Arab, latin, atau terjemahan. Baris baru akan dipisah paragraf.</p>
                      <Textarea value={form.popupHighlightContent} onChange={f("popupHighlightContent")} rows={5}
                        placeholder={"نَوَيْتُ أَنْ أُخْرِجَ زَكَاةَ مَالِي فَرْضًا لِلَّهِ تَعَالَى\n\nNawaitu an ukhrija zakata maali fardhan lillahi ta'ala.\n\nAku niat mengeluarkan zakat hartaku fardhu karena Allah Ta'ala."} />
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saveMut.isPending} className="bg-primary hover:bg-primary/90">
              {saveMut.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
