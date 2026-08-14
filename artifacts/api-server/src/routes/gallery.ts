import { Router } from "express";
import { db, galleryTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/gallery", async (req, res) => {
  try {
    const items = await db.select().from(galleryTable).orderBy(galleryTable.createdAt);
    res.json(items);
  } catch (err) {
    req.log.error({ err }, "Failed to get gallery");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/gallery", async (req, res) => {
  try {
    const { type, title, imageUrl, category, isActive } = req.body;
    const [item] = await db.insert(galleryTable).values({
      type: type ?? "photo",
      title, imageUrl, category,
      isActive: isActive ?? true,
    }).returning();
    res.status(201).json(item);
  } catch (err) {
    req.log.error({ err }, "Failed to create gallery item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/gallery/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { type, title, imageUrl, category, isActive } = req.body;
    const [item] = await db.update(galleryTable)
      .set({ type, title, imageUrl, category, isActive })
      .where(eq(galleryTable.id, id))
      .returning();
    if (!item) return res.status(404).json({ error: "Gallery item not found" });
    res.json(item);
  } catch (err) {
    req.log.error({ err }, "Failed to update gallery item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/gallery/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(galleryTable).where(eq(galleryTable.id, id));
    res.json({ success: true, message: "Gallery item deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete gallery item");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
