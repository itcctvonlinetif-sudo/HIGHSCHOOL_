import { Router } from "express";
import { db, eventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/events", async (req, res) => {
  try {
    const events = await db.select().from(eventsTable).orderBy(eventsTable.startDate);
    res.json(events);
  } catch (err) {
    req.log.error({ err }, "Failed to get events");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/events", async (req, res) => {
  try {
    const { title, description, location, startDate, endDate, imageUrl, isActive } = req.body;
    const [event] = await db.insert(eventsTable).values({
      title, description, location, startDate,
      endDate: endDate ?? null,
      imageUrl: imageUrl ?? null,
      isActive: isActive ?? true,
    }).returning();
    res.status(201).json(event);
  } catch (err) {
    req.log.error({ err }, "Failed to create event");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/events/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, location, startDate, endDate, imageUrl, isActive } = req.body;
    const [event] = await db.update(eventsTable)
      .set({ title, description, location, startDate, endDate: endDate ?? null, imageUrl: imageUrl ?? null, isActive })
      .where(eq(eventsTable.id, id))
      .returning();
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (err) {
    req.log.error({ err }, "Failed to update event");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/events/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(eventsTable).where(eq(eventsTable.id, id));
    res.json({ success: true, message: "Event deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete event");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
