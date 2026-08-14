import { useState, useEffect } from "react";
import { useGetPrayerTimes, useUpdatePrayerTimes } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Save, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminJadwal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: times, isLoading } = useGetPrayerTimes();
  
  const updateMutation = useUpdatePrayerTimes({ 
    mutation: { 
      onSuccess: () => { 
        queryClient.invalidateQueries({ queryKey: ["/api/prayer-times"] }); 
        toast({ title: "Jadwal shalat berhasil diperbarui" }); 
      } 
    } 
  });

  const [formData, setFormData] = useState({
    fajr: "", dhuhr: "", asr: "", maghrib: "", isha: "", jumuah: ""
  });

  useEffect(() => {
    if (times) {
      setFormData({
        fajr: times.fajr, dhuhr: times.dhuhr, asr: times.asr, 
        maghrib: times.maghrib, isha: times.isha, jumuah: times.jumuah
      });
    }
  }, [times]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ data: formData });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jadwal Shalat</h1>
          <p className="text-gray-500 text-sm">Update jadwal harian yang tampil di widget beranda</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-primary pointer-events-none">
          <Clock size={200} />
        </div>
        
        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
          <div className="grid grid-cols-2 gap-8">
            {[
              { id: 'fajr', label: 'Subuh' },
              { id: 'dhuhr', label: 'Dzuhur' },
              { id: 'asr', label: 'Ashar' },
              { id: 'maghrib', label: 'Maghrib' },
              { id: 'isha', label: 'Isya' },
              { id: 'jumuah', label: 'Jumat' },
            ].map(prayer => (
              <div key={prayer.id}>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">{prayer.label}</label>
                <div className="relative">
                  <input 
                    type="time" 
                    value={formData[prayer.id as keyof typeof formData]} 
                    onChange={e => setFormData({...formData, [prayer.id]: e.target.value})} 
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-mono text-xl font-bold text-primary focus:border-primary focus:ring-0 outline-none transition-colors" 
                    required 
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-8 mt-8 border-t border-gray-100 flex justify-end">
            <button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 bg-secondary text-primary px-8 py-3 rounded-xl font-bold text-lg hover:bg-secondary/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <Save size={20} /> {updateMutation.isPending ? "Menyimpan..." : "Simpan Jadwal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
