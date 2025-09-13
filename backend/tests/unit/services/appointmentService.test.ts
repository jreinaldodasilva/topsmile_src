import { appointmentService } from '../../../src/services/appointmentService';
import { Appointment } from '../../../src/models/Appointment';
import { Patient } from '../../../src/models/Patient';
import { Provider } from '../../../src/models/Provider';
import { AppointmentType } from '../../../src/models/AppointmentType';
import { createTestUser, createTestClinic } from '../../testHelpers';

describe('AppointmentService', () => {
  let testClinic: any;
  let testUser: any;
  let testPatient: any;
  let testProvider: any;
  let testAppointmentType: any;

  beforeEach(async () => {
    testClinic = await createTestClinic();
    testUser = await createTestUser({ clinic: testClinic._id });

    // Create test patient
    testPatient = await Patient.create({
      name: 'Test Patient',
      phone: '(11) 99999-9999',
      email: 'patient@example.com',
      clinic: testClinic._id,
      status: 'active'
    });

    // Create test provider
    testProvider = await Provider.create({
      name: 'Dr. Test Provider',
      email: 'provider@example.com',
      phone: '(11) 88888-8888',
      clinic: testClinic._id,
      specialties: ['general_dentistry'],
      licenseNumber: 'CRO-12345',
      isActive: true,
      workingHours: {
        monday: { start: '08:00', end: '18:00', isWorking: true },
        tuesday: { start: '08:00', end: '18:00', isWorking: true },
        wednesday: { start: '08:00', end: '18:00', isWorking: true },
        thursday: { start: '08:00', end: '18:00', isWorking: true },
        friday: { start: '08:00', end: '18:00', isWorking: true },
        saturday: { start: '08:00', end: '12:00', isWorking: false },
        sunday: { start: '08:00', end: '12:00', isWorking: false }
      }
    });

    // Create test appointment type
    testAppointmentType = await AppointmentType.create({
      name: 'Consulta Geral',
      duration: 60,
      color: '#3B82F6',
      category: 'consultation',
      clinic: testClinic._id,
      isActive: true
    });
  });

  describe('createAppointment', () => {
    it('should create a new appointment successfully', async () => {
      const appointmentData = {
        patient: testPatient._id.toString(),
        provider: testProvider._id.toString(),
        appointmentType: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T10:00:00Z'),
        scheduledEnd: new Date('2024-01-15T11:00:00Z'),
        notes: 'Primeira consulta',
        priority: 'routine' as const,
        clinic: testClinic._id.toString(),
        createdBy: testUser._id.toString()
      };

      const result = await appointmentService.createAppointment(appointmentData);

      expect(result).toBeDefined();
      expect(result.patient.toString()).toBe(testPatient._id.toString());
      expect(result.provider.toString()).toBe(testProvider._id.toString());
      expect(result.appointmentType.toString()).toBe(testAppointmentType._id.toString());
      expect(result.status).toBe('scheduled');
      expect(result.priority).toBe('routine');
    });

    it('should create appointment with reminders', async () => {
      const appointmentData = {
        patient: testPatient._id.toString(),
        provider: testProvider._id.toString(),
        appointmentType: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T10:00:00Z'),
        scheduledEnd: new Date('2024-01-15T11:00:00Z'),
        remindersSent: {
          confirmation: true,
          reminder24h: false,
          reminder2h: false
        },
        clinic: testClinic._id.toString(),
        createdBy: testUser._id.toString()
      };

      const result = await appointmentService.createAppointment(appointmentData);

      expect(result).toBeDefined();
      expect(result.remindersSent.confirmation).toBe(true);
      expect(result.remindersSent.reminder24h).toBe(false);
    });

    it('should throw error for overlapping appointments', async () => {
      // Create first appointment
      const appointmentData1 = {
        patient: testPatient._id.toString(),
        provider: testProvider._id.toString(),
        appointmentType: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T10:00:00Z'),
        scheduledEnd: new Date('2024-01-15T11:00:00Z'),
        clinic: testClinic._id.toString(),
        createdBy: testUser._id.toString()
      };

      await appointmentService.createAppointment(appointmentData1);

      // Try to create overlapping appointment
      const appointmentData2 = {
        patient: testPatient._id.toString(),
        provider: testProvider._id.toString(),
        appointmentType: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T10:30:00Z'), // Overlaps with first
        scheduledEnd: new Date('2024-01-15T11:30:00Z'),
        clinic: testClinic._id.toString(),
        createdBy: testUser._id.toString()
      };

      await expect(
        appointmentService.createAppointment(appointmentData2)
      ).rejects.toThrow('Horário indisponível');
    });

    it('should validate required fields', async () => {
      const invalidAppointmentData = {
        patient: testPatient._id.toString(),
        provider: testProvider._id.toString(),
        // Missing appointmentType
        scheduledStart: new Date('2024-01-15T10:00:00Z'),
        scheduledEnd: new Date('2024-01-15T11:00:00Z'),
        clinic: testClinic._id.toString(),
        createdBy: testUser._id.toString()
      };

      await expect(
        appointmentService.createAppointment(invalidAppointmentData as any)
      ).rejects.toThrow('Todos os campos obrigatórios devem ser preenchidos');
    });
  });

  describe('getAppointmentById', () => {
    it('should return appointment by ID', async () => {
      const appointmentData = {
        patient: testPatient._id.toString(),
        provider: testProvider._id.toString(),
        appointmentType: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T10:00:00Z'),
        scheduledEnd: new Date('2024-01-15T11:00:00Z'),
        clinic: testClinic._id.toString(),
        createdBy: testUser._id.toString()
      };

      const createdAppointment = await appointmentService.createAppointment(appointmentData);
      const appointmentId = createdAppointment.id;

      const result = await appointmentService.getAppointmentById(appointmentId, testClinic._id.toString());

      expect(result).toBeDefined();
      expect(result!.id).toBe(appointmentId);
      expect(result!.patient._id.toString()).toBe(testPatient._id.toString());
    });

    it('should return null for non-existent appointment', async () => {
      const result = await appointmentService.getAppointmentById('507f1f77bcf86cd799439011', testClinic._id.toString());

      expect(result).toBeNull();
    });
  });

  describe('getAppointments', () => {
    beforeEach(async () => {
      // Create multiple test appointments
      await appointmentService.createAppointment({
        patient: testPatient._id.toString(),
        provider: testProvider._id.toString(),
        appointmentType: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T10:00:00Z'),
        scheduledEnd: new Date('2024-01-15T11:00:00Z'),
        clinic: testClinic._id.toString(),
        createdBy: testUser._id.toString()
      });

      await appointmentService.createAppointment({
        patient: testPatient._id.toString(),
        provider: testProvider._id.toString(),
        appointmentType: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-16T10:00:00Z'),
        scheduledEnd: new Date('2024-01-16T11:00:00Z'),
        clinic: testClinic._id.toString(),
        createdBy: testUser._id.toString()
      });

      // Update the second appointment to confirmed status
      const appointments = await appointmentService.getAppointments(testClinic._id.toString());
      if (appointments[1]) {
        await appointmentService.updateAppointment(appointments[1].id, testClinic._id.toString(), { status: 'confirmed' });
      }
    });

    it('should return appointments for clinic', async () => {
      const result = await appointmentService.getAppointments(testClinic._id.toString());

      expect(result).toBeDefined();
      expect(result.length).toBe(2);
    });

    it('should filter appointments by status', async () => {
      const scheduledAppointments = await appointmentService.getAppointments(testClinic._id.toString(), {
        status: 'scheduled'
      });

      const confirmedAppointments = await appointmentService.getAppointments(testClinic._id.toString(), {
        status: 'confirmed'
      });

      expect(scheduledAppointments.length).toBe(1);
      expect(confirmedAppointments.length).toBe(1);
    });

    it('should filter appointments by date range', async () => {
      const result = await appointmentService.getAppointments(testClinic._id.toString(), {
        startDate: new Date('2024-01-15T00:00:00Z'),
        endDate: new Date('2024-01-15T23:59:59Z')
      });

      expect(result.length).toBe(1);
      expect(result[0].scheduledStart.toISOString().startsWith('2024-01-15')).toBe(true);
    });

    it('should filter appointments by provider', async () => {
      const result = await appointmentService.getAppointments(testClinic._id.toString(), {
        providerId: testProvider._id.toString()
      });

      expect(result.length).toBe(2);
      expect(result[0].provider._id.toString()).toBe(testProvider._id.toString());
    });
  });

  describe('updateAppointment', () => {
    it('should update appointment successfully', async () => {
      const updateAppointmentData = {
        patient: testPatient._id.toString(),
        provider: testProvider._id.toString(),
        appointmentType: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T10:00:00Z'),
        scheduledEnd: new Date('2024-01-15T11:00:00Z'),
        notes: 'Original notes',
        clinic: testClinic._id.toString(),
        createdBy: testUser._id.toString()
      };

      const updateCreatedAppointment = await appointmentService.createAppointment(updateAppointmentData);
      const updateAppointmentId = updateCreatedAppointment.id;

      const updateDataForNotes = {
        notes: 'Updated notes'
      };

      const result = await appointmentService.updateAppointment(updateAppointmentId, testClinic._id.toString(), updateDataForNotes);

      expect(result).toBeDefined();
      expect(result!.notes).toBe('Updated notes');
      expect(result!.status).toBe('scheduled'); // Status doesn't auto-change to confirmed on update
    });

    it('should update appointment time', async () => {
      const timeUpdateAppointmentData = {
        patient: testPatient._id.toString(),
        provider: testProvider._id.toString(),
        appointmentType: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T10:00:00Z'),
        scheduledEnd: new Date('2024-01-15T11:00:00Z'),
        clinic: testClinic._id.toString(),
        createdBy: testUser._id.toString()
      };

      const timeUpdateCreatedAppointment = await appointmentService.createAppointment(timeUpdateAppointmentData);
      const timeUpdateAppointmentId = timeUpdateCreatedAppointment.id;

      const newStartTime = new Date('2024-01-15T14:00:00Z');
      const newEndTime = new Date('2024-01-15T15:00:00Z');

      const timeUpdateData = {
        scheduledStart: newStartTime,
        scheduledEnd: newEndTime
      };

      const result = await appointmentService.updateAppointment(timeUpdateAppointmentId, testClinic._id.toString(), timeUpdateData);

      expect(result).toBeDefined();
      expect(result!.scheduledStart.getTime()).toBe(newStartTime.getTime());
      expect(result!.scheduledEnd.getTime()).toBe(newEndTime.getTime());
    });

    it('should return null for non-existent appointment', async () => {
      const nonExistentUpdateData = { notes: 'New notes' };

      const result = await appointmentService.updateAppointment('507f1f77bcf86cd799439011', testClinic._id.toString(), nonExistentUpdateData);

      expect(result).toBeNull();
    });
  });

  describe('cancelAppointment', () => {
    it('should cancel appointment successfully', async () => {
      const appointmentData = {
        patient: testPatient._id.toString(),
        provider: testProvider._id.toString(),
        appointmentType: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T10:00:00Z'),
        scheduledEnd: new Date('2024-01-15T11:00:00Z'),
        clinic: testClinic._id.toString(),
        createdBy: testUser._id.toString()
      };

      const createdAppointment = await appointmentService.createAppointment(appointmentData);
      const appointmentId = createdAppointment.id;

      const result = await appointmentService.cancelAppointment(appointmentId, testClinic._id.toString(), 'Patient request');

      expect(result).toBeDefined();
      expect(result!.status).toBe('cancelled');
      expect(result!.cancellationReason).toBe('Patient request');
    });

    it('should return null for non-existent appointment', async () => {
      const result = await appointmentService.cancelAppointment('507f1f77bcf86cd799439011', testClinic._id.toString(), 'Test');

      expect(result).toBeNull();
    });
  });

  describe('checkAvailability', () => {
    it('should return available time slots', async () => {
      const startDate = new Date('2024-01-15T08:00:00Z');
      const endDate = new Date('2024-01-15T18:00:00Z');

      const result = await appointmentService.checkAvailability(
        testProvider._id.toString(),
        startDate,
        endDate,
        testClinic._id.toString()
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // Should return available slots (mock implementation)
    });

    it('should exclude booked time slots', async () => {
      // Create a booked appointment
      await appointmentService.createAppointment({
        patient: testPatient._id.toString(),
        provider: testProvider._id.toString(),
        appointmentType: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T10:00:00Z'),
        scheduledEnd: new Date('2024-01-15T11:00:00Z'),
        clinic: testClinic._id.toString(),
        createdBy: testUser._id.toString()
      });

      const startDate = new Date('2024-01-15T08:00:00Z');
      const endDate = new Date('2024-01-15T18:00:00Z');

      const result = await appointmentService.checkAvailability(
        testProvider._id.toString(),
        startDate,
        endDate,
        testClinic._id.toString()
      );

      expect(result).toBeDefined();
      // The 10:00-11:00 slot should not be available
      const bookedSlot = result.find(slot =>
        slot.start.getTime() === new Date('2024-01-15T10:00:00Z').getTime()
      );
      expect(bookedSlot).toBeUndefined();
    });
  });

  describe('getAppointmentStats', () => {
    beforeEach(async () => {
      // Create appointments with different statuses
      const appointment1 = await appointmentService.createAppointment({
        patient: testPatient._id.toString(),
        provider: testProvider._id.toString(),
        appointmentType: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T10:00:00Z'),
        scheduledEnd: new Date('2024-01-15T11:00:00Z'),
        clinic: testClinic._id.toString(),
        createdBy: testUser._id.toString()
      });

      const appointment2 = await appointmentService.createAppointment({
        patient: testPatient._id.toString(),
        provider: testProvider._id.toString(),
        appointmentType: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-16T10:00:00Z'),
        scheduledEnd: new Date('2024-01-16T11:00:00Z'),
        clinic: testClinic._id.toString(),
        createdBy: testUser._id.toString()
      });

      const appointment3 = await appointmentService.createAppointment({
        patient: testPatient._id.toString(),
        provider: testProvider._id.toString(),
        appointmentType: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-17T10:00:00Z'),
        scheduledEnd: new Date('2024-01-17T11:00:00Z'),
        clinic: testClinic._id.toString(),
        createdBy: testUser._id.toString()
      });

      // Update appointments to different statuses
      await appointmentService.updateAppointment(appointment2.id, testClinic._id.toString(), { status: 'completed' });
      await appointmentService.updateAppointment(appointment3.id, testClinic._id.toString(), { status: 'cancelled' });
    });

    it('should return correct appointment statistics', async () => {
      const result = await appointmentService.getAppointmentStats(testClinic._id.toString());

      expect(result).toBeDefined();
      expect(result.total).toBe(3);
      expect(result.scheduled).toBe(1);
      expect(result.completed).toBe(1);
      expect(result.cancelled).toBe(1);
    });

    it('should return statistics for date range', async () => {
      const startDate = new Date('2024-01-15T00:00:00Z');
      const endDate = new Date('2024-01-16T23:59:59Z');

      const result = await appointmentService.getAppointmentStats(testClinic._id.toString(), startDate, endDate);

      expect(result).toBeDefined();
      expect(result.total).toBe(2); // Only appointments from 15th and 16th
    });
  });

  describe('rescheduleAppointment', () => {
    it('should reschedule appointment successfully', async () => {
      const appointmentData = {
        patient: testPatient._id.toString(),
        provider: testProvider._id.toString(),
        appointmentType: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T10:00:00Z'),
        scheduledEnd: new Date('2024-01-15T11:00:00Z'),
        clinic: testClinic._id.toString(),
        createdBy: testUser._id.toString()
      };

      const createdAppointment = await appointmentService.createAppointment(appointmentData);
      const appointmentId = createdAppointment.id;

      const newStartTime = new Date('2024-01-15T14:00:00Z');
      const newEndTime = new Date('2024-01-15T15:00:00Z');

      const result = await appointmentService.rescheduleAppointment(
        appointmentId,
        testClinic._id.toString(),
        newStartTime,
        newEndTime,
        'Patient request'
      );

      expect(result).toBeDefined();
      expect(result!.scheduledStart.getTime()).toBe(newStartTime.getTime());
      expect(result!.scheduledEnd.getTime()).toBe(newEndTime.getTime());
      expect(result!.rescheduleHistory.length).toBe(1);
      expect(result!.rescheduleHistory[0].reason).toBe('Patient request');
    });

    it('should throw error for conflicting time slot', async () => {
      // Create first appointment
      await appointmentService.createAppointment({
        patient: testPatient._id.toString(),
        provider: testProvider._id.toString(),
        appointmentType: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T14:00:00Z'),
        scheduledEnd: new Date('2024-01-15T15:00:00Z'),
        clinic: testClinic._id.toString(),
        createdBy: testUser._id.toString()
      });

      // Create second appointment to reschedule
      const appointmentData = {
        patient: testPatient._id.toString(),
        provider: testProvider._id.toString(),
        appointmentType: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T10:00:00Z'),
        scheduledEnd: new Date('2024-01-15T11:00:00Z'),
        clinic: testClinic._id.toString(),
        createdBy: testUser._id.toString()
      };

      const createdAppointment = await appointmentService.createAppointment(appointmentData);
      const appointmentId = createdAppointment.id;

      // Try to reschedule to conflicting time
      const conflictingStartTime = new Date('2024-01-15T14:30:00Z');
      const conflictingEndTime = new Date('2024-01-15T15:30:00Z');

      await expect(
        appointmentService.rescheduleAppointment(
          appointmentId,
          testClinic._id.toString(),
          conflictingStartTime,
          conflictingEndTime,
          'Test conflict'
        )
      ).rejects.toThrow('Horário indisponível');
    });
  });
});
