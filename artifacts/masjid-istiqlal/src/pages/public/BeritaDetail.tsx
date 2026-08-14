import { useGetNewsById } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { format } from "date-fns";
import { Calendar, User } from "lucide-react";
import { toGDriveImageUrl } from "@/lib/gdrive";

export function BeritaDetail() {
  const [, params] = useRoute("/berita/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  
  const { data: article, isLoading, error } = useGetNewsById(id, { query: { enabled: id > 0 } });

  if (isLoading) return <div className="h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (error || !article) return <div className="py-20 text-center text-destructive">Berita tidak ditemukan.</div>;

  return (
    <article className="bg-background min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-primary mb-6 leading-tight">
          {article.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-10 pb-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-secondary" />
            <span>{format(new Date(article.createdAt), 'EEEE, dd MMMM yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <User size={18} className="text-secondary" />
            <span>Ditulis oleh <strong className="text-foreground">{article.author}</strong></span>
          </div>
        </div>

        {article.imageUrl && (
          <div className="mb-12 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
            <img src={toGDriveImageUrl(article.imageUrl!)} alt={article.title} className="w-full h-auto object-cover max-h-[500px]" />
          </div>
        )}

        <div 
          className="prose prose-lg prose-green max-w-none 
            prose-headings:font-display prose-headings:text-primary 
            prose-p:text-muted-foreground prose-p:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>
    </article>
  );
}
