import { Router } from "express";
import { db, settingsTable, prayerTimesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const DEFAULT_SETTINGS = {
  siteName: "Musholla Nurul Iman",
  tagline: "Pusat Peribadatan Nasional Republik Indonesia",
  description: "Musholla Nurul Iman adalah pusat peribadatan nasional negara Republik Indonesia yang terletak di Jakarta Pusat. Musholla ini merupakan yang terbesar di Asia Tenggara.",
  address: "Jl. Taman Wijaya Kusuma, Jakarta Pusat 10710",
  phone: "(021) 3811493",
  email: "info@istiqlal.or.id",
  facebook: "https://www.facebook.com/MasjidIstiqlal",
  twitter: null,
  instagram: "https://www.instagram.com/masjidistiqlal",
  youtube: "https://www.youtube.com/masjidistiqlal",
  logoUrl: null,
  heroImageUrl: null,
  heroTitle: "Selamat Datang di Musholla Nurul Iman",
  heroSubtitle: "Pusat Peribadatan Nasional Republik Indonesia - Terbesar di Asia Tenggara",
  footerQuickLinksTitle: "Tautan Cepat",
  footerContactTitle: "Kontak Kami",
  footerQuickLinks: JSON.stringify([
    { label: "Beranda", url: "/" },
    { label: "Profil", url: "/profil" },
    { label: "Berita & Artikel", url: "/berita" },
    { label: "Jadwal Kegiatan", url: "/kegiatan" },
    { label: "Live CCTV", url: "/cctv" },
  ]),
  footerCopyright: "All rights reserved.",
  footerShowAdminLink: "true",
};

router.get("/settings", async (req, res) => {
  try {
    const rows = await db.select().from(settingsTable);
    const result: Record<string, string | null> = {};
    for (const row of rows) {
      result[row.key] = row.value === "__null__" ? null : row.value;
    }
    const merged = { ...DEFAULT_SETTINGS, ...result };
    res.json(merged);
  } catch (err) {
    req.log.error({ err }, "Failed to get settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/settings", async (req, res) => {
  try {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      const strVal = value === null ? "__null__" : String(value);
      await db.insert(settingsTable)
        .values({ key, value: strVal })
        .onConflictDoUpdate({ target: settingsTable.key, set: { value: strVal } });
    }
    const rows = await db.select().from(settingsTable);
    const result: Record<string, string | null> = {};
    for (const row of rows) {
      result[row.key] = row.value === "__null__" ? null : row.value;
    }
    res.json({ ...DEFAULT_SETTINGS, ...result });
  } catch (err) {
    req.log.error({ err }, "Failed to update settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/prayer-times", async (req, res) => {
  try {
    const [pt] = await db.select().from(prayerTimesTable);
    if (!pt) {
      const [created] = await db.insert(prayerTimesTable).values({
        fajr: "04:45",
        dhuhr: "12:00",
        asr: "15:15",
        maghrib: "18:05",
        isha: "19:15",
        jumuah: "12:00",
        updatedAt: new Date().toISOString(),
      }).returning();
      return res.json(created);
    }
    res.json(pt);
  } catch (err) {
    req.log.error({ err }, "Failed to get prayer times");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/prayer-times", async (req, res) => {
  try {
    const { fajr, dhuhr, asr, maghrib, isha, jumuah } = req.body;
    const [existing] = await db.select().from(prayerTimesTable);
    let pt;
    if (!existing) {
      [pt] = await db.insert(prayerTimesTable).values({
        fajr, dhuhr, asr, maghrib, isha, jumuah,
        updatedAt: new Date().toISOString(),
      }).returning();
    } else {
      [pt] = await db.update(prayerTimesTable)
        .set({ fajr, dhuhr, asr, maghrib, isha, jumuah, updatedAt: new Date().toISOString() })
        .where(eq(prayerTimesTable.id, existing.id))
        .returning();
    }
    res.json(pt);
  } catch (err) {
    req.log.error({ err }, "Failed to update prayer times");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
