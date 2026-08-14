import { useState, useEffect } from "react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Save, RotateCcw, Palette, Type, Eye, ImageOff, Paintbrush2, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { hslStringToHex, applyThemeSettings } from "@/lib/theme";

// Default theme HSL values (from index.css)
const DEFAULTS = {
  themeBodyBg: hslStringToHex("40 33% 98%"),       // warm off-white
  themePrimaryColor: hslStringToHex("152 77% 17%"), // deep islamic green
  themeSecondaryColor: hslStringToHex("46 65% 52%"),// gold
  themeFooterBg: hslStringToHex("152 77% 17%"),     // same as primary
  themeFooterText: hslStringToHex("46 65% 95%"),    // light gold
  themeBodyFont: "Plus Jakarta Sans",
  themeHeadingFont: "Amiri",
  bgPatternType: "pattern" as BgPatternType,
  bgPatternColor: hslStringToHex("40 33% 95%"),     // fallback for color mode
};

const BODY_FONTS = [
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans (Default)" },
  { value: "Poppins", label: "Poppins" },
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Lato", label: "Lato" },
  { value: "Nunito", label: "Nunito" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Noto Sans", label: "Noto Sans" },
];

const HEADING_FONTS = [
  { value: "Amiri", label: "Amiri (Default — Kaligrafi)" },
  { value: "Scheherazade New", label: "Scheherazade New (Arab)" },
  { value: "Playfair Display", label: "Playfair Display (Elegan)" },
  { value: "Merriweather", label: "Merriweather" },
  { value: "Lora", label: "Lora" },
  { value: "Cinzel", label: "Cinzel (Klasik)" },
  { value: "Poppins", label: "Poppins (Modern)" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans" },
];

type BgPatternType = "pattern" | "color" | "none";

type ThemeForm = {
  themeBodyBg: string;
  themePrimaryColor: string;
  themeSecondaryColor: string;
  themeFooterBg: string;
  themeFooterText: string;
  themeBodyFont: string;
  themeHeadingFont: string;
  bgPatternType: BgPatternType;
  bgPatternColor: string;
};

export function AdminTampilan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: settings, isLoading } = useGetSettings();

  const updateMutation = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
        toast({ title: "Pengaturan tampilan berhasil disimpan ✓" });
      },
    },
  });

  const [form, setForm] = useState<ThemeForm>({ ...DEFAULTS });

  useEffect(() => {
    if (!settings) return;
    const s = settings as any;
    setForm({
      themeBodyBg: s.themeBodyBg || DEFAULTS.themeBodyBg,
      themePrimaryColor: s.themePrimaryColor || DEFAULTS.themePrimaryColor,
      themeSecondaryColor: s.themeSecondaryColor || DEFAULTS.themeSecondaryColor,
      themeFooterBg: s.themeFooterBg || DEFAULTS.themeFooterBg,
      themeFooterText: s.themeFooterText || DEFAULTS.themeFooterText,
      themeBodyFont: s.themeBodyFont || DEFAULTS.themeBodyFont,
      themeHeadingFont: s.themeHeadingFont || DEFAULTS.themeHeadingFont,
      bgPatternType: (s.bgPatternType as BgPatternType) || DEFAULTS.bgPatternType,
      bgPatternColor: s.bgPatternColor || DEFAULTS.bgPatternColor,
    });
  }, [settings]);

  // Live preview: apply changes immediately as user picks colors/fonts
  useEffect(() => {
    applyThemeSettings(form as any);
  }, [form]);

  const handleSave = () => {
    updateMutation.mutate({ data: form as any });
  };

  const handleReset = () => {
    setForm({ ...DEFAULTS });
    updateMutation.mutate({ data: { ...DEFAULTS } as any });
    toast({ title: "Tampilan direset ke default" });
  };

  if (isLoading) return <div className="p-8 text-center text-gray-400">Memuat...</div>;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Tampilan</h1>
          <p className="text-gray-500 text-sm mt-1">
            Ubah warna dan font website — perubahan langsung terlihat di halaman ini.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm"
          >
            <RotateCcw size={16} /> Reset Default
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            <Save size={18} /> {updateMutation.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>

      {/* Live preview notice */}
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
        <Eye size={16} className="shrink-0" />
        <span>Pratinjau langsung aktif — warna yang Anda pilih langsung diterapkan pada halaman ini tanpa perlu menyimpan terlebih dahulu.</span>
      </div>

      {/* Color — Umum */}
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b pb-3">
          <Palette size={18} className="text-primary" />
          <h2 className="text-lg font-bold text-primary">Warna Tema</h2>
        </div>

        <ColorRow
          label="Warna Latar Halaman"
          description="Warna latar belakang semua halaman website"
          value={form.themeBodyBg}
          onChange={(v) => setForm((f) => ({ ...f, themeBodyBg: v }))}
          defaultValue={DEFAULTS.themeBodyBg}
        />
        <ColorRow
          label="Warna Utama (Primer)"
          description="Warna navigasi, judul, tombol, dan sidebar admin"
          value={form.themePrimaryColor}
          onChange={(v) => setForm((f) => ({ ...f, themePrimaryColor: v }))}
          defaultValue={DEFAULTS.themePrimaryColor}
        />
        <ColorRow
          label="Warna Aksen (Emas)"
          description="Warna aksen dekoratif, garis bawah judul, dan ikon aktif"
          value={form.themeSecondaryColor}
          onChange={(v) => setForm((f) => ({ ...f, themeSecondaryColor: v }))}
          defaultValue={DEFAULTS.themeSecondaryColor}
        />
      </div>

      {/* Color — Footer */}
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b pb-3">
          <Palette size={18} className="text-primary" />
          <h2 className="text-lg font-bold text-primary">Warna Footer</h2>
        </div>

        <ColorRow
          label="Warna Latar Footer"
          description="Warna latar belakang bagian bawah halaman (footer)"
          value={form.themeFooterBg}
          onChange={(v) => setForm((f) => ({ ...f, themeFooterBg: v }))}
          defaultValue={DEFAULTS.themeFooterBg}
        />
        <ColorRow
          label="Warna Teks Footer"
          description="Warna teks dan ikon di dalam footer"
          value={form.themeFooterText}
          onChange={(v) => setForm((f) => ({ ...f, themeFooterText: v }))}
          defaultValue={DEFAULTS.themeFooterText}
        />

        {/* Footer mini preview */}
        <div className="rounded-xl overflow-hidden border border-gray-200">
          <div
            className="px-6 py-4 text-sm"
            style={{
              backgroundColor: form.themeFooterBg,
              color: form.themeFooterText,
            }}
          >
            <div className="font-bold text-base mb-1" style={{ fontFamily: `'${form.themeHeadingFont}', serif` }}>
              Musholla Nurul Iman
            </div>
            <p className="opacity-80 text-xs">Pusat peribadatan dan syiar Islam yang mengedepankan toleransi dan kedamaian.</p>
            <div className="mt-3 pt-3 border-t text-xs opacity-60" style={{ borderColor: form.themeFooterText + "30" }}>
              © 2025 Musholla Nurul Iman. All rights reserved.
            </div>
          </div>
          <div className="text-xs text-center py-1 bg-gray-50 text-gray-400">Pratinjau Footer</div>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b pb-3">
          <Layers size={18} className="text-primary" />
          <h2 className="text-lg font-bold text-primary">Latar Belakang Halaman</h2>
        </div>

        <p className="text-xs text-gray-400 -mt-2">
          Pilih jenis latar belakang yang tampil di seluruh halaman website.
        </p>

        {/* 3 option cards */}
        <div className="grid grid-cols-3 gap-3">
          {/* Motif Geometri */}
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, bgPatternType: "pattern" }))}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all overflow-hidden ${
              form.bgPatternType === "pattern"
                ? "border-primary shadow-md"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {/* Mini pattern preview */}
            <div
              className="w-full h-16 rounded-lg mb-1"
              style={{
                backgroundColor: form.themeBodyBg,
                backgroundImage: "url('/images/pattern-bg.png')",
                backgroundRepeat: "repeat",
                backgroundSize: "80px",
                backgroundBlendMode: "multiply",
              }}
            />
            <Layers size={16} className={form.bgPatternType === "pattern" ? "text-primary" : "text-gray-400"} />
            <span className={`text-xs font-semibold ${form.bgPatternType === "pattern" ? "text-primary" : "text-gray-500"}`}>
              Motif Geometri
            </span>
            {form.bgPatternType === "pattern" && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white fill-current"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            )}
          </button>

          {/* Warna Polos */}
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, bgPatternType: "color" }))}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all overflow-hidden ${
              form.bgPatternType === "color"
                ? "border-primary shadow-md"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div
              className="w-full h-16 rounded-lg mb-1 border border-gray-100"
              style={{ backgroundColor: form.bgPatternColor }}
            />
            <Paintbrush2 size={16} className={form.bgPatternType === "color" ? "text-primary" : "text-gray-400"} />
            <span className={`text-xs font-semibold ${form.bgPatternType === "color" ? "text-primary" : "text-gray-500"}`}>
              Warna Polos
            </span>
            {form.bgPatternType === "color" && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white fill-current"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            )}
          </button>

          {/* Tanpa Motif */}
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, bgPatternType: "none" }))}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all overflow-hidden ${
              form.bgPatternType === "none"
                ? "border-primary shadow-md"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div
              className="w-full h-16 rounded-lg mb-1 border border-gray-100 flex items-center justify-center"
              style={{ backgroundColor: form.themeBodyBg }}
            >
              <ImageOff size={22} className="text-gray-300" />
            </div>
            <ImageOff size={16} className={form.bgPatternType === "none" ? "text-primary" : "text-gray-400"} />
            <span className={`text-xs font-semibold ${form.bgPatternType === "none" ? "text-primary" : "text-gray-500"}`}>
              Tanpa Motif
            </span>
            {form.bgPatternType === "none" && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white fill-current"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            )}
          </button>
        </div>

        {/* Color picker — only shown for "color" mode */}
        {form.bgPatternType === "color" && (
          <div className="pt-2">
            <ColorRow
              label="Pilih Warna Latar"
              description="Warna solid yang digunakan sebagai latar belakang seluruh halaman"
              value={form.bgPatternColor}
              onChange={(v) => setForm(f => ({ ...f, bgPatternColor: v }))}
              defaultValue={DEFAULTS.bgPatternColor}
            />
          </div>
        )}
      </div>

      {/* Fonts */}
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b pb-3">
          <Type size={18} className="text-primary" />
          <h2 className="text-lg font-bold text-primary">Font</h2>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Font Konten (Body)</label>
          <p className="text-xs text-gray-400 mb-2">Digunakan untuk paragraf, deskripsi, dan teks umum di seluruh halaman</p>
          <select
            value={form.themeBodyFont}
            onChange={(e) => setForm((f) => ({ ...f, themeBodyFont: e.target.value }))}
            className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none bg-white"
          >
            {BODY_FONTS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <div
            className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600"
            style={{ fontFamily: `'${form.themeBodyFont}', sans-serif` }}
          >
            Contoh teks konten — Musholla Nurul Iman menyambut jemaah dari seluruh penjuru.
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Font Judul (Heading)</label>
          <p className="text-xs text-gray-400 mb-2">Digunakan untuk judul bagian, nama musholla, dan heading utama</p>
          <select
            value={form.themeHeadingFont}
            onChange={(e) => setForm((f) => ({ ...f, themeHeadingFont: e.target.value }))}
            className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none bg-white"
          >
            {HEADING_FONTS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <div
            className="mt-2 p-3 bg-gray-50 rounded-lg text-xl font-bold"
            style={{ fontFamily: `'${form.themeHeadingFont}', serif`, color: form.themePrimaryColor }}
          >
            Selamat Datang di Musholla Nurul Iman
          </div>
        </div>
      </div>

      {/* Save button (bottom) */}
      <div className="flex justify-end pb-12">
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          <Save size={20} /> {updateMutation.isPending ? "Menyimpan..." : "Simpan Pengaturan Tampilan"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Color row component
// ---------------------------------------------------------------------------
function ColorRow({
  label,
  description,
  value,
  onChange,
  defaultValue,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  defaultValue: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-gray-400 mt-0.5">{description}</div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {/* Color swatch + native picker */}
        <label
          className="w-10 h-10 rounded-xl border-2 border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition-shadow overflow-hidden relative"
          title="Pilih warna"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
        {/* Hex input */}
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
          }}
          className="w-28 border rounded-lg px-3 py-1.5 text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none uppercase"
          maxLength={7}
          placeholder="#000000"
        />
        {/* Reset to default */}
        <button
          type="button"
          onClick={() => onChange(defaultValue)}
          title="Reset ke default"
          className="text-xs text-gray-400 hover:text-primary transition-colors"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
