import { useState } from "react";
import { KeyRound, Eye, EyeOff, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AdminUbahPassword() {
  const { toast } = useToast();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Password baru dan konfirmasi tidak cocok." });
      return;
    }
    if (form.newPassword.length < 6) {
      toast({ variant: "destructive", title: "Error", description: "Password baru minimal 6 karakter." });
      return;
    }
    setIsPending(true);
    try {
      const res = await fetch(`${BASE}/api/admin/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          oldPassword: form.oldPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Gagal", description: data.message || "Terjadi kesalahan." });
      } else {
        toast({ title: "Berhasil", description: "Password berhasil diubah." });
        setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Gagal menghubungi server." });
    } finally {
      setIsPending(false);
    }
  };

  const InputField = ({
    label, value, onChange, show, onToggle, placeholder,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    onToggle: () => void;
    placeholder: string;
  }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required
          className="w-full pl-4 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ubah Password</h1>
        <p className="text-gray-500 text-sm mt-1">Ganti password akun administrator portal</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <KeyRound size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Keamanan Akun</h2>
            <p className="text-xs text-gray-500">Gunakan password yang kuat dan unik</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <InputField
            label="Password Lama"
            value={form.oldPassword}
            onChange={v => setForm({ ...form, oldPassword: v })}
            show={showOld}
            onToggle={() => setShowOld(p => !p)}
            placeholder="Masukkan password lama"
          />
          <InputField
            label="Password Baru"
            value={form.newPassword}
            onChange={v => setForm({ ...form, newPassword: v })}
            show={showNew}
            onToggle={() => setShowNew(p => !p)}
            placeholder="Minimal 6 karakter"
          />
          <InputField
            label="Konfirmasi Password Baru"
            value={form.confirmPassword}
            onChange={v => setForm({ ...form, confirmPassword: v })}
            show={showConfirm}
            onToggle={() => setShowConfirm(p => !p)}
            placeholder="Ulangi password baru"
          />

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <Save size={18} />
              {isPending ? "Menyimpan..." : "Simpan Password Baru"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">Tips Keamanan:</p>
        <ul className="list-disc list-inside space-y-1 text-amber-700">
          <li>Gunakan minimal 8 karakter</li>
          <li>Kombinasikan huruf besar, kecil, angka, dan simbol</li>
          <li>Jangan gunakan informasi pribadi yang mudah ditebak</li>
        </ul>
      </div>
    </div>
  );
}
