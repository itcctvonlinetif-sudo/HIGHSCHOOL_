import { useState } from "react";
import { useGetNews, useCreateNews, useUpdateNews, useDeleteNews } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { MediaUploadInput } from "@/components/MediaUploadInput";

export function AdminBerita() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: news, isLoading } = useGetNews();
  
  const createMutation = useCreateNews({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/news"] }); toast({ title: "Berita ditambahkan" }); closeForm(); } } });
  const updateMutation = useUpdateNews({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/news"] }); toast({ title: "Berita diupdate" }); closeForm(); } } });
  const deleteMutation = useDeleteNews({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/news"] }); toast({ title: "Berita dihapus" }); } } });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const defaultForm = { title: "", slug: "", content: "", excerpt: "", imageUrl: "", author: "Admin", isPublished: true };
  const [formData, setFormData] = useState(defaultForm);

  const closeForm = () => { setIsFormOpen(false); setEditingId(null); setFormData(defaultForm); };
  const openEdit = (item: any) => { setFormData({ title: item.title, slug: item.slug, content: item.content, excerpt: item.excerpt, imageUrl: item.imageUrl || "", author: item.author, isPublished: item.isPublished }); setEditingId(item.id); setIsFormOpen(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) updateMutation.mutate({ id: editingId, data: formData });
    else createMutation.mutate({ data: formData });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Berita</h1>
        <button onClick={() => { closeForm(); setIsFormOpen(true); }} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
          <Plus size={18} /> Tulis Berita
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xl mb-6">
          <h2 className="text-xl font-bold mb-6">{editingId ? "Edit Berita" : "Tulis Berita Baru"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Judul Berita</label>
                <input type="text" value={formData.title} onChange={e => {
                  const title = e.target.value;
                  if (!editingId) setFormData({...formData, title, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')});
                  else setFormData({...formData, title});
                }} className="w-full border rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Penulis</label>
                <input type="text" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full border rounded-lg px-3 py-2" required />
              </div>
            </div>
            
            <div>
              <MediaUploadInput
                label="Gambar Berita (Opsional)"
                value={formData.imageUrl}
                onChange={url => setFormData({...formData, imageUrl: url})}
                accept="image/*"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Ringkasan (Excerpt)</label>
              <textarea value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} rows={2} className="w-full border rounded-lg px-3 py-2" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Konten Berita (HTML)</label>
              <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} rows={8} className="w-full border rounded-lg px-3 py-2 font-mono text-sm" required />
            </div>
            
            <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
              <input type="checkbox" id="isPublished" checked={formData.isPublished} onChange={e => setFormData({...formData, isPublished: e.target.checked})} className="w-4 h-4 text-primary rounded" />
              <label htmlFor="isPublished" className="text-sm font-medium">Publish langsung</label>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={closeForm} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
              <button type="submit" className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90">{editingId ? "Simpan Perubahan" : "Terbitkan Berita"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
              <th className="px-6 py-4 font-semibold">Judul Berita</th>
              <th className="px-6 py-4 font-semibold">Tanggal</th>
              <th className="px-6 py-4 font-semibold">Penulis</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr> : 
             news?.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {item.title}
                  <div className="text-xs text-gray-400 truncate max-w-xs">{item.excerpt}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{format(new Date(item.createdAt), 'dd MMM yyyy')}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.author}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.isPublished ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-1"><Edit2 size={18} /></button>
                  <button onClick={() => { if(confirm('Hapus berita ini?')) deleteMutation.mutate({id: item.id}) }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
