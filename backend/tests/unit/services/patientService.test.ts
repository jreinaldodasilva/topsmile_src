import { patientService } from '../../../src/services/patientService';
import { Patient } from '../../../src/models/Patient';
import { User } from '../../../src/models/User';
import mongoose from 'mongoose';
import { createTestUser, createTestClinic } from '../../testHelpers';

describe('PatientService', () => {
  let testClinic: any;
  let testUser: any;

  beforeEach(async () => {
    testClinic = await createTestClinic();
    testUser = await createTestUser({ clinic: testClinic._id });
  });

  describe('createPatient', () => {
    it('should create a new patient successfully', async () => {
      const patientData = {
        name: 'João Silva',
        email: 'joao.silva@example.com',
        phone: '(11) 99999-9999',
        birthDate: new Date('1990-01-15'),
        gender: 'male' as const,
        cpf: '123.456.789-00',
        address: {
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567'
        },
        emergencyContact: {
          name: 'Maria Silva',
          phone: '(11) 88888-8888',
          relationship: 'Esposa'
        },
        medicalHistory: {
          allergies: ['Penicilina'],
          medications: ['Losartana 50mg'],
          conditions: ['Hipertensão'],
          notes: 'Paciente com hipertensão controlada'
        },
        clinicId: testClinic._id.toString()
      };

      const result = await patientService.createPatient(patientData);

      expect(result).toBeDefined();
      expect(result.name).toBe(patientData.name);
      expect(result.email).toBe(patientData.email);
      expect(result.phone).toBe(patientData.phone);
      expect(result.clinic.toString()).toBe(testClinic._id.toString());
    });

    it('should create patient without optional fields', async () => {
      const minimalPatientData = {
        name: 'Ana Costa',
        phone: '(11) 77777-7777',
        clinicId: testClinic._id.toString()
      };

      const result = await patientService.createPatient(minimalPatientData);

      expect(result).toBeDefined();
      expect(result.name).toBe(minimalPatientData.name);
      expect(result.phone).toBe(minimalPatientData.phone);
      expect(result.email).toBeUndefined();
      expect(result.birthDate).toBeUndefined();
    });

    it('should throw error for duplicate phone', async () => {
      const patientData1 = {
        name: 'João Silva',
        phone: '(11) 99999-9999',
        clinicId: testClinic._id.toString()
      };

      const patientData2 = {
        name: 'Maria Silva',
        phone: '(11) 99999-9999', // Same phone
        clinicId: testClinic._id.toString()
      };

      await patientService.createPatient(patientData1);

      await expect(
        patientService.createPatient(patientData2)
      ).rejects.toThrow('Já existe um paciente ativo com este telefone nesta clínica');
    });

    it('should validate required fields', async () => {
      const invalidPatientData = {
        email: 'test@example.com',
        phone: '(11) 99999-9999',
        clinicId: testClinic._id.toString()
        // Missing required 'name'
      };

      await expect(
        patientService.createPatient(invalidPatientData as any)
      ).rejects.toThrow('Nome, telefone e clínica são obrigatórios');
    });
  });

  describe('getPatientById', () => {
    it('should return patient by ID', async () => {
      const patientData = {
        name: 'Test Patient',
        phone: '(11) 99999-9999',
        email: 'test@example.com',
        clinicId: testClinic._id.toString()
      };

      const createdPatient = await patientService.createPatient(patientData);
      const patientId = (createdPatient._id as any).toString();

      const result = await patientService.getPatientById(patientId, testClinic._id.toString());

      expect(result).toBeDefined();
      expect(result!.name).toBe(patientData.name);
      expect(result!.email).toBe(patientData.email);
    });

    it('should return null for non-existent patient', async () => {
      const result = await patientService.getPatientById('507f1f77bcf86cd799439011', testClinic._id.toString());

      expect(result).toBeNull();
    });
  });

  describe('getPatientsByClinic', () => {
    beforeEach(async () => {
      // Create multiple test patients
      await patientService.createPatient({
        name: 'João Silva',
        phone: '(11) 99999-9999',
        email: 'joao@example.com',
        clinicId: testClinic._id.toString()
      });

      await patientService.createPatient({
        name: 'Maria Santos',
        phone: '(11) 88888-8888',
        email: 'maria@example.com',
        clinicId: testClinic._id.toString()
      });

      await patientService.createPatient({
        name: 'Pedro Costa',
        phone: '(11) 77777-7777',
        email: 'pedro@example.com',
        clinicId: testClinic._id.toString()
      });
    });

    it('should return all active patients for clinic', async () => {
      const result = await patientService.getPatientsByClinic(testClinic._id.toString());

      expect(result).toBeDefined();
      expect(result.length).toBe(3);
      expect(result[0].clinic._id.toString()).toBe(testClinic._id.toString());
    });

    it('should return inactive patients when specified', async () => {
      // First make one patient inactive
      const patients = await patientService.getPatientsByClinic(testClinic._id.toString());
      const patientToDeactivate = patients[0];
      await patientService.deletePatient((patientToDeactivate as any)._id.toString(), testClinic._id.toString());

      const activePatients = await patientService.getPatientsByClinic(testClinic._id.toString(), 'active');
      const inactivePatients = await patientService.getPatientsByClinic(testClinic._id.toString(), 'inactive');

      expect(activePatients.length).toBe(2);
      expect(inactivePatients.length).toBe(1);
    });
  });

  describe('updatePatient', () => {
    it('should update patient successfully', async () => {
      const patientData = {
        name: 'Original Name',
        phone: '(11) 99999-9999',
        email: 'original@example.com',
        clinicId: testClinic._id.toString()
      };

      const createdPatient = await patientService.createPatient(patientData);
      const patientId = (createdPatient._id as any).toString();

      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const result = await patientService.updatePatient(patientId, testClinic._id.toString(), updateData);

      expect(result).toBeDefined();
      expect(result!.name).toBe(updateData.name);
      expect(result!.email).toBe(updateData.email);
      expect(result!.phone).toBe(patientData.phone); // Unchanged field
    });

    it('should return null for non-existent patient', async () => {
      const updateData = { name: 'New Name' };

      const result = await patientService.updatePatient('507f1f77bcf86cd799439011', testClinic._id.toString(), updateData);

      expect(result).toBeNull();
    });

    it('should update medical history', async () => {
      const patientData = {
        name: 'Medical Test',
        phone: '(11) 99999-9999',
        clinicId: testClinic._id.toString()
      };

      const createdPatient = await patientService.createPatient(patientData);
      const patientId = (createdPatient._id as any).toString();

      const medicalUpdate = {
        medicalHistory: {
          allergies: ['Amoxicilina', 'Ibuprofeno'],
          medications: ['Omeprazol 20mg'],
          conditions: ['Gastrite'],
          notes: 'Paciente com gastrite crônica'
        }
      };

      const result = await patientService.updatePatient(patientId, testClinic._id.toString(), medicalUpdate);

      expect(result).toBeDefined();
      expect(result!.medicalHistory!.allergies).toEqual(['Amoxicilina', 'Ibuprofeno']);
      expect(result!.medicalHistory!.conditions).toEqual(['Gastrite']);
    });
  });

  describe('deletePatient', () => {
    it('should delete patient successfully', async () => {
      const patientData = {
        name: 'Delete Test',
        phone: '(11) 99999-9999',
        clinicId: testClinic._id.toString()
      };

      const createdPatient = await patientService.createPatient(patientData);
      const patientId = (createdPatient._id as any).toString();

      const result = await patientService.deletePatient(patientId, testClinic._id.toString());

      expect(result).toBe(true);

      // Verify patient is marked as inactive
      const patient = await Patient.findById(patientId);
      expect(patient!.status).toBe('inactive');
    });

    it('should return false for non-existent patient', async () => {
      const result = await patientService.deletePatient('507f1f77bcf86cd799439011', testClinic._id.toString());

      expect(result).toBe(false);
    });
  });

  describe('searchPatients', () => {
    beforeEach(async () => {
      await patientService.createPatient({
        name: 'João Silva Santos',
        phone: '(11) 99999-9999',
        email: 'joao.santos@example.com',
        cpf: '123.456.789-00',
        clinicId: testClinic._id.toString()
      });

      await patientService.createPatient({
        name: 'Maria Silva',
        phone: '(11) 88888-8888',
        email: 'maria.silva@example.com',
        cpf: '987.654.321-00',
        clinicId: testClinic._id.toString()
      });
    });

    it('should search patients by name', async () => {
      const result = await patientService.searchPatients({
        clinicId: testClinic._id.toString(),
        search: 'Silva'
      });

      expect(result).toBeDefined();
      expect(result.patients.length).toBe(2);
    });

    it('should search patients by phone', async () => {
      const result = await patientService.searchPatients({
        clinicId: testClinic._id.toString(),
        search: '99999'
      });

      expect(result).toBeDefined();
      expect(result.patients.length).toBe(1);
      expect(result.patients[0].name).toBe('João Silva Santos');
    });

    it('should search patients by email', async () => {
      const result = await patientService.searchPatients({
        clinicId: testClinic._id.toString(),
        search: 'maria.silva'
      });

      expect(result).toBeDefined();
      expect(result.patients.length).toBe(1);
      expect(result.patients[0].email).toBe('maria.silva@example.com');
    });

    it('should return empty array for no matches', async () => {
      const result = await patientService.searchPatients({
        clinicId: testClinic._id.toString(),
        search: 'nonexistent'
      });

      expect(result).toBeDefined();
      expect(result.patients.length).toBe(0);
    });

    it('should paginate results', async () => {
      const result = await patientService.searchPatients({
        clinicId: testClinic._id.toString(),
        page: 1,
        limit: 1
      });

      expect(result).toBeDefined();
      expect(result.patients.length).toBe(1);
      expect(result.page).toBe(1);
      expect(result.total).toBe(2);
      expect(result.hasNext).toBe(true);
    });
  });

  describe('getPatientStats', () => {
    beforeEach(async () => {
      // Create patients with different statuses
      await patientService.createPatient({
        name: 'Active Patient 1',
        phone: '(11) 99999-9999',
        clinicId: testClinic._id.toString()
      });

      await patientService.createPatient({
        name: 'Active Patient 2',
        phone: '(11) 88888-8888',
        clinicId: testClinic._id.toString()
      });

      await patientService.createPatient({
        name: 'Inactive Patient',
        phone: '(11) 77777-7777',
        clinicId: testClinic._id.toString()
      });

      // Make one patient inactive
      const patients = await patientService.getPatientsByClinic(testClinic._id.toString());
      const inactivePatient = patients.find(p => p.name === 'Inactive Patient');
      if (inactivePatient) {
        await patientService.deletePatient((inactivePatient._id as any).toString(), testClinic._id.toString());
      }
    });

    it('should return correct patient statistics', async () => {
      const result = await patientService.getPatientStats(testClinic._id.toString());

      expect(result).toBeDefined();
      expect(result.total).toBe(3);
      expect(result.active).toBe(2);
      expect(result.inactive).toBe(1);
    });
  });

  describe('updateMedicalHistory', () => {
    it('should update medical history successfully', async () => {
      const patientData = {
        name: 'Medical Update Test',
        phone: '(11) 99999-9999',
        clinicId: testClinic._id.toString()
      };

      const createdPatient = await patientService.createPatient(patientData);
      const patientId = (createdPatient._id as any).toString();

      const medicalHistory = {
        allergies: ['Penicilina', 'Ibuprofeno'],
        medications: ['Losartana 50mg'],
        conditions: ['Hipertensão'],
        notes: 'Paciente com hipertensão controlada'
      };

      const result = await patientService.updateMedicalHistory(
        patientId,
        testClinic._id.toString(),
        medicalHistory
      );

      expect(result).toBeDefined();
      expect(result!.medicalHistory!.allergies).toEqual(medicalHistory.allergies);
      expect(result!.medicalHistory!.medications).toEqual(medicalHistory.medications);
      expect(result!.medicalHistory!.conditions).toEqual(medicalHistory.conditions);
      expect(result!.medicalHistory!.notes).toEqual(medicalHistory.notes);
    });
  });

  describe('reactivatePatient', () => {
    it('should reactivate inactive patient', async () => {
      const patientData = {
        name: 'Reactivate Test',
        phone: '(11) 99999-9999',
        clinicId: testClinic._id.toString()
      };

      const createdPatient = await patientService.createPatient(patientData);
      const patientId = (createdPatient._id as any).toString();

      // Deactivate patient
      await patientService.deletePatient(patientId, testClinic._id.toString());

      // Reactivate patient
      const result = await patientService.reactivatePatient(patientId, testClinic._id.toString());

      expect(result).toBeDefined();
      expect(result!.status).toBe('active');
    });

    it('should throw error for non-existent patient', async () => {
      await expect(
        patientService.reactivatePatient('507f1f77bcf86cd799439011', testClinic._id.toString())
      ).rejects.toThrow('Paciente inativo não encontrado');
    });
  });
});
