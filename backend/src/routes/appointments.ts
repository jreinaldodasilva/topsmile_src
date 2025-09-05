// backend/src/routes/appointments.ts
import express from "express";
import { authenticate, authorize, AuthenticatedRequest } from "../middleware/auth";
import { schedulingService } from "../services/schedulingService";
import { AppointmentType } from "../models/AppointmentType";
import { Provider } from "../models/Provider";
import { Appointment } from "../models/Appointment";
import { body, validationResult } from 'express-validator';

const router = express.Router();

// All appointment routes require authentication
router.use(authenticate);

// Get provider availability
router.get("/providers/:providerId/availability", async (req: AuthenticatedRequest, res) => {
  try {
    const providerId = req.params.providerId;
    const { date, appointmentTypeId } = req.query;
    
    if (!date || !appointmentTypeId) {
      return res.status(400).json({ 
        success: false,
        error: "date and appointmentTypeId are required" 
      });
    }

    const targetDate = new Date(date as string);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid date format" 
      });
    }

    const slots = await schedulingService.getAvailableSlots({
      clinicId: req.user!.clinicId!,
      providerId,
      appointmentTypeId: appointmentTypeId as string,
      date: targetDate
    });

    return res.json({ 
      success: true, 
      data: slots 
    });
  } catch (err: any) {
    console.error('Error fetching availability:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Validation for booking appointments
const bookingValidation = [
  body('patientId')
    .isMongoId()
    .withMessage('ID do paciente inválido'),
  
  body('providerId')
    .isMongoId()
    .withMessage('ID do profissional inválido'),
    
  body('appointmentTypeId')
    .isMongoId()
    .withMessage('ID do tipo de agendamento inválido'),
    
  body('scheduledStart')
    .isISO8601()
    .withMessage('Data/hora de início inválida'),
    
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Observações devem ter no máximo 500 caracteres'),
    
  body('priority')
    .optional()
    .isIn(['routine', 'urgent', 'emergency'])
    .withMessage('Prioridade inválida')
];

// Create a new appointment (standard CRUD endpoint)
router.post("/", bookingValidation, async (req: AuthenticatedRequest, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { patientId, providerId, appointmentTypeId, scheduledStart, notes, priority } = req.body;

    const appointment = await schedulingService.createAppointment({
      clinicId: req.user!.clinicId!,
      patientId,
      providerId,
      appointmentTypeId,
      scheduledStart: new Date(scheduledStart),
      notes,
      priority,
      createdBy: req.user!.id
    });

    return res.status(201).json({ 
      success: true, 
      data: appointment 
    });
  } catch (err: any) {
    console.error("Appointment creation error:", err);
    return res.status(400).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Book a new appointment (legacy endpoint)
router.post("/book", bookingValidation, async (req: AuthenticatedRequest, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { patientId, providerId, appointmentTypeId, scheduledStart, notes, priority } = req.body;

    const appointment = await schedulingService.createAppointment({
      clinicId: req.user!.clinicId!,
      patientId,
      providerId,
      appointmentTypeId,
      scheduledStart: new Date(scheduledStart),
      notes,
      priority,
      createdBy: req.user!.id
    });

    return res.status(201).json({ 
      success: true, 
      data: appointment 
    });
  } catch (err: any) {
    console.error("Booking error:", err);
    return res.status(400).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Get appointments for a date range
router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate, providerId, status } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
    }

    const appointments = await schedulingService.getAppointments(
      req.user!.clinicId!,
      start,
      end,
      providerId as string,
      status as string
    );

    return res.json({
      success: true,
      data: appointments
    });
  } catch (err: any) {
    console.error("Error fetching appointments:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Get specific appointment
router.get("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name phone email')
      .populate('provider', 'name specialties')
      .populate('appointmentType', 'name duration color category')
      .populate('createdBy', 'name email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Agendamento não encontrado'
      });
    }

    // Check if user has access to this appointment
    if (appointment.clinic.toString() !== req.user!.clinicId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    return res.json({
      success: true,
      data: appointment
    });
  } catch (err: any) {
    console.error("Error fetching appointment:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Update appointment (general update endpoint)
router.patch("/:id", bookingValidation.map(validation => validation.optional()), async (req: AuthenticatedRequest, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Agendamento não encontrado'
      });
    }

    // Check clinic access
    if (appointment.clinic.toString() !== req.user!.clinicId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    // Update fields
    const updateFields = ['patientId', 'providerId', 'appointmentTypeId', 'scheduledStart', 'scheduledEnd', 'status', 'priority', 'notes'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'scheduledStart' || field === 'scheduledEnd') {
          (appointment as any)[field] = new Date(req.body[field]);
        } else if (field === 'patientId') {
          appointment.patient = req.body[field];
        } else if (field === 'providerId') {
          appointment.provider = req.body[field];
        } else if (field === 'appointmentTypeId') {
          appointment.appointmentType = req.body[field];
        } else {
          (appointment as any)[field] = req.body[field];
        }
      }
    });

    const updatedAppointment = await appointment.save();
    await updatedAppointment.populate([
      { path: 'patient', select: 'name phone email' },
      { path: 'provider', select: 'name specialties' },
      { path: 'appointmentType', select: 'name duration color category' }
    ]);

    return res.json({
      success: true,
      data: updatedAppointment
    });
  } catch (err: any) {
    console.error("Error updating appointment:", err);
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// Update appointment status
router.patch("/:id/status", 
  body('status').isIn(['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']),
  body('cancellationReason').optional().isLength({ max: 500 }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }

      const { status, cancellationReason } = req.body;
      
      const appointment = await Appointment.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Agendamento não encontrado'
        });
      }

      // Check clinic access
      if (appointment.clinic.toString() !== req.user!.clinicId) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      if (status === 'cancelled') {
        const updatedAppointment = await schedulingService.cancelAppointment(
          req.params.id, 
          cancellationReason || 'Cancelado pelo usuário'
        );
        return res.json({
          success: true,
          data: updatedAppointment
        });
      } else {
        appointment.status = status;
        if (status === 'checked_in') {
          appointment.actualStart = new Date();
        } else if (status === 'completed') {
          appointment.actualEnd = new Date();
        }
        
        const updatedAppointment = await appointment.save();
        return res.json({
          success: true,
          data: updatedAppointment
        });
      }
    } catch (err: any) {
      console.error("Error updating appointment status:", err);
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }
);

// Reschedule appointment
router.patch("/:id/reschedule",
  body('newStart').isISO8601().withMessage('Nova data/hora inválida'),
  body('reason').isLength({ min: 1, max: 500 }).withMessage('Motivo é obrigatório e deve ter no máximo 500 caracteres'),
  body('rescheduleBy').isIn(['patient', 'clinic']).withMessage('Tipo de reagendamento inválido'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }

      const { newStart, reason, rescheduleBy } = req.body;

      const updatedAppointment = await schedulingService.rescheduleAppointment(
        req.params.id,
        new Date(newStart),
        reason,
        rescheduleBy
      );

      return res.json({
        success: true,
        data: updatedAppointment
      });
    } catch (err: any) {
      console.error("Error rescheduling appointment:", err);
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
  }
);

// Delete appointment (only for admins)
router.delete("/:id", 
  authorize('super_admin', 'admin'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const appointment = await Appointment.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Agendamento não encontrado'
        });
      }

      // Check clinic access
      if (appointment.clinic.toString() !== req.user!.clinicId) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      await Appointment.findByIdAndDelete(req.params.id);

      return res.json({
        success: true,
        message: 'Agendamento excluído com sucesso'
      });
    } catch (err: any) {
      console.error("Error deleting appointment:", err);
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }
);

export default router;