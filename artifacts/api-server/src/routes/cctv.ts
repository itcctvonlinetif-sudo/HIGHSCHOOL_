import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, cctvTable, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/cctv", async (req, res) => {
  try {
    const cameras = await db.select().from(cctvTable).orderBy(cctvTable.order);
    res.json(cameras);
  } catch (err) {
    req.log.error({ err }, "Failed to get CCTV cameras");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/cctv", async (req, res) => {
  try {
    const { name, location, streamUrl, embedUrl, isActive, order, description } = req.body;
    const [camera] = await db.insert(cctvTable).values({
      name, location, streamUrl,
      embedUrl: embedUrl ?? null,
      isActive: isActive ?? true,
      order: order ?? 0,
      description: description ?? null,
    }).returning();
    res.status(201).json(camera);
  } catch (err) {
    req.log.error({ err }, "Failed to create CCTV camera");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/cctv/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, location, streamUrl, embedUrl, isActive, order, description } = req.body;
    const [camera] = await db.update(cctvTable)
      .set({ name, location, streamUrl, embedUrl: embedUrl ?? null, isActive, order, description: description ?? null })
      .where(eq(cctvTable.id, id))
      .returning();
    if (!camera) return res.status(404).json({ error: "Camera not found" });
    res.json(camera);
  } catch (err) {
    req.log.error({ err }, "Failed to update CCTV camera");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/cctv/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(cctvTable).where(eq(cctvTable.id, id));
    res.json({ success: true, message: "Camera deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete CCTV camera");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/cctv/access-settings", async (req, res) => {
  try {
    const rows = await db.select().from(settingsTable);
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    res.json({
      cctvPageTitle: map["cctvPageTitle"] ?? "Live CCTV",
      cctvPageDescription: map["cctvPageDescription"] ?? "Pantauan langsung area musholla",
      hasPassword: !!(map["cctvAccessPasswordHash"]),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get CCTV access settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/cctv/verify-password", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, message: "Password diperlukan" });
    const rows = await db.select().from(settingsTable);
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    const hash = map["cctvAccessPasswordHash"] ?? "";
    if (!hash) {
      return res.json({ success: true, message: "Akses diberikan" });
    }
    const valid = await bcrypt.compare(password, hash);
    if (!valid) return res.status(401).json({ success: false, message: "Password salah" });
    res.json({ success: true, message: "Akses diberikan" });
  } catch (err) {
    req.log.error({ err }, "Failed to verify CCTV password");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
