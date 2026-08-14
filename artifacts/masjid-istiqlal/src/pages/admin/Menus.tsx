import { useState } from "react";
import { useGetMenus, useCreateMenu, useUpdateMenu, useDeleteMenu } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminMenus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: menus, isLoading } = useGetMenus();
  
  const createMutation = useCreateMenu({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/menus"] }); toast({ title: "Menu ditambahkan" }); closeForm(); } } });
  const updateMutation = useUpdateMenu({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/menus"] }); toast({ title: "Menu diupdate" }); closeForm(); } } });
  const deleteMutation = useDeleteMenu({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/menus"] }); toast({ title: "Menu dihapus" }); } } });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ label: "", url: "", order: 0, isActive: true });

  const sortedMenus = [...(menus || [])].sort((a, b) => a.order - b.order);

  const closeForm = () => { setIsFormOpen(false); setEditingId(null); setFormData({ label: "", url: "", order: sortedMenus.length + 1, isActive: true }); };
  const openEdit = (menu: any) => { setFormData({ label: menu.label, url: menu.url, order: menu.order, isActive: menu.isActive }); setEditingId(menu.id); setIsFormOpen(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) updateMutation.mutate({ id: editingId, data: formData });
    else createMutation.mutate({ data: formData });
  };

  const handleReorder = (menu: any, direction: 'up' | 'down') => {
    const currentIndex = sortedMenus.findIndex(m => m.id === menu.id);
    if (direction === 'up' && currentIndex > 0) {
      const prev = sortedMenus[currentIndex - 1];
      updateMutation.mutate({ id: menu.id, data: { ...menu, order: prev.order } });
      updateMutation.mutate({ id: prev.id, data: { ...prev, order: menu.order } });
    } else if (direction === 'down' && currentIndex < sortedMenus.length - 1) {
      const next = sortedMenus[currentIndex + 1];
      updateMutation.mutate({ id: menu.id, data: { ...menu, order: next.order } });
      updateMutation.mutate({ id: next.id, data: { ...next, order: menu.order } });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Menu Navigasi</h1>
        <button onClick={() => { closeForm(); setFormData({...formData, order: sortedMenus.length + 1}); setIsFormOpen(true); }} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
          <Plus size={18} /> Tambah Menu
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
          <h2 className="text-lg font-bold mb-4">{editingId ? "Edit Menu" : "Tambah Menu Baru"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Label (Teks Menu)</label>
                <input type="text" value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} className="w-full border rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL (Path)</label>
                <input type="text" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="/halaman/nama-halaman" required />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Halaman internal: <code className="bg-gray-100 px-1 rounded">/profil</code> · 
                  Halaman statis: <code className="bg-gray-100 px-1 rounded">/halaman/nama-slug</code> · 
                  Link luar: <code className="bg-gray-100 px-1 rounded">https://...</code>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-primary rounded" />
              <label htmlFor="isActive" className="text-sm font-medium">Tampilkan di website</label>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={closeForm} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">{editingId ? "Simpan Perubahan" : "Simpan Baru"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
              <th className="px-6 py-4 font-semibold">Urutan</th>
              <th className="px-6 py-4 font-semibold">Label</th>
              <th className="px-6 py-4 font-semibold">URL</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr> : 
             sortedMenus.map((menu, idx) => (
              <tr key={menu.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleReorder(menu, 'up')} disabled={idx === 0} className="p-1 text-gray-400 hover:text-primary disabled:opacity-30"><ArrowUp size={16} /></button>
                    <button onClick={() => handleReorder(menu, 'down')} disabled={idx === sortedMenus.length - 1} className="p-1 text-gray-400 hover:text-primary disabled:opacity-30"><ArrowDown size={16} /></button>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium">{menu.label}</td>
                <td className="px-6 py-4 text-gray-500 font-mono text-sm">{menu.url}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${menu.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {menu.isActive ? 'Aktif' : 'Draft'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEdit(menu)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-2"><Edit2 size={18} /></button>
                  <button onClick={() => { if(confirm('Yakin ingin menghapus?')) deleteMutation.mutate({id: menu.id}) }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
