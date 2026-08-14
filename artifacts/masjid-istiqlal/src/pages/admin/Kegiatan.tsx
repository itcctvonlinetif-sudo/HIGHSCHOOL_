import { useState } from "react";
import { useGetEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function AdminKegiatan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: events, isLoading } = useGetEvents();
  
  const createMutation = useCreateEvent({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/events"] }); toast({ title: "Kegiatan ditambahkan" }); closeForm(); } } });
  const updateMutation = useUpdateEvent({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/events"] }); toast({ title: "Kegiatan diupdate" }); closeForm(); } } });
  const deleteMutation = useDeleteEvent({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/events"] }); toast({ title: "Kegiatan dihapus" }); } } });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Need to format dates for input[type="datetime-local"]
  const toDateTimeLocal = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const defaultForm = { title: "", description: "", location: "Musholla Nurul Iman", startDate: "", endDate: "", isActive: true };
  const [formData, setFormData] = useState(defaultForm);

  const closeForm = () => { setIsFormOpen(false); setEditingId(null); setFormData(defaultForm); };
  const openEdit = (item: any) => { 
    setFormData({ 
      title: item.title, description: item.description, location: item.location, 
      startDate: toDateTimeLocal(item.startDate), 
      endDate: item.endDate ? toDateTimeLocal(item.endDate) : "", 
      isActive: item.isActive 
    }); 
    setEditingId(item.id); setIsFormOpen(true); 
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, endDate: formData.endDate || null };
    // Convert back to ISO string before sending
    payload.startDate = new Date(payload.startDate).toISOString();
    if(payload.endDate) payload.endDate = new Date(payload.endDate).toISOString();
    
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate({ data: payload });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Kegiatan</h1>
        <button onClick={() => { closeForm(); setIsFormOpen(true); }} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
          <Plus size={18} /> Tambah Kegiatan
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xl mb-6">
          <h2 className="text-xl font-bold mb-6">{editingId ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Nama Kegiatan</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Waktu Mulai</label>
                <input type="datetime-local" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full border rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Waktu Selesai (Opsional)</label>
                <input type="datetime-local" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Lokasi</label>
                <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border rounded-lg px-3 py-2" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Deskripsi Singkat</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full border rounded-lg px-3 py-2" required />
              </div>
            </div>
            
            <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-primary rounded" />
              <label htmlFor="isActive" className="text-sm font-medium">Tampilkan di Jadwal</label>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={closeForm} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
              <button type="submit" className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90">{editingId ? "Simpan Perubahan" : "Tambah Kegiatan"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
              <th className="px-6 py-4 font-semibold">Kegiatan</th>
              <th className="px-6 py-4 font-semibold">Waktu Mulai</th>
              <th className="px-6 py-4 font-semibold">Lokasi</th>
              <th className="px-6 py-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={4} className="text-center py-8">Loading...</td></tr> : 
             events?.map((item) => (
              <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50/50 ${!item.isActive ? 'opacity-50' : ''}`}>
                <td className="px-6 py-4 font-medium text-gray-900">{item.title}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{format(new Date(item.startDate), 'dd MMM yyyy HH:mm')}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.location}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-1"><Edit2 size={18} /></button>
                  <button onClick={() => { if(confirm('Hapus kegiatan?')) deleteMutation.mutate({id: item.id}) }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
