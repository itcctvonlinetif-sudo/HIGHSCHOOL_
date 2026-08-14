import { useState, useEffect } from "react";
import { useGetCctvCameras } from "@workspace/api-client-react";
import { Video, Maximize2, Lock, Eye, EyeOff, LockKeyhole } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const SESSION_KEY = "cctv_access_granted";

interface AccessSettings {
  cctvPageTitle: string;
  cctvPageDescription: string;
  hasPassword: boolean;
}

export function CCTV() {
  const { data: cameras, isLoading } = useGetCctvCameras();
  const [accessSettings, setAccessSettings] = useState<AccessSettings | null>(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/cctv/access-settings`)
      .then(r => r.json())
      .then((data: AccessSettings) => {
        setAccessSettings(data);
        if (!data.hasPassword) {
          setAccessGranted(true);
        } else {
          const stored = sessionStorage.getItem(SESSION_KEY);
          if (stored === "true") setAccessGranted(true);
        }
      })
      .catch(() => setAccessGranted(true));
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/cctv/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem(SESSION_KEY, "true");
        setAccessGranted(true);
      } else {
        setError(data.message || "Password salah");
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setVerifying(false);
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAccessGranted(false);
    setPassword("");
    setError("");
  };

  const pageTitle = accessSettings?.cctvPageTitle || "Live CCTV";
  const pageDesc = accessSettings?.cctvPageDescription || "Pantauan langsung area musholla";

  if (isLoading || accessSettings === null) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!accessGranted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="pt-20 pb-10 px-4 border-b border-gray-200 bg-white text-center shadow-sm">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
          <p className="text-gray-500">{pageDesc}</p>
        </div>

        <div className="flex items-center justify-center px-4 py-20">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 w-full max-w-md text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Lock size={36} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Terlindungi</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Silakan masukkan password warga untuk melihat kamera CCTV.
            </p>

            <form onSubmit={handleVerify} className="text-left space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password Warga</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="Masukkan password..."
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {error && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span>⚠</span> {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-70"
              >
                {verifying ? "Memverifikasi..." : "Akses Kamera"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const activeCameras = Array.isArray(cameras) ? cameras.filter(c => c.isActive).sort((a, b) => a.order - b.order) : [];

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-20">
      <div className="pt-20 pb-12 px-4 border-b border-white/10 bg-black/50">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center text-red-500 animate-pulse">
            <Video size={32} />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-4xl font-bold mb-2">{pageTitle}</h1>
            <p className="text-gray-400">{pageDesc}</p>
          </div>
          {accessSettings?.hasPassword && (
            <button
              onClick={handleLock}
              title="Kunci Akses CCTV"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm text-white transition-all backdrop-blur-sm"
            >
              <LockKeyhole size={16} />
              <span className="hidden sm:inline">Kunci</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {activeCameras.map(camera => (
            <div key={camera.id} className="bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group">
              <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm border border-white/10">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="font-semibold">{camera.name}</span>
                <span className="text-gray-400">| {camera.location}</span>
              </div>

              <button className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-white/20 backdrop-blur-md rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                <Maximize2 size={18} />
              </button>

              <div className="aspect-video w-full bg-gray-800 relative flex items-center justify-center">
                {camera.embedUrl ? (
                  <iframe
                    src={camera.embedUrl}
                    className="absolute inset-0 w-full h-full border-0"
                    allowFullScreen
                    title={camera.name}
                  ></iframe>
                ) : (
                  <div className="text-center text-gray-500">
                    <Video size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Stream URL: {camera.streamUrl}</p>
                    <p className="text-sm mt-2">Embed not configured</p>
                  </div>
                )}
              </div>

              {camera.description && (
                <div className="p-4 bg-gray-900 border-t border-white/5">
                  <p className="text-sm text-gray-400">{camera.description}</p>
                </div>
              )}
            </div>
          ))}
          {activeCameras.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-500">Tidak ada kamera aktif.</div>
          )}
        </div>
      </div>
    </div>
  );
}
