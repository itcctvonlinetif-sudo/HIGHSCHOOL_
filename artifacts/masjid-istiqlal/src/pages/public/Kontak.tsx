import { useState } from "react";
import { useGetSettings } from "@workspace/api-client-react";
import { MapPin, Phone, Mail, Clock, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Kontak() {
  const { data: settings } = useGetSettings();

  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setStatusMsg("");
    try {
      const r = await fetch(`${BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (r.ok && d.success) {
        setStatus("success");
        setStatusMsg(d.message);
        setForm({ name: "", email: "", whatsapp: "", subject: "", message: "" });
      } else {
        setStatus("error");
        setStatusMsg(d.message || "Terjadi kesalahan. Silakan coba lagi.");
      }
    } catch {
      setStatus("error");
      setStatusMsg("Tidak dapat menghubungi server. Silakan coba beberapa saat lagi.");
    }
  };

  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="bg-primary pt-20 pb-12 px-4 mb-12">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">Hubungi Kami</h1>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">Kami senantiasa terbuka untuk melayani pertanyaan, masukan, dan kebutuhan informasi Anda terkait Musholla Nurul Iman.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Info Cards */}
          <div className="space-y-6">
            <h2 className="font-display text-3xl font-bold text-primary mb-8">Informasi Kontak</h2>
            
            <div className="flex items-start gap-6 p-6 bg-white rounded-2xl border border-border shadow-sm">
              <div className="w-14 h-14 bg-secondary/20 text-secondary rounded-xl flex items-center justify-center shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Alamat</h3>
                <p className="text-muted-foreground">{settings?.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-6 p-6 bg-white rounded-2xl border border-border shadow-sm">
              <div className="w-14 h-14 bg-secondary/20 text-secondary rounded-xl flex items-center justify-center shrink-0">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Telepon</h3>
                <p className="text-muted-foreground">{settings?.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-6 p-6 bg-white rounded-2xl border border-border shadow-sm">
              <div className="w-14 h-14 bg-secondary/20 text-secondary rounded-xl flex items-center justify-center shrink-0">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Email</h3>
                <p className="text-muted-foreground">{settings?.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-6 p-6 bg-white rounded-2xl border border-border shadow-sm">
              <div className="w-14 h-14 bg-secondary/20 text-secondary rounded-xl flex items-center justify-center shrink-0">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Jam Operasional Kantor</h3>
                <p className="text-muted-foreground">Senin - Jumat: 08:00 - 16:00 WIB</p>
                <p className="text-muted-foreground mt-1 text-sm italic">Area ibadah buka 24 jam</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white p-8 rounded-3xl border border-border shadow-lg">
            <h2 className="font-display text-3xl font-bold text-primary mb-8">Kirim Pesan</h2>

            {status === "success" ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle size={40} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-700">Pesan Terkirim!</h3>
                <p className="text-muted-foreground max-w-sm">{statusMsg}</p>
                <button
                  onClick={() => setStatus("idle")}
                  className="mt-4 px-6 py-2.5 border border-primary text-primary rounded-xl font-semibold hover:bg-primary/5 transition-all"
                >
                  Kirim Pesan Lain
                </button>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                {status === "error" && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{statusMsg}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-foreground">Nama Lengkap</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="Masukkan nama..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-foreground">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({...form, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="alamat@email.com"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Nomor WhatsApp <span className="text-muted-foreground font-normal">(opsional)</span></label>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={e => setForm({...form, whatsapp: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="Contoh: 08123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Subjek</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={e => setForm({...form, subject: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="Tujuan pesan..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Pesan</label>
                  <textarea
                    rows={5}
                    value={form.message}
                    onChange={e => setForm({...form, message: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                    placeholder="Tuliskan pesan Anda di sini..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {status === "sending" ? (
                    <><Loader2 size={20} className="animate-spin" /> Mengirim...</>
                  ) : (
                    <><Send size={20} /> Kirim Pesan</>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Google Maps */}
        {(settings as any)?.mapUrl && (
          <div className="mt-16">
            <div className="mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-primary">Lokasi Kami</h2>
                <p className="text-muted-foreground text-sm">Temukan kami di Google Maps</p>
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden border border-border shadow-lg h-96 md:h-[480px]">
              <iframe
                src={(settings as any).mapUrl}
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
                title="Peta Lokasi Musholla Nurul Iman"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
