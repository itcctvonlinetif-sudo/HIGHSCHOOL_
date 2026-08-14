import { useGetEvents } from "@workspace/api-client-react";
import { format } from "date-fns";
import { MapPin, Clock, Calendar as CalendarIcon } from "lucide-react";

export function Kegiatan() {
  const { data: events, isLoading } = useGetEvents();

  if (isLoading) return <div className="h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  const activeEvents = events?.filter(e => e.isActive) || [];

  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="bg-primary pt-20 pb-12 px-4 mb-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">Agenda Kegiatan</h1>
          <p className="text-primary-foreground/80 text-lg">Jadwal kegiatan rutin dan khusus di Musholla Nurul Iman</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="space-y-6">
          {activeEvents.map(event => (
            <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-8 flex flex-col md:flex-row gap-8 hover:shadow-lg transition-shadow">
              
              {/* Date Box */}
              <div className="flex md:flex-col items-center justify-center gap-2 md:gap-0 bg-primary/5 rounded-2xl p-6 md:w-32 shrink-0 border border-primary/10">
                <span className="text-4xl font-display font-bold text-primary">{format(new Date(event.startDate), 'dd')}</span>
                <span className="text-lg font-medium text-secondary">{format(new Date(event.startDate), 'MMMM')}</span>
                <span className="text-sm text-muted-foreground md:mt-2">{format(new Date(event.startDate), 'yyyy')}</span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">{event.title}</h2>
                <p className="text-muted-foreground mb-6">{event.description}</p>
                
                <div className="flex flex-wrap gap-6 text-sm text-foreground/80 bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-primary" />
                    <span className="font-semibold">{format(new Date(event.startDate), 'HH:mm')} WIB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-primary" />
                    <span>{event.location}</span>
                  </div>
                  {event.endDate && (
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={16} className="text-primary" />
                      <span>Selesai: {format(new Date(event.endDate), 'dd MMM yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {activeEvents.length === 0 && (
            <div className="text-center py-20 text-muted-foreground bg-white rounded-2xl border border-border">Belum ada agenda kegiatan.</div>
          )}
        </div>
      </div>
    </div>
  );
}
