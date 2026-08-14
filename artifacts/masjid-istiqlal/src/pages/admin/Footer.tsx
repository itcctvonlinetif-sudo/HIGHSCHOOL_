import { useEffect, useState } from "react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Link2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FooterLink = { label: string; url: string };

type FooterForm = {
  siteName: string;
  description: string;
  footerQuickLinksTitle: string;
  footerContactTitle: string;
  address: string;
  phone: string;
  email: string;
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
  footerCopyright: string;
  footerShowAdminLink: boolean;
};

const DEFAULT_LINKS: FooterLink[] = [
  { label: "Beranda", url: "/" },
  { label: "Profil", url: "/profil" },
  { label: "Berita & Artikel", url: "/berita" },
  { label: "Jadwal Kegiatan", url: "/kegiatan" },
  { label: "Live CCTV", url: "/cctv" },
];

const DEFAULT_FORM: FooterForm = {
  siteName: "Musholla Nurul Iman",
  description: "Pusat peribadatan dan syiar Islam yang mengedepankan nilai-nilai toleransi dan kedamaian.",
  footerQuickLinksTitle: "Tautan Cepat",
  footerContactTitle: "Kontak Kami",
  address: "Jl. Taman Wijaya Kusuma, Jakarta Pusat 10710",
  phone: "(021) 3811493",
  email: "info@istiqlal.or.id",
  facebook: "",
  twitter: "",
  instagram: "",
  youtube: "",
  footerCopyright: "All rights reserved.",
  footerShowAdminLink: true,
};

function parseLinks(raw: unknown): FooterLink[] {
  if (typeof raw !== "string") return [...DEFAULT_LINKS];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_LINKS];
    const links = parsed.filter(
      (item): item is FooterLink =>
        item && typeof item.label === "string" && typeof item.url === "string",
    );
    return links.length ? links : [...DEFAULT_LINKS];
  } catch {
    return [...DEFAULT_LINKS];
  }
}

export function AdminFooter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: settings, isLoading } = useGetSettings();
  const [form, setForm] = useState<FooterForm>({ ...DEFAULT_FORM });
  const [links, setLinks] = useState<FooterLink[]>([...DEFAULT_LINKS]);

  const updateMutation = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
        toast({ title: "Isi footer berhasil disimpan" });
      },
    },
  });

  useEffect(() => {
    if (!settings) return;
    const s = settings as any;
    setForm({
      siteName: s.siteName || DEFAULT_FORM.siteName,
      description: s.description || DEFAULT_FORM.description,
      footerQuickLinksTitle: s.footerQuickLinksTitle || DEFAULT_FORM.footerQuickLinksTitle,
      footerContactTitle: s.footerContactTitle || DEFAULT_FORM.footerContactTitle,
      address: s.address || DEFAULT_FORM.address,
      phone: s.phone || DEFAULT_FORM.phone,
      email: s.email || DEFAULT_FORM.email,
      facebook: s.facebook || "",
      twitter: s.twitter || "",
      instagram: s.instagram || "",
      youtube: s.youtube || "",
      footerCopyright: s.footerCopyright || DEFAULT_FORM.footerCopyright,
      footerShowAdminLink: s.footerShowAdminLink !== "false",
    });
    setLinks(parseLinks(s.footerQuickLinks));
  }, [settings]);

  const updateField = <K extends keyof FooterForm>(field: K, value: FooterForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = () => {
    const validLinks = links.filter((link) => link.label.trim() && link.url.trim());
    updateMutation.mutate({
      data: {
        ...form,
        footerShowAdminLink: form.footerShowAdminLink ? "true" : "false",
        footerQuickLinks: JSON.stringify(validLinks),
      } as any,
    });
  };

  const handleReset = () => {
    setForm({ ...DEFAULT_FORM });
    setLinks([...DEFAULT_LINKS]);
    updateMutation.mutate({
      data: {
        ...DEFAULT_FORM,
        footerShowAdminLink: "true",
        footerQuickLinks: JSON.stringify(DEFAULT_LINKS),
      } as any,
    });
  };

  if (isLoading) return <div className="p-8 text-center text-gray-400">Memuat...</div>;

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Footer</h1>
          <p className="text-sm text-gray-500 mt-1">
            Edit seluruh isi yang tampil di bagian bawah website.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm disabled:opacity-50"
          >
            <RotateCcw size={16} /> Reset Default
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg disabled:opacity-50"
          >
            <Save size={18} /> {updateMutation.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>

      <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-5">
        <SectionTitle title="Identitas Footer" />
        <Field
          label="Nama Situs"
          value={form.siteName}
          onChange={(value) => updateField("siteName", value)}
          placeholder="Nama yang tampil di footer"
        />
        <div>
          <label className="block text-sm font-semibold mb-2">Deskripsi Footer</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={4}
            className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none resize-y"
            placeholder="Deskripsi singkat organisasi..."
          />
        </div>
      </section>

      <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-5">
        <SectionTitle title="Tautan Cepat" icon={<Link2 size={18} className="text-primary" />} />
        <Field
          label="Judul Kolom Tautan"
          value={form.footerQuickLinksTitle}
          onChange={(value) => updateField("footerQuickLinksTitle", value)}
          placeholder="Tautan Cepat"
        />
        <div className="space-y-3">
          {links.map((link, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr_auto] gap-2 items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
              <input
                type="text"
                value={link.label}
                onChange={(e) => setLinks((current) => current.map((item, i) => i === index ? { ...item, label: e.target.value } : item))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Nama tautan"
                aria-label={`Label tautan ${index + 1}`}
              />
              <input
                type="text"
                value={link.url}
                onChange={(e) => setLinks((current) => current.map((item, i) => i === index ? { ...item, url: e.target.value } : item))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="/halaman atau https://..."
                aria-label={`URL tautan ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => setLinks((current) => current.filter((_, i) => i !== index))}
                className="justify-self-end p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                title="Hapus tautan"
                aria-label={`Hapus tautan ${index + 1}`}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLinks((current) => [...current, { label: "", url: "" }])}
            className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
          >
            <Plus size={16} /> Tambah Tautan
          </button>
        </div>
        <p className="text-xs text-gray-400">Gunakan URL diawali <code>/</code> untuk halaman website atau URL lengkap untuk tautan eksternal.</p>
      </section>

      <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-5">
        <SectionTitle title="Kontak Footer" />
        <Field
          label="Judul Kolom Kontak"
          value={form.footerContactTitle}
          onChange={(value) => updateField("footerContactTitle", value)}
          placeholder="Kontak Kami"
        />
        <div>
          <label className="block text-sm font-semibold mb-2">Alamat</label>
          <textarea
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            rows={3}
            className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none resize-y"
            placeholder="Alamat lengkap..."
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Nomor Telepon" value={form.phone} onChange={(value) => updateField("phone", value)} placeholder="Nomor telepon" />
          <Field label="Email" value={form.email} onChange={(value) => updateField("email", value)} placeholder="email@contoh.com" type="email" />
        </div>
      </section>

      <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-5">
        <SectionTitle title="Sosial Media" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Facebook" value={form.facebook} onChange={(value) => updateField("facebook", value)} placeholder="https://facebook.com/..." type="url" />
          <Field label="Instagram" value={form.instagram} onChange={(value) => updateField("instagram", value)} placeholder="https://instagram.com/..." type="url" />
          <Field label="Twitter / X" value={form.twitter} onChange={(value) => updateField("twitter", value)} placeholder="https://twitter.com/..." type="url" />
          <Field label="YouTube" value={form.youtube} onChange={(value) => updateField("youtube", value)} placeholder="https://youtube.com/..." type="url" />
        </div>
        <p className="text-xs text-gray-400">Kosongkan URL jika ikon sosial media tersebut tidak ingin ditampilkan.</p>
      </section>

      <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-5">
        <SectionTitle title="Copyright & Link Admin" />
        <Field
          label="Teks Setelah Nama Situs"
          value={form.footerCopyright}
          onChange={(value) => updateField("footerCopyright", value)}
          placeholder="All rights reserved."
        />
        <button
          type="button"
          onClick={() => updateField("footerShowAdminLink", !form.footerShowAdminLink)}
          className="flex items-center gap-3 text-sm font-medium text-gray-700"
        >
          {form.footerShowAdminLink ? <Eye size={18} className="text-green-600" /> : <EyeOff size={18} className="text-gray-400" />}
          {form.footerShowAdminLink ? "Tampilkan link Admin Portal di footer" : "Sembunyikan link Admin Portal di footer"}
        </button>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg disabled:opacity-50"
        >
          <Save size={20} /> {updateMutation.isPending ? "Menyimpan..." : "Simpan Pengaturan Footer"}
        </button>
      </div>
    </div>
  );
}

function SectionTitle({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b pb-3">
      {icon}
      <h2 className="text-lg font-bold text-primary">{title}</h2>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none"
        placeholder={placeholder}
      />
    </div>
  );
}