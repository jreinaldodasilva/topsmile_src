import { Router, Request, Response } from "express";

const router = Router();

// Get calendar events
/**
 * @swagger
 * /api/calendar:
 *   get:
 *     summary: Buscar eventos do calendário
 *     description: Retorna lista de eventos do calendário do paciente
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-patient-id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do paciente
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data de início para filtrar eventos
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data de fim para filtrar eventos
 *     responses:
 *       200:
 *         description: Eventos retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     patientId:
 *                       type: string
 *                     events:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CalendarEvent'
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
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

// Create calendar event
/**
 * @swagger
 * /api/calendar:
 *   post:
 *     summary: Criar evento no calendário
 *     description: Cria um novo evento no calendário
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCalendarEventRequest'
 *     responses:
 *       201:
 *         description: Evento criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     event:
 *                       $ref: '#/components/schemas/CalendarEvent'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
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
