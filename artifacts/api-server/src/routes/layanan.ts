import { Router } from "express";
import { db, layananTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/layanan", async (req, res) => {
  try {
    const items = await db.select().from(layananTable).orderBy(layananTable.order);
    res.json(items);
  } catch (err) {
    req.log.error({ err }, "Failed to get layanan");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/layanan", async (req, res) => {
  try {
    const {
      title, description, icon, linkUrl, order, isActive,
      popupEnabled, popupTitle, popupSubtitle, popupImageUrl,
      popupInstructions, popupHighlightTitle, popupHighlightContent,
    } = req.body;
    const [item] = await db.insert(layananTable).values({
      title, description,
      icon: icon ?? "BookOpen",
      linkUrl: linkUrl ?? null,
      order: order ?? 0,
      isActive: isActive ?? true,
      popupEnabled: popupEnabled ?? false,
      popupTitle: popupTitle ?? null,
      popupSubtitle: popupSubtitle ?? null,
      popupImageUrl: popupImageUrl ?? null,
      popupInstructions: popupInstructions ?? null,
      popupHighlightTitle: popupHighlightTitle ?? null,
      popupHighlightContent: popupHighlightContent ?? null,
    }).returning();
    res.status(201).json(item);
  } catch (err) {
    req.log.error({ err }, "Failed to create layanan");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/layanan/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      title, description, icon, linkUrl, order, isActive,
      popupEnabled, popupTitle, popupSubtitle, popupImageUrl,
      popupInstructions, popupHighlightTitle, popupHighlightContent,
    } = req.body;
    const [item] = await db.update(layananTable)
      .set({
        title, description,
        icon: icon ?? "BookOpen",
        linkUrl: linkUrl ?? null,
        order, isActive,
        popupEnabled: popupEnabled ?? false,
        popupTitle: popupTitle ?? null,
        popupSubtitle: popupSubtitle ?? null,
        popupImageUrl: popupImageUrl ?? null,
        popupInstructions: popupInstructions ?? null,
        popupHighlightTitle: popupHighlightTitle ?? null,
        popupHighlightContent: popupHighlightContent ?? null,
      })
      .where(eq(layananTable.id, id))
      .returning();
    if (!item) return res.status(404).json({ error: "Layanan not found" });
    res.json(item);
  } catch (err) {
    req.log.error({ err }, "Failed to update layanan");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/layanan/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(layananTable).where(eq(layananTable.id, id));
    res.json({ success: true, message: "Layanan deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete layanan");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
