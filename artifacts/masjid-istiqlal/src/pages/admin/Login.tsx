import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { setAuthToken } from "@/lib/auth";
import { Lock, User, Mail, ArrowLeft, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPending, setForgotPending] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  
  const loginMutation = useAdminLogin({
    mutation: {
      onSuccess: (data) => {
        if (data.success && data.token) {
          setAuthToken(data.token);
          toast({ title: "Login Berhasil", description: "Selamat datang di Portal Admin." });
          setLocation("/admin");
        } else {
          toast({ variant: "destructive", title: "Login Gagal", description: data.message });
        }
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message || "Gagal menghubungi server." });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { username, password } });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPending(true);
    setTempPassword(null);
    try {
      const res = await fetch(`${BASE}/api/admin/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Gagal", description: data.message || "Email tidak ditemukan." });
      } else if (data.emailSent) {
        toast({ title: "Email Terkirim", description: `Password baru telah dikirim ke ${forgotEmail}` });
        setShowForgot(false);
        setForgotEmail("");
      } else {
        setTempPassword(data.tempPassword);
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Gagal menghubungi server." });
    } finally {
      setForgotPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/90 z-0"></div>
      <img src={`${import.meta.env.BASE_URL}images/pattern-bg.png`} className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-20 z-0" alt="pattern"/>
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 relative z-10 border border-white/20">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-12 h-12 brightness-0 invert" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Portal Admin</h1>
          <p className="text-gray-500">Musholla Nurul Iman Management System</p>
        </div>

        {!showForgot ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={20} className="text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                    placeholder="admin" 
                    required 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={20} className="text-gray-400" />
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loginMutation.isPending}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loginMutation.isPending ? "Memproses..." : "Masuk ke Sistem"}
              </button>
            </form>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => { setShowForgot(true); setTempPassword(null); }}
                className="text-sm text-primary hover:underline font-medium"
              >
                Lupa Password?
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => { setShowForgot(false); setTempPassword(null); setForgotEmail(""); }}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={16} /> Kembali ke Login
            </button>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Lupa Password</h2>
              <p className="text-gray-500 text-sm">Masukkan email yang terdaftar. Kami akan mengirimkan password baru.</p>
            </div>

            {tempPassword ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                  <p className="text-sm text-green-700 mb-3 font-medium">Password baru Anda:</p>
                  <div className="bg-white border-2 border-green-400 rounded-lg px-4 py-3 font-mono text-xl font-bold text-green-700 tracking-widest select-all">
                    {tempPassword}
                  </div>
                  <p className="text-xs text-green-600 mt-3">Salin password ini, lalu login dan segera ubah password Anda.</p>
                </div>
                <button
                  onClick={() => { setShowForgot(false); setTempPassword(null); setForgotEmail(""); }}
                  className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all"
                >
                  Kembali ke Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Admin Terdaftar</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail size={20} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="admin@istiqlal.or.id"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={forgotPending}
                  className="w-full py-3.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {forgotPending ? (
                    <><RefreshCw size={18} className="animate-spin" /> Memproses...</>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
