import { useState, useEffect } from "react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Save, Mail, Send, Eye, EyeOff, CheckCircle, XCircle, Loader2, HardDrive, Cloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MediaUploadInput } from "@/components/MediaUploadInput";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AdminSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: settings, isLoading } = useGetSettings();
  
  const updateMutation = useUpdateSettings({ 
    mutation: { 
      onSuccess: () => { 
        queryClient.invalidateQueries({ queryKey: ["/api/settings"] }); 
        toast({ title: "Pengaturan berhasil disimpan" }); 
      } 
    } 
  });

  const [formData, setFormData] = useState({
    siteName: "", tagline: "", description: "", address: "", 
    phone: "", email: "", mapUrl: "", heroTitle: "", heroSubtitle: "", heroImageUrl: "",
    facebook: "", twitter: "", instagram: "", youtube: ""
  });

  const [emailConfig, setEmailConfig] = useState({
    smtpGmail: "", smtpPassword: "", smtpRecipient: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  // Storage settings state
  const [storageConfig, setStorageConfig] = useState({
    provider: "gcs",
    gdrive: { hasCredentials: false, folderId: "" },
    gdriveScript: { scriptUrl: "", folderId: "" },
    onedrive: { clientId: "", hasClientSecret: false, tenantId: "consumers", folderPath: "mosque-uploads", connected: false },
  });
  const [gdriveNewCredentials, setGdriveNewCredentials] = useState("");
  const [gdriveScriptUrl, setGdriveScriptUrl] = useState("");
  const [gdriveScriptFolderId, setGdriveScriptFolderId] = useState("");
  const [scriptCopied, setScriptCopied] = useState(false);
  const [onedriveFolderId, setOnedriveFolderId] = useState("");
  const [onedriveClientId, setOnedriveClientId] = useState("");
  const [onedriveClientSecret, setOnedriveClientSecret] = useState("");
  const [onedriveTenantId, setOnedriveTenantId] = useState("consumers");
  const [onedriveFolderPath, setOnedriveFolderPath] = useState("mosque-uploads");
  const [storageSaving, setStorageSaving] = useState(false);
  const [storageTesting, setStorageTesting] = useState(false);
  const [storageStatus, setStorageStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [onedriveConnecting, setOnedriveConnecting] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/storage/config`)
      .then(r => r.json())
      .then(d => {
        setStorageConfig(d);
        setOnedriveClientId(d.onedrive?.clientId ?? "");
        setOnedriveTenantId(d.onedrive?.tenantId ?? "consumers");
        setOnedriveFolderPath(d.onedrive?.folderPath ?? "mosque-uploads");
        setOnedriveFolderId(d.gdrive?.folderId ?? "");
        setGdriveScriptUrl(d.gdriveScript?.scriptUrl ?? "");
        setGdriveScriptFolderId(d.gdriveScript?.folderId ?? "");
      })
      .catch(() => {});
  }, []);

  const handleSaveStorage = async () => {
    setStorageSaving(true);
    setStorageStatus(null);
    try {
      const body: any = {
        provider: storageConfig.provider,
        gdrive: { folderId: onedriveFolderId },
        gdriveScript: { scriptUrl: gdriveScriptUrl.trim(), folderId: gdriveScriptFolderId.trim() },
        onedrive: {
          clientId: onedriveClientId,
          tenantId: onedriveTenantId || "consumers",
          folderPath: onedriveFolderPath || "mosque-uploads",
        },
      };
      if (gdriveNewCredentials.trim()) {
        body.gdrive.credentials = gdriveNewCredentials.trim();
      }
      if (onedriveClientSecret.trim()) {
        body.onedrive.clientSecret = onedriveClientSecret.trim();
      }
      const r = await fetch(`${BASE}/api/storage/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      setStorageConfig(d);
      setGdriveNewCredentials("");
      setOnedriveClientSecret("");
      toast({ title: "Pengaturan penyimpanan disimpan" });
    } catch {
      toast({ title: "Gagal menyimpan pengaturan penyimpanan", variant: "destructive" });
    } finally {
      setStorageSaving(false);
    }
  };

  const handleTestStorage = async () => {
    setStorageTesting(true);
    setStorageStatus(null);
    try {
      const r = await fetch(`${BASE}/api/storage/test-connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: storageConfig.provider }),
      });
      const d = await r.json();
      setStorageStatus({ ok: d.success, msg: d.message });
    } catch {
      setStorageStatus({ ok: false, msg: "Gagal menghubungi server" });
    } finally {
      setStorageTesting(false);
    }
  };

  const handleConnectOneDrive = () => {
    const w = window.open(`${BASE}/api/storage/onedrive/connect`, "_blank", "width=600,height=700");
    setOnedriveConnecting(true);
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "onedrive-auth-success") {
        window.removeEventListener("message", handler);
        setOnedriveConnecting(false);
        setStorageConfig(prev => ({ ...prev, onedrive: { ...prev.onedrive, connected: true } }));
        toast({ title: "OneDrive berhasil dihubungkan ✓" });
      } else if (e.data?.type === "onedrive-auth-error") {
        window.removeEventListener("message", handler);
        setOnedriveConnecting(false);
        toast({ title: `Gagal menghubungkan OneDrive: ${e.data.error}`, variant: "destructive" });
      }
    };
    window.addEventListener("message", handler);
    const checkClosed = setInterval(() => {
      if (w?.closed) { clearInterval(checkClosed); setOnedriveConnecting(false); window.removeEventListener("message", handler); }
    }, 1000);
  };

  const handleDisconnectOneDrive = async () => {
    await fetch(`${BASE}/api/storage/onedrive/disconnect`, { method: "DELETE" });
    setStorageConfig(prev => ({ ...prev, onedrive: { ...prev.onedrive, connected: false } }));
    toast({ title: "OneDrive berhasil diputus" });
  };

  useEffect(() => {
    fetch(`${BASE}/api/email-config`)
      .then(r => r.json())
      .then(d => {
        setEmailConfig({
          smtpGmail: d.smtpGmail || "",
          smtpPassword: d.smtpPassword || "",
          smtpRecipient: d.smtpRecipient || "",
        });
      })
      .catch(() => {});
  }, []);

  const handleSaveEmail = async () => {
    setEmailSaving(true);
    setEmailStatus(null);
    try {
      const r = await fetch(`${BASE}/api/email-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailConfig),
      });
      const d = await r.json();
      if (r.ok) {
        toast({ title: "Konfigurasi email berhasil disimpan" });
      } else {
        toast({ title: d.message || "Gagal menyimpan", variant: "destructive" });
      }
    } catch {
      toast({ title: "Gagal menyimpan konfigurasi email", variant: "destructive" });
    } finally {
      setEmailSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setEmailTesting(true);
    setEmailStatus(null);
    try {
      const r = await fetch(`${BASE}/api/email-config/test`, { method: "POST" });
      const d = await r.json();
      setEmailStatus({ ok: d.success, msg: d.message });
    } catch {
      setEmailStatus({ ok: false, msg: "Gagal menghubungi server" });
    } finally {
      setEmailTesting(false);
    }
  };

  useEffect(() => {
    if (settings) {
      setFormData({
        siteName: settings.siteName || "", tagline: settings.tagline || "", description: settings.description || "",
        address: settings.address || "", phone: settings.phone || "", email: settings.email || "",
        mapUrl: (settings as any).mapUrl || "",
        heroTitle: settings.heroTitle || "", heroSubtitle: settings.heroSubtitle || "",
        heroImageUrl: (settings as any).heroImageUrl || "",
        facebook: settings.facebook || "", twitter: settings.twitter || "", instagram: settings.instagram || "", youtube: settings.youtube || ""
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ data: formData as any });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Situs</h1>
          <p className="text-gray-500 text-sm">Konfigurasi informasi utama website Musholla Nurul Iman</p>
        </div>
        <button 
          onClick={handleSubmit} 
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          <Save size={20} /> {updateMutation.isPending ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold mb-6 text-primary border-b pb-2">Informasi Utama</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Nama Situs</label>
              <input type="text" value={formData.siteName} onChange={e => setFormData({...formData, siteName: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Tagline Singkat</label>
              <input type="text" value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Deskripsi Singkat (Footer)</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none" required />
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold mb-6 text-primary border-b pb-2">Tampilan Beranda (Hero)</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Judul Utama Beranda</label>
              <input type="text" value={formData.heroTitle} onChange={e => setFormData({...formData, heroTitle: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 font-bold text-lg focus:ring-2 focus:ring-primary/20 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Subjudul Beranda</label>
              <input type="text" value={formData.heroSubtitle} onChange={e => setFormData({...formData, heroSubtitle: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Gambar Latar Beranda</label>
              <MediaUploadInput
                value={formData.heroImageUrl}
                onChange={url => setFormData({...formData, heroImageUrl: url})}
                accept="image/*"
                placeholder="https://contoh.com/gambar.jpg"
              />
              <p className="text-xs text-gray-400 mt-1">Biarkan kosong untuk menggunakan gambar default.</p>
              {formData.heroImageUrl && (
                <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 h-40">
                  <img
                    src={formData.heroImageUrl.startsWith('/api/storage') ? `${BASE}${formData.heroImageUrl}` : formData.heroImageUrl}
                    alt="Preview" className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold mb-6 text-primary border-b pb-2">Informasi Kontak</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Alamat Lengkap</label>
              <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows={2} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Nomor Telepon</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Email Publik</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">URL Embed Google Maps</label>
              <input
                type="text"
                value={formData.mapUrl}
                onChange={e => setFormData({...formData, mapUrl: e.target.value})}
                className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none font-mono text-sm"
                placeholder="https://maps.google.com/maps?q=...&output=embed"
              />
              <p className="text-xs text-gray-400 mt-1">
                Cara mendapatkan URL: Buka Google Maps → cari lokasi → klik Bagikan → pilih tab <strong>Sematkan peta</strong> → salin URL dari atribut <code>src</code> iframe.
              </p>
              {formData.mapUrl && (
                <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 h-48">
                  <iframe
                    src={formData.mapUrl}
                    className="w-full h-full border-0"
                    loading="lazy"
                    allowFullScreen
                    title="Preview Peta"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email Config */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between border-b pb-2 mb-6">
            <div className="flex items-center gap-2">
              <Mail size={18} className="text-primary" />
              <h2 className="text-lg font-bold text-primary">Konfigurasi Email Gmail</h2>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={emailTesting || !emailConfig.smtpGmail}
                className="flex items-center gap-2 border border-primary text-primary px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/5 transition-all disabled:opacity-40"
              >
                {emailTesting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Kirim Test Email
              </button>
              <button
                type="button"
                onClick={handleSaveEmail}
                disabled={emailSaving}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {emailSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Simpan Email
              </button>
            </div>
          </div>

          {emailStatus && (
            <div className={`flex items-start gap-3 p-4 rounded-xl mb-6 text-sm ${emailStatus.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
              {emailStatus.ok ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <XCircle size={18} className="shrink-0 mt-0.5" />}
              <span>{emailStatus.msg}</span>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
            <p className="font-semibold mb-1">⚠️ Cara mendapatkan App Password Gmail:</p>
            <ol className="list-decimal list-inside space-y-1 text-amber-700">
              <li>Aktifkan <strong>Verifikasi 2 Langkah</strong> di akun Google Anda</li>
              <li>Buka <strong>myaccount.google.com → Keamanan → App passwords</strong></li>
              <li>Buat App Password baru (pilih "Mail" dan "Other")</li>
              <li>Salin 16 karakter yang dihasilkan dan tempelkan di field "App Password" di bawah</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Alamat Gmail Pengirim</label>
              <input
                type="email"
                value={emailConfig.smtpGmail}
                onChange={e => setEmailConfig({...emailConfig, smtpGmail: e.target.value})}
                className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="namaanda@gmail.com"
              />
              <p className="text-xs text-gray-400 mt-1">Email ini akan digunakan sebagai pengirim semua email dari website.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">App Password Gmail</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={emailConfig.smtpPassword}
                  onChange={e => setEmailConfig({...emailConfig, smtpPassword: e.target.value})}
                  className="w-full border rounded-xl px-4 py-2.5 pr-12 focus:ring-2 focus:ring-primary/20 outline-none font-mono tracking-widest"
                  placeholder="xxxx xxxx xxxx xxxx"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Masukkan App Password 16 karakter (bukan password Gmail biasa). Spasi diabaikan.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Email Penerima Pesan Kontak</label>
              <input
                type="email"
                value={emailConfig.smtpRecipient}
                onChange={e => setEmailConfig({...emailConfig, smtpRecipient: e.target.value})}
                className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="admin@istiqlal.or.id"
              />
              <p className="text-xs text-gray-400 mt-1">Email yang akan menerima pesan dari formulir kontak website. Biarkan kosong untuk menggunakan Gmail pengirim.</p>
            </div>
          </div>
        </div>

        {/* Social */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold mb-6 text-primary border-b pb-2">Tautan Sosial Media</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">URL Facebook</label>
              <input type="url" value={formData.facebook} onChange={e => setFormData({...formData, facebook: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none" placeholder="https://facebook.com/..." />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">URL Instagram</label>
              <input type="url" value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none" placeholder="https://instagram.com/..." />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">URL Twitter / X</label>
              <input type="url" value={formData.twitter} onChange={e => setFormData({...formData, twitter: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none" placeholder="https://twitter.com/..." />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">URL YouTube</label>
              <input type="url" value={formData.youtube} onChange={e => setFormData({...formData, youtube: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none" placeholder="https://youtube.com/..." />
            </div>
          </div>
        </div>

      </form>

      {/* Storage Settings - outside main form, has its own save */}
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm mb-20">
        <div className="flex items-center justify-between border-b pb-2 mb-6">
          <div className="flex items-center gap-2">
            <HardDrive size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-primary">Penyimpanan Media</h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTestStorage}
              disabled={storageTesting}
              className="flex items-center gap-2 border border-primary text-primary px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/5 transition-all disabled:opacity-40"
            >
              {storageTesting ? <Loader2 size={15} className="animate-spin" /> : <Cloud size={15} />}
              Tes Koneksi
            </button>
            <button
              type="button"
              onClick={handleSaveStorage}
              disabled={storageSaving}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {storageSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Simpan
            </button>
          </div>
        </div>

        {storageStatus && (
          <div className={`flex items-start gap-3 p-4 rounded-xl mb-6 text-sm ${storageStatus.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
            {storageStatus.ok ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <XCircle size={18} className="shrink-0 mt-0.5" />}
            <span>{storageStatus.msg}</span>
          </div>
        )}

        {/* Provider selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-3">Provider Penyimpanan</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "gcs", label: "Replit GCS", desc: "Default, langsung aktif", badge: null },
              { key: "gdrive_script", label: "Google Drive", desc: "Via Apps Script — mudah, tanpa Cloud Console", badge: "Direkomendasikan" },
              { key: "gdrive", label: "Google Drive (Service Account)", desc: "Perlu Google Cloud Console", badge: null },
              { key: "onedrive", label: "OneDrive", desc: "Akun pribadi Microsoft", badge: null },
            ].map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStorageConfig(p => ({ ...p, provider: opt.key }))}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  storageConfig.provider === opt.key
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm">{opt.label}</span>
                  {opt.badge && <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">{opt.badge}</span>}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                {storageConfig.provider === opt.key && (
                  <div className="mt-2 text-xs font-semibold text-primary">✓ Aktif</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* GCS info */}
        {storageConfig.provider === "gcs" && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
            <p className="font-semibold mb-1">Replit GCS (Google Cloud Storage)</p>
            <p>Storage ini dikelola otomatis oleh Replit. Tidak perlu konfigurasi tambahan. File disimpan di bucket GCS privat yang terhubung ke project ini.</p>
          </div>
        )}

        {/* Google Drive via Apps Script config */}
        {storageConfig.provider === "gdrive_script" && (
          <div className="space-y-5">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
              <p className="font-semibold mb-2">Cara setup (tanpa Google Cloud Console):</p>
              <ol className="list-decimal list-inside space-y-1 text-green-700">
                <li>Buka <strong>Google Drive</strong> → klik tombol <strong>+ Baru</strong> → <strong>Lainnya</strong> → <strong>Google Apps Script</strong></li>
                <li>Hapus semua kode yang ada, lalu <strong>tempel kode script di bawah</strong></li>
                <li>Klik <strong>Deploy</strong> → <strong>New deployment</strong> → pilih <strong>"Web app"</strong></li>
                <li>Set <em>"Execute as"</em>: <strong>Me</strong> | <em>"Who has access"</em>: <strong>Anyone</strong></li>
                <li>Klik <strong>Deploy</strong> → izinkan akses → salin <strong>Web app URL</strong></li>
                <li>Tempel URL tersebut di kolom di bawah, lalu simpan</li>
              </ol>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold">Kode Google Apps Script</label>
                <button
                  type="button"
                  onClick={() => {
                    const code = `function doPost(e) {
  try {
    if (e.postData && e.postData.contents) {
      var params = JSON.parse(e.postData.contents);
      if (params.ping) {
        return ContentService.createTextOutput(JSON.stringify({ success: true, ping: true })).setMimeType(ContentService.MimeType.JSON);
      }
      var fileData = Utilities.base64Decode(params.file);
      var blob = Utilities.newBlob(fileData, params.mimeType, params.fileName);
      var folder;
      if (params.folderId) {
        try { folder = DriveApp.getFolderById(params.folderId); } catch(err) { folder = DriveApp.getRootFolder(); }
      } else {
        folder = DriveApp.getRootFolder();
      }
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        fileId: file.getId(),
        url: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1000'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'No data' })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(code).then(() => {
                        setScriptCopied(true);
                        setTimeout(() => setScriptCopied(false), 2500);
                      });
                    } else {
                      const textarea = document.createElement("textarea");
                      textarea.value = code;
                      textarea.style.position = "fixed";
                      textarea.style.opacity = "0";
                      document.body.appendChild(textarea);
                      textarea.focus();
                      textarea.select();
                      try {
                        document.execCommand("copy");
                        setScriptCopied(true);
                        setTimeout(() => setScriptCopied(false), 2500);
                      } finally {
                        document.body.removeChild(textarea);
                      }
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {scriptCopied ? "✓ Tersalin!" : "Salin Kode"}
                </button>
              </div>
              <pre className="w-full border rounded-xl px-4 py-3 font-mono text-xs bg-gray-900 text-green-300 overflow-x-auto select-all whitespace-pre-wrap">{`function doPost(e) {
  try {
    if (e.postData && e.postData.contents) {
      var params = JSON.parse(e.postData.contents);
      if (params.ping) {
        return ContentService.createTextOutput(
          JSON.stringify({ success: true, ping: true })
        ).setMimeType(ContentService.MimeType.JSON);
      }
      var fileData = Utilities.base64Decode(params.file);
      var blob = Utilities.newBlob(fileData, params.mimeType, params.fileName);
      var folder;
      if (params.folderId) {
        try { folder = DriveApp.getFolderById(params.folderId); }
        catch(err) { folder = DriveApp.getRootFolder(); }
      } else {
        folder = DriveApp.getRootFolder();
      }
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        fileId: file.getId(),
        url: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1000'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: 'No data' })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}`}</pre>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Web App URL (dari Google Apps Script)</label>
              <input
                type="url"
                value={gdriveScriptUrl}
                onChange={e => setGdriveScriptUrl(e.target.value)}
                className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none font-mono text-sm"
                placeholder="https://script.google.com/macros/s/AKfyc.../exec"
              />
              <p className="text-xs text-gray-400 mt-1">URL ini didapat setelah deploy Apps Script sebagai Web app.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Folder ID Google Drive (Opsional)</label>
              <input
                type="text"
                value={gdriveScriptFolderId}
                onChange={e => setGdriveScriptFolderId(e.target.value)}
                className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none font-mono text-sm"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
              />
              <p className="text-xs text-gray-400 mt-1">Folder ID dari URL Google Drive (setelah /folders/). Kosongkan untuk simpan di root My Drive.</p>
            </div>
          </div>
        )}

        {/* Google Drive config */}
        {storageConfig.provider === "gdrive" && (
          <div className="space-y-5">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <p className="font-semibold mb-2">Cara setup Google Drive:</p>
              <ol className="list-decimal list-inside space-y-1 text-amber-700">
                <li>Buka <strong>console.cloud.google.com</strong> → buat project baru</li>
                <li>Aktifkan <strong>Google Drive API</strong> di Library</li>
                <li>Buat <strong>Service Account</strong> (IAM &amp; Admin → Service Accounts)</li>
                <li>Klik service account → tab <strong>Keys</strong> → Add Key → JSON → Download</li>
                <li>Buat folder di Google Drive, klik kanan → Share → tambahkan email service account sebagai Editor</li>
                <li>Salin <strong>Folder ID</strong> dari URL folder (bagian setelah /folders/)</li>
                <li>Tempel JSON key dan Folder ID di bawah, lalu simpan</li>
              </ol>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Service Account JSON {storageConfig.gdrive.hasCredentials && <span className="text-green-600 font-normal">(sudah tersimpan — isi untuk mengganti)</span>}
              </label>
              <textarea
                value={gdriveNewCredentials}
                onChange={e => setGdriveNewCredentials(e.target.value)}
                rows={5}
                className="w-full border rounded-xl px-4 py-2.5 font-mono text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder={'{\n  "type": "service_account",\n  "project_id": "...",\n  "private_key_id": "...",\n  ...\n}'}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Folder ID Google Drive (Opsional)</label>
              <input
                type="text"
                value={onedriveFolderId}
                onChange={e => setOnedriveFolderId(e.target.value)}
                className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none font-mono"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
              />
              <p className="text-xs text-gray-400 mt-1">Kosongkan untuk menyimpan di root My Drive.</p>
            </div>
          </div>
        )}

        {/* OneDrive config */}
        {storageConfig.provider === "onedrive" && (
          <div className="space-y-5">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <p className="font-semibold mb-2">Cara setup OneDrive:</p>
              <ol className="list-decimal list-inside space-y-1 text-amber-700">
                <li>Buka <strong>portal.azure.com</strong> → Azure Active Directory → App registrations</li>
                <li>Klik <strong>New registration</strong> → beri nama app → pilih "Personal Microsoft accounts only"</li>
                <li>Setelah dibuat, salin <strong>Application (client) ID</strong></li>
                <li>Buka tab <strong>Certificates &amp; secrets</strong> → New client secret → salin nilainya</li>
                <li>Buka tab <strong>API permissions</strong> → Add permission → Microsoft Graph → Delegated → <strong>Files.ReadWrite</strong> + <strong>offline_access</strong></li>
                <li>Di tab <strong>Authentication</strong> → Add platform → Web → masukkan Redirect URI:<br />
                  <code className="bg-amber-100 px-1 rounded text-xs break-all">{window.location.origin}/api/storage/onedrive/callback</code>
                </li>
                <li>Isi form di bawah, simpan, lalu klik <strong>Hubungkan OneDrive</strong></li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Application (Client) ID</label>
                <input
                  type="text"
                  value={onedriveClientId}
                  onChange={e => setOnedriveClientId(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2.5 font-mono text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Client Secret {storageConfig.onedrive.hasClientSecret && <span className="text-green-600 font-normal">(sudah tersimpan — isi untuk mengganti)</span>}
                </label>
                <input
                  type="password"
                  value={onedriveClientSecret}
                  onChange={e => setOnedriveClientSecret(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2.5 font-mono text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="isi untuk menyimpan / mengganti"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Tenant ID</label>
                <input
                  type="text"
                  value={onedriveTenantId}
                  onChange={e => setOnedriveTenantId(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2.5 font-mono text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="consumers (untuk akun pribadi)"
                />
                <p className="text-xs text-gray-400 mt-1">Gunakan <code>consumers</code> untuk akun Microsoft pribadi.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Folder Upload di OneDrive</label>
                <input
                  type="text"
                  value={onedriveFolderPath}
                  onChange={e => setOnedriveFolderPath(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="mosque-uploads"
                />
              </div>
            </div>

            <div className={`flex items-center justify-between p-4 rounded-xl border ${storageConfig.onedrive.connected ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
              <div>
                <p className="font-semibold text-sm">{storageConfig.onedrive.connected ? "✓ OneDrive Terhubung" : "OneDrive Belum Dihubungkan"}</p>
                <p className="text-xs text-gray-500 mt-0.5">{storageConfig.onedrive.connected ? "Akun Microsoft sudah terotorisasi" : "Simpan konfigurasi dulu, lalu klik hubungkan"}</p>
              </div>
              {storageConfig.onedrive.connected ? (
                <button
                  type="button"
                  onClick={handleDisconnectOneDrive}
                  className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50"
                >
                  Putus Koneksi
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectOneDrive}
                  disabled={!onedriveClientId || onedriveConnecting}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50"
                >
                  {onedriveConnecting ? <Loader2 size={14} className="animate-spin" /> : null}
                  Hubungkan OneDrive
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
