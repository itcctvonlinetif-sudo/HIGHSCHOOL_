import { useGetPages } from "@workspace/api-client-react";

export function Profil() {
  const { data: pages, isLoading } = useGetPages();
  const profilPage = pages?.find(p => p.slug === "profil" && p.isPublished);

  if (isLoading) return <div className="h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  return (
    <div className="bg-white">
      {/* Page Header */}
      <div className="bg-primary pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
            {profilPage?.title || "Profil Musholla Nurul Iman"}
          </h1>
          <div className="w-24 h-1 bg-secondary mx-auto rounded-full"></div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        {profilPage ? (
          <div 
            className="prose prose-lg prose-green max-w-none 
              prose-headings:font-display prose-headings:text-primary 
              prose-p:text-muted-foreground prose-a:text-secondary 
              prose-img:rounded-2xl prose-img:shadow-xl"
            dangerouslySetInnerHTML={{ __html: profilPage.content }}
          />
        ) : (
          <div className="text-center py-20">
            {/* Fallback layout if no page exists */}
            <img src={`${import.meta.env.BASE_URL}images/about-img.png`} alt="About" className="w-full h-[400px] object-cover rounded-3xl shadow-2xl mb-12" />
            <h2 className="font-display text-3xl font-bold text-primary mb-6">Sejarah Singkat</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Musholla Nurul Iman adalah pusat peribadatan nasional negara Republik Indonesia yang terletak di bekas Taman Wilhelmina, di Timur Laut Lapangan Medan Merdeka yang di tengahnya berdiri Monumen Nasional (Monas), di pusat ibukota Jakarta. Musholla ini merupakan salah satu dari 10 tempat ibadah terbesar kapasitasnya di dunia yang dapat menampung lebih dari 200.000 jamaah.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
