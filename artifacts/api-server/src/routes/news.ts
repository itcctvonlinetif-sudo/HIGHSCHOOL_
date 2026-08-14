import { Router } from "express";
import { db, newsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/news", async (req, res) => {
  try {
    const news = await db.select().from(newsTable).orderBy(newsTable.createdAt);
    res.json(news);
  } catch (err) {
    req.log.error({ err }, "Failed to get news");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/news/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [item] = await db.select().from(newsTable).where(eq(newsTable.id, id));
    if (!item) return res.status(404).json({ error: "News not found" });
    res.json(item);
  } catch (err) {
    req.log.error({ err }, "Failed to get news");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/news", async (req, res) => {
  try {
    const { title, slug, content, excerpt, imageUrl, author, isPublished, publishedAt } = req.body;
    const [item] = await db.insert(newsTable).values({
      title, slug, content, excerpt,
      imageUrl: imageUrl ?? null,
      author,
      isPublished: isPublished ?? false,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
    }).returning();
    res.status(201).json(item);
  } catch (err) {
    req.log.error({ err }, "Failed to create news");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/news/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, slug, content, excerpt, imageUrl, author, isPublished, publishedAt } = req.body;
    const [item] = await db.update(newsTable)
      .set({
        title, slug, content, excerpt,
        imageUrl: imageUrl ?? null,
        author, isPublished,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        updatedAt: new Date(),
      })
      .where(eq(newsTable.id, id))
      .returning();
    if (!item) return res.status(404).json({ error: "News not found" });
    res.json(item);
  } catch (err) {
    req.log.error({ err }, "Failed to update news");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/news/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(newsTable).where(eq(newsTable.id, id));
    res.json({ success: true, message: "News deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete news");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
