import { Router, Request, Response } from "express";

const router = Router();

// Example GET: Fetch all events
router.get("/", async (req: Request, res: Response) => {
  try {
    // In a real app, fetch events from DB
    const patientId = req.headers["x-patient-id"];
    res.json({
      message: "Calendar events fetched successfully",
      patientId,
      events: [
        {
          id: 1,
          title: "Dental Checkup",
          start: new Date(),
          end: new Date(),
        },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Example POST: Add a new event
router.post("/", async (req: Request, res: Response) => {
  try {
    const { title, start, end } = req.body;
    res.json({
      message: "Event created successfully",
      event: { id: Date.now(), title, start, end },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create event" });
  }
});

export default router;
