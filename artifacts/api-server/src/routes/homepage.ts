import { Router } from "express";
import { db, homepageSectionsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router = Router();

const DEFAULT_SECTIONS = [
  { type: "news", title: "Kabar Terbaru", subtitle: "Informasi terkini seputar kegiatan dan perkembangan musholla.", isVisible: true, order: 1, config: JSON.stringify({ count: 3, bgColor: "muted" }) },
  { type: "events", title: "Agenda Kegiatan", subtitle: "Jadwal kegiatan dan program musholla yang akan datang.", isVisible: true, order: 2, config: JSON.stringify({ count: 3 }) },
];

async function ensureDefaults() {
  const existing = await db.select().from(homepageSectionsTable);
  if (existing.length === 0) {
    await db.insert(homepageSectionsTable).values(DEFAULT_SECTIONS);
  }
}

router.get("/homepage-sections", async (req, res) => {
  try {
    await ensureDefaults();
    const sections = await db.select().from(homepageSectionsTable).orderBy(asc(homepageSectionsTable.order));
    res.json(sections);
  } catch (err) {
    req.log.error({ err }, "Failed to get homepage sections");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/homepage-sections", async (req, res) => {
  try {
    const { type, title, subtitle, isVisible, order, config } = req.body;
    const [section] = await db.insert(homepageSectionsTable).values({
      type,
      title,
      subtitle: subtitle ?? null,
      isVisible: isVisible ?? true,
      order: order ?? 0,
      config: typeof config === "string" ? config : JSON.stringify(config ?? {}),
    }).returning();
    res.status(201).json(section);
  } catch (err) {
    req.log.error({ err }, "Failed to create homepage section");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/homepage-sections/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { type, title, subtitle, isVisible, order, config } = req.body;
    const [section] = await db.update(homepageSectionsTable)
      .set({
        type,
        title,
        subtitle: subtitle ?? null,
        isVisible,
        order,
        config: typeof config === "string" ? config : JSON.stringify(config ?? {}),
      })
      .where(eq(homepageSectionsTable.id, id))
      .returning();
    if (!section) return res.status(404).json({ error: "Section not found" });
    res.json(section);
  } catch (err) {
    req.log.error({ err }, "Failed to update homepage section");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/homepage-sections/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(homepageSectionsTable).where(eq(homepageSectionsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete homepage section");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/homepage-sections-reorder", async (req, res) => {
  try {
    const { sections } = req.body as { sections: Array<{ id: number; order: number }> };
    for (const s of sections) {
      await db.update(homepageSectionsTable).set({ order: s.order }).where(eq(homepageSectionsTable.id, s.id));
    }
    const updated = await db.select().from(homepageSectionsTable).orderBy(asc(homepageSectionsTable.order));
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to reorder homepage sections");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
