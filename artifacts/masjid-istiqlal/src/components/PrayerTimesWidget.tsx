import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";

const PRAYER_NAMES = ["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya"] as const;
type PrayerName = typeof PRAYER_NAMES[number];


function PrayerIcon({ name }: { name: PrayerName }) {
  if (name === "Subuh") return (
    <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current opacity-90">
      <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
    </svg>
  );
  if (name === "Dzuhur") return (
    <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current opacity-90">
      <circle cx="12" cy="12" r="5"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  );
  if (name === "Ashar") return (
    <svg viewBox="0 0 24 24" className="w-7 h-7 opacity-90">
      <circle cx="12" cy="9" r="4" fill="currentColor"/>
      <path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2M20 12h2M19.07 4.93l-1.41 1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M4 17h16M6 20h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
    </svg>
  );
  if (name === "Maghrib") return (
    <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current opacity-90">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>
      <path d="M4 19h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current opacity-90">
      <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
      <circle cx="17" cy="5" r="1.5" fill="currentColor" opacity="0.7"/>
      <circle cx="20" cy="9" r="1" fill="currentColor" opacity="0.5"/>
    </svg>
  );
}

function parseTime(timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatCountdown(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatHijriMonth(month: number): string {
  const months = [
    "Muharram", "Safar", "Rabi'ul Awal", "Rabi'ul Akhir",
    "Jumadal Ula", "Jumadal Akhirah", "Rajab", "Sya'ban",
    "Ramadan", "Syawal", "Dzulqa'dah", "Dzulhijjah",
  ];
  return months[month - 1] ?? "";
}

const ISLAMIC_DAYS = [
  { name: "Idul Adha 1447 H", hijri: "10 Dzulhijjah 1447 H", date: new Date("2026-06-06") },
  { name: "Tahun Baru Islam 1448 H", hijri: "1 Muharram 1448 H", date: new Date("2026-06-26") },
  { name: "Hari Asyura 1448 H", hijri: "10 Muharram 1448 H", date: new Date("2026-07-05") },
  { name: "Maulid Nabi Muhammad SAW", hijri: "12 Rabi'ul Awal 1448 H", date: new Date("2026-09-13") },
  { name: "Isra Mi'raj 1448 H", hijri: "27 Rajab 1448 H", date: new Date("2027-02-08") },
  { name: "Awal Ramadan 1448 H", hijri: "1 Ramadan 1448 H", date: new Date("2027-02-18") },
  { name: "Idul Fitri 1448 H", hijri: "1 Syawal 1448 H", date: new Date("2027-03-20") },
];

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

interface PrayerData {
  times: Record<PrayerName, string>;
  hijri: { day: string; month: { number: number }; year: string };
  gregorian: { day: string; month: { number: string }; year: string; weekday: { en: string } };
}

export function PrayerTimesWidget() {
  const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
  const [now, setNow] = useState(new Date());
  const [error, setError] = useState(false);

  useEffect(() => {
    const url =
      "https://api.aladhan.com/v1/timingsByCity?city=Jakarta&country=Indonesia&method=11&school=0";
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        const t = json.data?.timings;
        const d = json.data?.date;
        if (!t || !d) { setError(true); return; }
        setPrayerData({
          times: {
            Subuh: t.Fajr,
            Dzuhur: t.Dhuhr,
            Ashar: t.Asr,
            Maghrib: t.Maghrib,
            Isya: t.Isha,
          },
          hijri: d.hijri,
          gregorian: d.gregorian,
        });
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const getNextPrayer = (): { name: PrayerName; msLeft: number } | null => {
    if (!prayerData) return null;
    for (const name of PRAYER_NAMES) {
      const t = parseTime(prayerData.times[name]);
      if (now < t) return { name, msLeft: t.getTime() - now.getTime() };
    }
    const fajrTomorrow = parseTime(prayerData.times["Subuh"]);
    fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);
    return { name: "Subuh", msLeft: fajrTomorrow.getTime() - now.getTime() };
  };

  const next = getNextPrayer();

  const upcomingDays = ISLAMIC_DAYS.filter((d) => {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return d.date >= start;
  }).slice(0, 5);

  const dayOfWeek = DAY_NAMES[now.getDay()];
  const gregDay = now.getDate();
  const gregMonth = MONTH_NAMES[now.getMonth()];
  const gregYear = now.getFullYear();

  const hijriStr = prayerData
    ? `${prayerData.hijri.day} ${formatHijriMonth(prayerData.hijri.month.number)} ${prayerData.hijri.year} H`
    : null;

  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl">
      {/* Prayer Times Card */}
      <div
        className="relative px-6 pt-8 pb-8"
        style={{
          background: "linear-gradient(135deg, #0d3d24 0%, #1a5c38 50%, #0d3d24 100%)",
        }}
      >
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 40px)",
          }}
        />

        <div className="relative">
          {/* Title */}
          <div className="text-center mb-5">
            <h2 className="text-white text-xl md:text-2xl font-bold tracking-wide">
              Waktu Sholat wilayah Jakarta
            </h2>
            <div className="flex justify-center mt-1">
              <div className="h-0.5 w-16 bg-yellow-400 rounded-full" />
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center justify-center gap-1.5 text-white/70 text-sm mb-4">
            <MapPin size={14} />
            <span>Central Jakarta</span>
          </div>

          {/* Countdown */}
          {next && (
            <div className="flex flex-col items-center mb-4">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 text-center">
                <p className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-1">
                  Menuju {next.name}
                </p>
                <p className="text-white text-3xl font-bold font-mono tracking-wider">
                  {formatCountdown(next.msLeft)}
                </p>
              </div>
            </div>
          )}

          {/* Date */}
          <div className="text-center mb-6">
            <p className="text-white/80 text-sm">
              {dayOfWeek}, {gregDay} {gregMonth} {gregYear}
            </p>
            {hijriStr && (
              <p className="text-yellow-400 font-semibold text-sm mt-0.5">{hijriStr}</p>
            )}
          </div>

          {/* Prayer Cards */}
          {error ? (
            <p className="text-white/60 text-center text-sm py-4">
              Gagal memuat jadwal sholat. Periksa koneksi internet.
            </p>
          ) : !prayerData ? (
            <div className="grid grid-cols-5 gap-2">
              {PRAYER_NAMES.map((n) => (
                <div key={n} className="h-24 rounded-2xl bg-white/10 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2 md:gap-3">
              {PRAYER_NAMES.map((name) => {
                const isNext = next?.name === name;
                const prayerTime = parseTime(prayerData.times[name]);
                const isPast = now > prayerTime && !isNext;
                return (
                  <div
                    key={name}
                    className="relative rounded-2xl p-3 flex flex-col items-center gap-2 transition-all duration-500"
                    style={
                      isNext
                        ? {
                            background:
                              "linear-gradient(135deg, #c9920a 0%, #f0c040 50%, #c9920a 100%)",
                            boxShadow: "0 4px 20px rgba(240, 192, 64, 0.4)",
                          }
                        : {
                            background: isPast
                              ? "rgba(255,255,255,0.05)"
                              : "rgba(255,255,255,0.12)",
                          }
                    }
                  >
                    <div className={isNext ? "text-green-900" : "text-white/80"}>
                      <PrayerIcon name={name} />
                    </div>
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isNext ? "text-green-900" : isPast ? "text-white/40" : "text-white/70"
                      }`}
                    >
                      {name}
                    </span>
                    <span
                      className={`text-lg md:text-xl font-bold font-mono ${
                        isNext ? "text-green-900" : isPast ? "text-white/40" : "text-white"
                      }`}
                    >
                      {prayerData.times[name]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Islamic Special Days */}
      <div
        className="px-6 py-6"
        style={{
          background: "linear-gradient(135deg, #0a2e1b 0%, #12422a 100%)",
        }}
      >
        <div className="mb-4">
          <h3 className="text-white font-bold text-lg">Hari Besar Islam</h3>
          <div className="h-0.5 w-12 bg-yellow-400 rounded-full mt-1" />
        </div>

        <div className="space-y-2">
          {upcomingDays.length === 0 ? (
            <p className="text-white/50 text-sm">Tidak ada hari besar yang akan datang.</p>
          ) : (
            upcomingDays.map((day) => {
              const isToday =
                day.date.toDateString() === now.toDateString();
              const dayName = DAY_NAMES[day.date.getDay()];
              const todayStart = new Date(now);
              todayStart.setHours(0, 0, 0, 0);
              const daysLeft = Math.ceil(
                (day.date.getTime() - todayStart.getTime()) / 86400000
              );

              return (
                <div
                  key={day.name}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={
                    isToday
                      ? {
                          background:
                            "linear-gradient(135deg, #c9920a 0%, #f0c040 100%)",
                        }
                      : { background: "rgba(255,255,255,0.07)" }
                  }
                >
                  {/* Date badge */}
                  <div
                    className="flex-shrink-0 text-center rounded-lg px-2.5 py-1.5 min-w-[52px]"
                    style={
                      isToday
                        ? { background: "rgba(0,0,0,0.15)" }
                        : { background: "rgba(240,192,64,0.15)" }
                    }
                  >
                    <p className={`text-xs font-semibold ${isToday ? "text-green-900" : "text-yellow-400"}`}>
                      {dayName.slice(0, 3)}
                    </p>
                    <p className={`text-xl font-bold leading-tight ${isToday ? "text-green-900" : "text-white"}`}>
                      {day.date.getDate()}
                    </p>
                    <p className={`text-xs ${isToday ? "text-green-900/70" : "text-white/50"}`}>
                      {MONTH_NAMES[day.date.getMonth()]}
                    </p>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm leading-tight ${isToday ? "text-green-900" : "text-white"}`}>
                      {day.name}
                    </p>
                    <p className={`text-xs mt-0.5 ${isToday ? "text-green-900/70" : "text-white/50"}`}>
                      {day.hijri}
                    </p>
                  </div>

                  {/* Days left badge */}
                  <div className="flex-shrink-0">
                    {isToday ? (
                      <span className="text-xs font-bold text-green-900 bg-black/10 rounded-full px-2 py-0.5">
                        Hari Ini
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-yellow-400/80 bg-white/5 rounded-full px-2 py-0.5 whitespace-nowrap">
                        {daysLeft} hari lagi
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
