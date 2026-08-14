import { useGetNews, useGetEvents, useGetGallery, useGetCctvCameras } from "@workspace/api-client-react";
import { Newspaper, Calendar, Image as ImageIcon, Video, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function AdminDashboard() {
  const { data: news } = useGetNews();
  const { data: events } = useGetEvents();
  const { data: gallery } = useGetGallery();
  const { data: cctv } = useGetCctvCameras();

  const stats = [
    { label: "Total Berita", value: news?.length || 0, icon: Newspaper, color: "bg-blue-50 text-blue-600", border: "border-blue-100", link: "/admin/berita" },
    { label: "Total Kegiatan", value: events?.length || 0, icon: Calendar, color: "bg-green-50 text-green-600", border: "border-green-100", link: "/admin/kegiatan" },
    { label: "Foto Galeri", value: gallery?.length || 0, icon: ImageIcon, color: "bg-purple-50 text-purple-600", border: "border-purple-100", link: "/admin/galeri" },
    { label: "Kamera CCTV", value: cctv?.length || 0, icon: Video, color: "bg-orange-50 text-orange-600", border: "border-orange-100", link: "/admin/cctv" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Ringkasan data website Musholla Nurul Iman</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`bg-white p-6 rounded-2xl border ${stat.border} shadow-sm flex flex-col justify-between`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon size={24} />
                </div>
                <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
              </div>
              <div>
                <p className="text-gray-500 font-medium mb-4">{stat.label}</p>
                <Link href={stat.link} className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                  Kelola Data <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center py-20 mt-12">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} className="w-12 h-12 opacity-50 grayscale" alt="logo" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Selamat Datang di Sistem Manajemen</h2>
        <p className="text-gray-500 max-w-lg mx-auto">Gunakan menu di sidebar kiri untuk mengelola konten website publik. Setiap perubahan akan langsung tampil di halaman depan.</p>
      </div>
    </div>
  );
}
