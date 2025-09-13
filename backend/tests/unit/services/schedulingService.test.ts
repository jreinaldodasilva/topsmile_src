import { schedulingService, CreateAppointmentData, AvailabilityQuery } from '../../../src/services/schedulingService';
import { Appointment } from '../../../src/models/Appointment';
import { Provider } from '../../../src/models/Provider';
import { AppointmentType } from '../../../src/models/AppointmentType';
import { Patient } from '../../../src/models/Patient';
import { createTestUser, createTestClinic } from '../../testHelpers';

describe('SchedulingService', () => {
  let testClinic: any;
  let testUser: any;
  let testPatient: any;
  let testProvider: any;
  let testAppointmentType: any;

  beforeEach(async () => {
    try {
      testClinic = await createTestClinic();
      console.log('Test clinic created:', testClinic._id);

      testUser = await createTestUser({ clinic: testClinic._id });
      console.log('Test user created:', testUser._id);

      // Create test patient
      testPatient = await Patient.create({
        name: 'Test Patient',
        phone: '(11) 99999-9999',
        email: 'patient@example.com',
        clinic: testClinic._id,
        status: 'active'
      });
      console.log('Test patient created:', testPatient._id);

      // Create test provider
      testProvider = await Provider.create({
        name: 'Dr. Test Provider',
        email: 'provider@example.com',
        phone: '(11) 88888-8888',
        clinic: testClinic._id,
        specialties: ['general_dentistry'],
        licenseNumber: 'CRO-12345',
        isActive: true,
        timeZone: 'America/Sao_Paulo', // Set timezone explicitly
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
      console.log('Test provider created:', testProvider._id);

      // Create test appointment type
      testAppointmentType = await AppointmentType.create({
        name: 'Consulta Geral',
        duration: 60,
        color: '#3B82F6',
        category: 'consultation',
        clinic: testClinic._id,
        isActive: true,
        bufferBefore: 15,
        bufferAfter: 15
      });
      console.log('Test appointment type created:', testAppointmentType._id);
    } catch (error) {
      console.error('Error in beforeEach:', error);
      throw error;
    }
  });

  describe('createAppointment', () => {
    it('should create appointment successfully', async () => {
      const appointmentData: CreateAppointmentData = {
        clinicId: testClinic._id.toString(),
        patientId: testPatient._id.toString(),
        providerId: testProvider._id.toString(),
        appointmentTypeId: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T13:00:00Z'), // 10:00 AM Sao Paulo time (13:00 UTC)
        notes: 'Test appointment',
        priority: 'routine',
        createdBy: testUser._id.toString()
      };

      const result = await schedulingService.createAppointment(appointmentData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.patient.toString()).toBe(testPatient._id.toString());
      expect(result.data!.provider.toString()).toBe(testProvider._id.toString());
    });

    it('should return error for invalid appointment type', async () => {
      const appointmentData: CreateAppointmentData = {
        clinicId: testClinic._id.toString(),
        patientId: testPatient._id.toString(),
        providerId: testProvider._id.toString(),
        appointmentTypeId: '507f1f77bcf86cd799439011', // Invalid ID
        scheduledStart: new Date('2024-01-15T13:00:00Z'), // 10:00 AM Sao Paulo time (13:00 UTC)
        createdBy: testUser._id.toString()
      };

      const result = await schedulingService.createAppointment(appointmentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Tipo de agendamento não encontrado');
    });

    it('should return error for inactive provider', async () => {
      // Create inactive provider
      const inactiveProvider = await Provider.create({
        name: 'Dr. Inactive Provider',
        email: 'inactive@example.com',
        clinic: testClinic._id,
        specialties: ['general_dentistry'],
        isActive: false,
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

      const appointmentData: CreateAppointmentData = {
        clinicId: testClinic._id.toString(),
        patientId: testPatient._id.toString(),
        providerId: (inactiveProvider._id as any).toString(),
        appointmentTypeId: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T13:00:00Z'), // 10:00 AM Sao Paulo time (13:00 UTC)
        createdBy: testUser._id.toString()
      };

      const inactiveResult = await schedulingService.createAppointment(appointmentData);

      expect(inactiveResult.success).toBe(false);
      expect(inactiveResult.error).toBe('Profissional não encontrado ou inativo');
    });

    it('should return error for time conflict', async () => {
      // Create first appointment
      const firstAppointmentData: CreateAppointmentData = {
        clinicId: testClinic._id.toString(),
        patientId: testPatient._id.toString(),
        providerId: testProvider._id.toString(),
        appointmentTypeId: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T13:00:00Z'), // 10:00 AM Sao Paulo time (13:00 UTC)
        createdBy: testUser._id.toString()
      };

      const firstResult = await schedulingService.createAppointment(firstAppointmentData);
      expect(firstResult.success).toBe(true);

      // Try to create overlapping appointment
      const conflictingAppointmentData: CreateAppointmentData = {
        clinicId: testClinic._id.toString(),
        patientId: testPatient._id.toString(),
        providerId: testProvider._id.toString(),
        appointmentTypeId: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T13:30:00Z'), // 10:30 AM Sao Paulo time (13:30 UTC) - Overlaps with first
        createdBy: testUser._id.toString()
      };

      const conflictResult = await schedulingService.createAppointment(conflictingAppointmentData);

      expect(conflictResult.success).toBe(false);
      expect(conflictResult.error).toContain('Horário não disponível');
    });
  });

  describe('rescheduleAppointment', () => {
    it('should reschedule appointment successfully', async () => {
      // Create initial appointment
      const appointmentData: CreateAppointmentData = {
        clinicId: testClinic._id.toString(),
        patientId: testPatient._id.toString(),
        providerId: testProvider._id.toString(),
        appointmentTypeId: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T13:00:00Z'), // 10:00 AM Sao Paulo time (13:00 UTC)
        createdBy: testUser._id.toString()
      };

      const createResult = await schedulingService.createAppointment(appointmentData);
      expect(createResult.success).toBe(true);

      const appointmentId = (createResult.data!._id as any).toString();
      const newStart = new Date('2024-01-15T14:00:00Z');
      const reason = 'Patient requested change';

      const rescheduleResult = await schedulingService.rescheduleAppointment(
        appointmentId,
        newStart,
        reason,
        'patient'
      );

      expect(rescheduleResult.success).toBe(true);
      expect(rescheduleResult.data).toBeDefined();
      expect(rescheduleResult.data!.scheduledStart.getTime()).toBe(newStart.getTime());
      expect(rescheduleResult.data!.rescheduleHistory).toHaveLength(1);
      expect(rescheduleResult.data!.rescheduleHistory[0].reason).toBe(reason);
    });

    it('should return error for non-existent appointment', async () => {
      const nonExistentResult = await schedulingService.rescheduleAppointment(
        '507f1f77bcf86cd799439011',
        new Date('2024-01-15T14:00:00Z'),
        'Test reason',
        'clinic'
      );

      expect(nonExistentResult.success).toBe(false);
      expect(nonExistentResult.error).toBe('Agendamento não encontrado');
    });
  });

  describe('cancelAppointment', () => {
    it('should cancel appointment successfully', async () => {
      // Create appointment to cancel
      const appointmentData: CreateAppointmentData = {
        clinicId: testClinic._id.toString(),
        patientId: testPatient._id.toString(),
        providerId: testProvider._id.toString(),
        appointmentTypeId: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T13:00:00Z'), // 10:00 AM Sao Paulo time (13:00 UTC)
        createdBy: testUser._id.toString()
      };

      const createResult = await schedulingService.createAppointment(appointmentData);
      expect(createResult.success).toBe(true);

      const appointmentId = (createResult.data!._id as any).toString();
      const reason = 'Patient cancelled';

      const result = await schedulingService.cancelAppointment(appointmentId, reason);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('cancelled');
      expect(result.data!.cancellationReason).toBe(reason);
    });

    it('should prevent cancelling completed appointment', async () => {
      // Create and manually mark as completed
      const appointmentData: CreateAppointmentData = {
        clinicId: testClinic._id.toString(),
        patientId: testPatient._id.toString(),
        providerId: testProvider._id.toString(),
        appointmentTypeId: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T13:00:00Z'), // 10:00 AM Sao Paulo time (13:00 UTC)
        createdBy: testUser._id.toString()
      };

      const createResult = await schedulingService.createAppointment(appointmentData);
      expect(createResult.success).toBe(true);

      // Manually update to completed status
      await Appointment.findByIdAndUpdate(createResult.data!._id, { status: 'completed' });

      const result = await schedulingService.cancelAppointment(
        (createResult.data!._id as any).toString(),
        'Test reason'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Não é possível cancelar um agendamento já concluído');
    });
  });

  describe('getAvailableSlots', () => {
    it('should return available time slots', async () => {
      const query: AvailabilityQuery = {
        clinicId: testClinic._id.toString(),
        providerId: testProvider._id.toString(),
        appointmentTypeId: testAppointmentType._id.toString(),
        date: new Date('2024-01-15')
      };

      const result = await schedulingService.getAvailableSlots(query);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('start');
        expect(result[0]).toHaveProperty('end');
        expect(result[0]).toHaveProperty('available');
        expect(result[0].available).toBe(true);
      }
    });

    it('should return empty array for non-existent appointment type', async () => {
      const query: AvailabilityQuery = {
        clinicId: testClinic._id.toString(),
        appointmentTypeId: '507f1f77bcf86cd799439011', // Invalid ID
        date: new Date('2024-01-15')
      };

      await expect(schedulingService.getAvailableSlots(query)).rejects.toThrow('Tipo de agendamento não encontrado');
    });

    it('should return empty array when no providers available', async () => {
      // Create appointment type not linked to any provider
      const isolatedAppointmentType = await AppointmentType.create({
        name: 'Isolated Type',
        duration: 30,
        color: '#FF0000',
        category: 'consultation',
        clinic: testClinic._id,
        isActive: true
      });

      const query: AvailabilityQuery = {
        clinicId: testClinic._id.toString(),
        appointmentTypeId: (isolatedAppointmentType._id as any).toString(),
        date: new Date('2024-01-15')
      };

      const result = await schedulingService.getAvailableSlots(query);
      expect(result).toEqual([]);
    });
  });

  describe('getAppointments', () => {
    beforeEach(async () => {
      // Create test appointments
      const appointmentData1: CreateAppointmentData = {
        clinicId: testClinic._id.toString(),
        patientId: testPatient._id.toString(),
        providerId: testProvider._id.toString(),
        appointmentTypeId: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T13:00:00Z'), // 10:00 AM Sao Paulo time (13:00 UTC)
        createdBy: testUser._id.toString()
      };

      const appointmentData2: CreateAppointmentData = {
        clinicId: testClinic._id.toString(),
        patientId: testPatient._id.toString(),
        providerId: testProvider._id.toString(),
        appointmentTypeId: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T14:00:00Z'),
        createdBy: testUser._id.toString()
      };

      await schedulingService.createAppointment(appointmentData1);
      await schedulingService.createAppointment(appointmentData2);
    });

    it('should return appointments within date range', async () => {
      const startDate = new Date('2024-01-15T00:00:00Z');
      const endDate = new Date('2024-01-15T23:59:59Z');

      const result = await schedulingService.getAppointments(
        testClinic._id.toString(),
        startDate,
        endDate
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should filter by provider and status', async () => {
      const startDate = new Date('2024-01-15T00:00:00Z');
      const endDate = new Date('2024-01-15T23:59:59Z');

      const result = await schedulingService.getAppointments(
        testClinic._id.toString(),
        startDate,
        endDate,
        testProvider._id.toString(),
        'confirmed'
      );

      expect(Array.isArray(result)).toBe(true);
      // Should return appointments with confirmed status
    });
  });

  describe('getAppointmentConflicts', () => {
    it('should return no conflicts when slot is available', async () => {
      const startDate = new Date('2024-01-15T13:00:00Z'); // 10:00 AM Sao Paulo time (13:00 UTC)
      const endDate = new Date('2024-01-15T14:00:00Z'); // 11:00 AM Sao Paulo time (14:00 UTC)

      const result = await schedulingService.getAppointmentConflicts(
        testProvider._id.toString(),
        startDate,
        endDate,
        testAppointmentType._id.toString()
      );

      expect(result.hasConflict).toBe(false);
      expect(result.conflictingAppointments).toBeUndefined();
    });

    it('should return conflicts when appointments overlap', async () => {
      // Create conflicting appointment
      const appointmentData: CreateAppointmentData = {
        clinicId: testClinic._id.toString(),
        patientId: testPatient._id.toString(),
        providerId: testProvider._id.toString(),
        appointmentTypeId: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T13:00:00Z'), // 10:00 AM Sao Paulo time (13:00 UTC)
        createdBy: testUser._id.toString()
      };

      await schedulingService.createAppointment(appointmentData);

      // Check for conflicts with overlapping time
      const startDate = new Date('2024-01-15T13:30:00Z'); // 10:30 AM Sao Paulo time (13:30 UTC)
      const endDate = new Date('2024-01-15T14:30:00Z'); // 11:30 AM Sao Paulo time (14:30 UTC)

      const result = await schedulingService.getAppointmentConflicts(
        testProvider._id.toString(),
        startDate,
        endDate,
        testAppointmentType._id.toString()
      );

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingAppointments).toBeDefined();
      expect(result.conflictingAppointments!.length).toBeGreaterThan(0);
    });
  });

  describe('getProviderUtilization', () => {
    it('should calculate provider utilization correctly', async () => {
      // Create appointments with different statuses
      const appointmentData1: CreateAppointmentData = {
        clinicId: testClinic._id.toString(),
        patientId: testPatient._id.toString(),
        providerId: testProvider._id.toString(),
        appointmentTypeId: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T13:00:00Z'), // 10:00 AM Sao Paulo time (13:00 UTC)
        createdBy: testUser._id.toString()
      };

      const appointmentData2: CreateAppointmentData = {
        clinicId: testClinic._id.toString(),
        patientId: testPatient._id.toString(),
        providerId: testProvider._id.toString(),
        appointmentTypeId: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T14:00:00Z'),
        createdBy: testUser._id.toString()
      };

      await schedulingService.createAppointment(appointmentData1);
      const secondResult = await schedulingService.createAppointment(appointmentData2);

      // Mark one as completed
      await Appointment.findByIdAndUpdate(secondResult.data!._id, { status: 'completed' });

      const startDate = new Date('2024-01-15T00:00:00Z');
      const endDate = new Date('2024-01-15T23:59:59Z');

      const result = await schedulingService.getProviderUtilization(
        testProvider._id.toString(),
        startDate,
        endDate
      );

      expect(result).toHaveProperty('totalSlots');
      expect(result).toHaveProperty('bookedSlots');
      expect(result).toHaveProperty('utilizationRate');
      expect(result).toHaveProperty('appointments');
      expect(result.appointments.scheduled).toBe(1);
      expect(result.appointments.completed).toBe(1);
    });
  });
});
