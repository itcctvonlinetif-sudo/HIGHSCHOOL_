import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, pagesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/pages", async (req, res) => {
  try {
    const pages = await db.select().from(pagesTable);
    res.json(pages);
  } catch (err) {
    req.log.error({ err }, "Failed to get pages");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/pages/slug/:slug", async (req, res) => {
  try {
    const [page] = await db.select().from(pagesTable)
      .where(and(eq(pagesTable.slug, req.params.slug), eq(pagesTable.isPublished, true)));
    if (!page) return res.status(404).json({ error: "Page not found" });
    const { accessPasswordHash, ...rest } = page;
    res.json({ ...rest, hasPassword: !!accessPasswordHash });
  } catch (err) {
    req.log.error({ err }, "Failed to get page by slug");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/pages/slug/:slug/verify-password", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, message: "Password diperlukan" });
    const [page] = await db.select().from(pagesTable)
      .where(and(eq(pagesTable.slug, req.params.slug), eq(pagesTable.isPublished, true)));
    if (!page) return res.status(404).json({ success: false, message: "Halaman tidak ditemukan" });
    if (!page.accessPasswordHash) return res.json({ success: true });
    const valid = await bcrypt.compare(password, page.accessPasswordHash);
    if (!valid) return res.status(401).json({ success: false, message: "Password salah" });
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to verify page password");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/pages/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [page] = await db.select().from(pagesTable).where(eq(pagesTable.id, id));
    if (!page) return res.status(404).json({ error: "Page not found" });
    const { accessPasswordHash, ...rest } = page;
    res.json({ ...rest, hasPassword: !!accessPasswordHash });
  } catch (err) {
    req.log.error({ err }, "Failed to get page");
    res.status(500).json({ error: "Internal server error" });
  }
});

function safeJsonArray(val: any): string | null {
  if (!val) return null;
  if (typeof val === "string") return val;
  return JSON.stringify(val);
}

router.post("/pages", async (req, res) => {
  try {
    const { title, slug, content, isPublished, imageUrls, websiteUrls, videoUrls, accessPassword } = req.body;
    let accessPasswordHash: string | null = null;
    if (accessPassword) accessPasswordHash = await bcrypt.hash(accessPassword, 10);
    const [page] = await db.insert(pagesTable).values({
      title, slug, content,
      isPublished: isPublished ?? false,
      imageUrls: safeJsonArray(imageUrls),
      websiteUrls: safeJsonArray(websiteUrls),
      videoUrls: safeJsonArray(videoUrls),
      accessPasswordHash,
    }).returning();
    const { accessPasswordHash: _hash, ...rest } = page;
    res.status(201).json({ ...rest, hasPassword: !!_hash });
  } catch (err) {
    req.log.error({ err }, "Failed to create page");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/pages/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, slug, content, isPublished, imageUrls, websiteUrls, videoUrls, accessPassword, removePassword } = req.body;

    const [existing] = await db.select().from(pagesTable).where(eq(pagesTable.id, id));
    if (!existing) return res.status(404).json({ error: "Page not found" });

    let accessPasswordHash = existing.accessPasswordHash;
    if (removePassword) {
      accessPasswordHash = null;
    } else if (accessPassword) {
      accessPasswordHash = await bcrypt.hash(accessPassword, 10);
    }

    const [page] = await db.update(pagesTable)
      .set({
        title, slug, content, isPublished,
        imageUrls: safeJsonArray(imageUrls),
        websiteUrls: safeJsonArray(websiteUrls),
        videoUrls: safeJsonArray(videoUrls),
        accessPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(pagesTable.id, id))
      .returning();
    if (!page) return res.status(404).json({ error: "Page not found" });
    const { accessPasswordHash: _hash, ...rest } = page;
    res.json({ ...rest, hasPassword: !!_hash });
  } catch (err) {
    req.log.error({ err }, "Failed to update page");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/pages/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(pagesTable).where(eq(pagesTable.id, id));
    res.json({ success: true, message: "Page deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete page");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
