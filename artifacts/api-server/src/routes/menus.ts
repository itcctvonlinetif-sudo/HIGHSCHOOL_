import { Router } from "express";
import { db, menusTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/menus", async (req, res) => {
  try {
    const menus = await db.select().from(menusTable).orderBy(menusTable.order);
    res.json(menus);
  } catch (err) {
    req.log.error({ err }, "Failed to get menus");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/menus", async (req, res) => {
  try {
    const { label, url, order, parentId, isActive } = req.body;
    const [menu] = await db.insert(menusTable).values({
      label,
      url,
      order: order ?? 0,
      parentId: parentId ?? null,
      isActive: isActive ?? true,
    }).returning();
    res.status(201).json(menu);
  } catch (err) {
    req.log.error({ err }, "Failed to create menu");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/menus/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { label, url, order, parentId, isActive } = req.body;
    const [menu] = await db.update(menusTable)
      .set({ label, url, order, parentId: parentId ?? null, isActive })
      .where(eq(menusTable.id, id))
      .returning();
    if (!menu) return res.status(404).json({ error: "Menu not found" });
    res.json(menu);
  } catch (err) {
    req.log.error({ err }, "Failed to update menu");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/menus/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(menusTable).where(eq(menusTable.id, id));
    res.json({ success: true, message: "Menu deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete menu");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
