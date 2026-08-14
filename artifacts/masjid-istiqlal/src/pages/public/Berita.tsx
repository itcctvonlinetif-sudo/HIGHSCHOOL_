import { useGetNews } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";

export function Berita() {
  const { data: news, isLoading } = useGetNews({ published: true });

  if (isLoading) return <div className="h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="bg-primary pt-20 pb-12 px-4 mb-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">Berita & Artikel</h1>
          <p className="text-primary-foreground/80 text-lg">Informasi terbaru seputar kegiatan Musholla Nurul Iman</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news?.map(item => (
            <Link key={item.id} href={`/berita/${item.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border flex flex-col">
              <div className="h-56 overflow-hidden bg-gray-200 relative">
                {/* Stock image via Unsplash for realistic placeholder if imageUrl is missing */}
                {/* islamic architecture beautiful mosque detail */}
                <img 
                  src={item.imageUrl || "https://images.unsplash.com/photo-1564750975191-0ed807751fdf?w=800&q=80"} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3 text-sm">
                  <span className="text-secondary font-bold bg-secondary/10 px-3 py-1 rounded-full">{format(new Date(item.createdAt), 'dd MMM yyyy')}</span>
                  <span className="text-muted-foreground">{item.author}</span>
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm flex-1">{item.excerpt}</p>
              </div>
            </Link>
          ))}
          {news?.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground">Belum ada berita yang diterbitkan.</div>
          )}
        </div>
      </div>
    </div>
  );
}
