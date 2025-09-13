import { providerService } from '../../../src/services/providerService';
import { Provider } from '../../../src/models/Provider';
import { User } from '../../../src/models/User';
import { AppointmentType } from '../../../src/models/AppointmentType';
import { createTestUser, createTestClinic } from '../../testHelpers';
import mongoose from 'mongoose';

describe('ProviderService', () => {
  let testClinic: any;
  let testUser: any;
  let testAppointmentType: any;

  beforeEach(async () => {
    testClinic = await createTestClinic();
    testUser = await createTestUser({ clinic: testClinic._id });

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

  describe('createProvider', () => {
    it('should create a new provider successfully', async () => {
      const providerData = {
        name: 'Dr. João Silva',
        email: 'joao.silva@example.com',
        phone: '(11) 99999-9999',
        specialties: ['general_dentistry', 'orthodontics'],
        licenseNumber: 'CRO-12345',
        clinicId: testClinic._id.toString()
      };

      const result = await providerService.createProvider(providerData);

      expect(result).toBeDefined();
      expect(result.name).toBe(providerData.name);
      expect(result.email).toBe(providerData.email);
      expect(result.phone).toBe(providerData.phone);
      expect(result.specialties).toEqual(providerData.specialties);
      expect(result.licenseNumber).toBe(providerData.licenseNumber);
      expect(result.clinic.toString()).toBe((testClinic._id as mongoose.Types.ObjectId).toString());
      expect(result.isActive).toBe(true);
    });

    it('should create provider with default working hours', async () => {
      const providerData = {
        name: 'Dr. Maria Santos',
        email: 'maria@example.com',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      };

      const result = await providerService.createProvider(providerData);

      expect(result).toBeDefined();
      expect(result.workingHours).toBeDefined();
      expect(result.workingHours.monday.isWorking).toBe(true);
      expect(result.workingHours.saturday.isWorking).toBe(false);
      expect(result.timeZone).toBe('America/Sao_Paulo');
      expect(result.bufferTimeBefore).toBe(15);
      expect(result.bufferTimeAfter).toBe(15);
    });

    it('should create provider with custom working hours', async () => {
      const customWorkingHours = {
        monday: { start: '09:00', end: '17:00', isWorking: true },
        tuesday: { start: '09:00', end: '17:00', isWorking: true },
        wednesday: { start: '09:00', end: '17:00', isWorking: true },
        thursday: { start: '09:00', end: '17:00', isWorking: true },
        friday: { start: '09:00', end: '17:00', isWorking: true },
        saturday: { start: '08:00', end: '12:00', isWorking: true },
        sunday: { start: '08:00', end: '12:00', isWorking: false }
      };

      const providerData = {
        name: 'Dr. Pedro Costa',
        email: 'pedro@example.com',
        specialties: ['general_dentistry'],
        workingHours: customWorkingHours,
        timeZone: 'America/Sao_Paulo',
        bufferTimeBefore: 30,
        bufferTimeAfter: 30,
        clinicId: testClinic._id.toString()
      };

      const result = await providerService.createProvider(providerData);

      expect(result).toBeDefined();
      expect(result.workingHours.monday.start).toBe('09:00');
      expect(result.workingHours.saturday.isWorking).toBe(true);
      expect(result.bufferTimeBefore).toBe(30);
      expect(result.bufferTimeAfter).toBe(30);
    });

    it('should create provider linked to user account', async () => {
      const providerData = {
        name: 'Dr. Ana Oliveira',
        email: 'ana@example.com',
        specialties: ['general_dentistry'],
        userId: (testUser._id as mongoose.Types.ObjectId).toString(),
        clinicId: testClinic._id.toString()
      };

      const result = await providerService.createProvider(providerData);

      expect(result).toBeDefined();
      expect(result.user?.toString()).toBe(testUser._id.toString());
    });

    it('should create provider with appointment types', async () => {
      const providerData = {
        name: 'Dr. Carlos Mendes',
        email: 'carlos@example.com',
        specialties: ['general_dentistry'],
        appointmentTypes: [(testAppointmentType._id as mongoose.Types.ObjectId).toString()],
        clinicId: testClinic._id.toString()
      };

      const result = await providerService.createProvider(providerData);

      expect(result).toBeDefined();
      expect(result.appointmentTypes).toHaveLength(1);
      expect(result.appointmentTypes[0].toString()).toBe(testAppointmentType._id.toString());
    });

    it('should throw error for duplicate email in same clinic', async () => {
      const providerData1 = {
        name: 'Dr. First',
        email: 'duplicate@example.com',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      };

      const providerData2 = {
        name: 'Dr. Second',
        email: 'duplicate@example.com',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      };

      await providerService.createProvider(providerData1);

      await expect(
        providerService.createProvider(providerData2)
      ).rejects.toThrow('Já existe um profissional ativo com este e-mail nesta clínica');
    });

    it('should throw error for invalid clinic ID', async () => {
      const providerData = {
        name: 'Dr. Test',
        email: 'test@example.com',
        specialties: ['Odontologia'],
        clinicId: 'invalid-id'
      };

      await expect(
        providerService.createProvider(providerData)
      ).rejects.toThrow('ID da clínica inválido');
    });

    it('should throw error for missing required fields', async () => {
      const invalidProviderData = {
        email: 'test@example.com',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
        // Missing name
      };

      await expect(
        providerService.createProvider(invalidProviderData as any)
      ).rejects.toThrow('Nome e clínica são obrigatórios');
    });

    it('should throw error for user from different clinic', async () => {
      const otherClinic = await createTestClinic();
      const otherUser = await createTestUser({ clinic: otherClinic._id });

      const providerData = {
        name: 'Dr. Wrong Clinic',
        email: 'wrong@example.com',
        specialties: ['general_dentistry'],
        userId: (otherUser._id as mongoose.Types.ObjectId).toString(),
        clinicId: testClinic._id.toString()
      };

      await expect(
        providerService.createProvider(providerData)
      ).rejects.toThrow('Usuário não encontrado ou não pertence a esta clínica');
    });

    it('should throw error for user already linked to another provider', async () => {
      // Create first provider linked to user
      await providerService.createProvider({
        name: 'Dr. First',
        email: 'first@example.com',
        specialties: ['general_dentistry'],
        userId: testUser._id.toString(),
        clinicId: testClinic._id.toString()
      });

      // Try to create second provider with same user
      const providerData = {
        name: 'Dr. Second',
        email: 'second@example.com',
        specialties: ['general_dentistry'],
        userId: testUser._id.toString(),
        clinicId: testClinic._id.toString()
      };

      await expect(
        providerService.createProvider(providerData)
      ).rejects.toThrow('Este usuário já está vinculado a outro profissional');
    });
  });

  describe('getProviderById', () => {
    it('should return provider by ID with populated fields', async () => {
      const providerData = {
        name: 'Dr. Get Test',
        email: 'get@example.com',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      };

      const createdProvider = await providerService.createProvider(providerData);
      const providerId = (createdProvider._id as mongoose.Types.ObjectId).toString();

      const result = await providerService.getProviderById(providerId, testClinic._id.toString());

      expect(result).toBeDefined();
      expect((result!._id as mongoose.Types.ObjectId).toString()).toBe(providerId);
      expect(result!.name).toBe(providerData.name);
    });

    it('should return null for non-existent provider', async () => {
      const result = await providerService.getProviderById('507f1f77bcf86cd799439011', testClinic._id.toString());

      expect(result).toBeNull();
    });

    it('should throw error for invalid provider ID', async () => {
      await expect(
        providerService.getProviderById('invalid-id', testClinic._id.toString())
      ).rejects.toThrow('ID do profissional inválido');
    });
  });

  describe('updateProvider', () => {
    it('should update provider successfully', async () => {
      const providerData = {
        name: 'Dr. Original',
        email: 'original@example.com',
        phone: '(11) 99999-9999',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      };

      const createdProvider = await providerService.createProvider(providerData);
      const providerId = (createdProvider._id as mongoose.Types.ObjectId).toString();

      const updateData = {
        name: 'Dr. Updated',
        email: 'updated@example.com',
        phone: '(11) 88888-8888',
        specialties: ['general_dentistry', 'orthodontics']
      };

      const result = await providerService.updateProvider(providerId, testClinic._id.toString(), updateData);

      expect(result).toBeDefined();
      expect(result!.name).toBe(updateData.name);
      expect(result!.email).toBe(updateData.email);
      expect(result!.phone).toBe(updateData.phone);
      expect(result!.specialties).toEqual(updateData.specialties);
    });

    it('should update provider with user link', async () => {
      const providerData = {
        name: 'Dr. User Link',
        email: 'userlink@example.com',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      };

      const createdProvider = await providerService.createProvider(providerData);
      const providerId = (createdProvider._id as mongoose.Types.ObjectId).toString();

      const updateData = {
        userId: (testUser._id as mongoose.Types.ObjectId).toString()
      };

      const result = await providerService.updateProvider(providerId, testClinic._id.toString(), updateData);

      expect(result).toBeDefined();
      expect(result!.user?.toString()).toBe(testUser._id.toString());
    });

    it('should update provider with appointment types', async () => {
      const providerData = {
        name: 'Dr. Appointment Types',
        email: 'apptypes@example.com',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      };

      const createdProvider = await providerService.createProvider(providerData);
      const providerId = (createdProvider._id as mongoose.Types.ObjectId).toString();

      const updateData = {
        appointmentTypes: [(testAppointmentType._id as mongoose.Types.ObjectId).toString()]
      };

      const result = await providerService.updateProvider(providerId, testClinic._id.toString(), updateData);

      expect(result).toBeDefined();
      expect(result!.appointmentTypes).toHaveLength(1);
      expect(result!.appointmentTypes[0].toString()).toBe(testAppointmentType._id.toString());
    });

    it('should return null for non-existent provider', async () => {
      const updateData = { name: 'New Name' };

      const result = await providerService.updateProvider('507f1f77bcf86cd799439011', testClinic._id.toString(), updateData);

      expect(result).toBeNull();
    });

    it('should throw error for duplicate email update', async () => {
      // Create first provider
      await providerService.createProvider({
        name: 'Dr. First',
        email: 'first@example.com',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      });

      // Create second provider
      const secondProvider = await providerService.createProvider({
        name: 'Dr. Second',
        email: 'second@example.com',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      });

      // Try to update second provider with first provider's email
      const updateData = {
        email: 'first@example.com'
      };

      await expect(
        providerService.updateProvider((secondProvider._id as mongoose.Types.ObjectId).toString(), testClinic._id.toString(), updateData)
      ).rejects.toThrow('Já existe um profissional ativo com este e-mail nesta clínica');
    });
  });

  describe('deleteProvider', () => {
    it('should delete provider successfully (soft delete)', async () => {
      const providerData = {
        name: 'Dr. Delete Test',
        email: 'delete@example.com',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      };

      const createdProvider = await providerService.createProvider(providerData);
      const providerId = (createdProvider._id as mongoose.Types.ObjectId).toString();

      const result = await providerService.deleteProvider(providerId, testClinic._id.toString());

      expect(result).toBe(true);

      // Verify provider is marked as inactive
      const provider = await Provider.findById(providerId);
      expect(provider!.isActive).toBe(false);
    });

    it('should return false for non-existent provider', async () => {
      const result = await providerService.deleteProvider('507f1f77bcf86cd799439011', testClinic._id.toString());

      expect(result).toBe(false);
    });

    it('should throw error for invalid provider ID', async () => {
      await expect(
        providerService.deleteProvider('invalid-id', testClinic._id.toString())
      ).rejects.toThrow('ID do profissional inválido');
    });
  });

  describe('searchProviders', () => {
    beforeEach(async () => {
      // Create multiple test providers
      await providerService.createProvider({
        name: 'Dr. João Silva',
        email: 'joao.silva@example.com',
        phone: '(11) 99999-9999',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      });

      await providerService.createProvider({
        name: 'Dr. Maria Santos',
        email: 'maria.santos@example.com',
        phone: '(11) 88888-8888',
        specialties: ['orthodontics'],
        clinicId: testClinic._id.toString()
      });

      await providerService.createProvider({
        name: 'Dr. Pedro Costa',
        email: 'pedro.costa@example.com',
        phone: '(11) 77777-7777',
        specialties: ['general_dentistry', 'orthodontics'],
        clinicId: testClinic._id.toString()
      });
    });

    it('should search providers by name', async () => {
      const result = await providerService.searchProviders({
        clinicId: testClinic._id.toString(),
        search: 'João'
      });

      expect(result).toBeDefined();
      expect(result.providers.length).toBe(1);
      expect(result.providers[0].name).toBe('Dr. João Silva');
    });

    it('should search providers by email', async () => {
      const result = await providerService.searchProviders({
        clinicId: testClinic._id.toString(),
        search: 'maria.santos'
      });

      expect(result).toBeDefined();
      expect(result.providers.length).toBe(1);
      expect(result.providers[0].email).toBe('maria.santos@example.com');
    });

    it('should search providers by specialty', async () => {
      const result = await providerService.searchProviders({
        clinicId: testClinic._id.toString(),
        search: 'orthodontics'
      });

      expect(result).toBeDefined();
      expect(result.providers.length).toBe(2);
    });

    it('should filter by specialties array', async () => {
      const result = await providerService.searchProviders({
        clinicId: testClinic._id.toString(),
        specialties: ['orthodontics']
      });

      expect(result).toBeDefined();
      expect(result.providers.length).toBe(2);
    });

    it('should return all providers when no search term', async () => {
      const result = await providerService.searchProviders({
        clinicId: testClinic._id.toString()
      });

      expect(result).toBeDefined();
      expect(result.providers.length).toBe(3);
      expect(result.total).toBe(3);
    });

    it('should paginate results', async () => {
      const result = await providerService.searchProviders({
        clinicId: testClinic._id.toString(),
        page: 1,
        limit: 2
      });

      expect(result).toBeDefined();
      expect(result.providers.length).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(2);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
    });

    it('should sort results', async () => {
      const result = await providerService.searchProviders({
        clinicId: testClinic._id.toString(),
        sortBy: 'name',
        sortOrder: 'desc'
      });

      expect(result).toBeDefined();
      expect(result.providers[0].name).toBe('Dr. Pedro Costa');
      expect(result.providers[1].name).toBe('Dr. Maria Santos');
      expect(result.providers[2].name).toBe('Dr. João Silva');
    });
  });

  describe('getProvidersByClinic', () => {
    beforeEach(async () => {
      await providerService.createProvider({
        name: 'Dr. Active',
        email: 'active@example.com',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      });

      await providerService.createProvider({
        name: 'Dr. Inactive',
        email: 'inactive@example.com',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      });

      // Make one provider inactive
      const providers = await providerService.getProvidersByClinic(testClinic._id.toString());
      const inactiveProvider = providers.find(p => p.name === 'Dr. Inactive');
      if (inactiveProvider) {
        await providerService.deleteProvider((inactiveProvider._id as any).toString(), testClinic._id.toString());
      }
    });

    it('should return all active providers for clinic', async () => {
      const result = await providerService.getProvidersByClinic(testClinic._id.toString());

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Dr. Active');
      expect((result[0].clinic as any).name).toBe(testClinic.name);
    });

    it('should return inactive providers when specified', async () => {
      const activeProviders = await providerService.getProvidersByClinic(testClinic._id.toString(), true);
      const inactiveProviders = await providerService.getProvidersByClinic(testClinic._id.toString(), false);

      expect(activeProviders.length).toBe(1);
      expect(inactiveProviders.length).toBe(1);
    });

    it('should throw error for invalid clinic ID', async () => {
      await expect(
        providerService.getProvidersByClinic('invalid-id')
      ).rejects.toThrow('ID da clínica inválido');
    });
  });

  describe('updateWorkingHours', () => {
    it('should update working hours successfully', async () => {
      const providerData = {
        name: 'Dr. Hours Test',
        email: 'hours@example.com',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      };

      const createdProvider = await providerService.createProvider(providerData);
      const providerId = (createdProvider._id as any).toString();

      const newWorkingHours = {
        monday: { start: '09:00', end: '17:00', isWorking: true },
        tuesday: { start: '09:00', end: '17:00', isWorking: true },
        wednesday: { start: '09:00', end: '17:00', isWorking: true },
        thursday: { start: '09:00', end: '17:00', isWorking: true },
        friday: { start: '09:00', end: '17:00', isWorking: true },
        saturday: { start: '08:00', end: '12:00', isWorking: true },
        sunday: { start: '08:00', end: '12:00', isWorking: false }
      };

      const result = await providerService.updateWorkingHours(providerId, testClinic._id.toString(), newWorkingHours);

      expect(result).toBeDefined();
      expect(result!.workingHours.monday.start).toBe('09:00');
      expect(result!.workingHours.saturday.isWorking).toBe(true);
    });

    it('should return null for non-existent provider', async () => {
      const workingHours = {
        monday: { start: '09:00', end: '17:00', isWorking: true },
        tuesday: { start: '09:00', end: '17:00', isWorking: true },
        wednesday: { start: '09:00', end: '17:00', isWorking: true },
        thursday: { start: '09:00', end: '17:00', isWorking: true },
        friday: { start: '09:00', end: '17:00', isWorking: true },
        saturday: { start: '09:00', end: '17:00', isWorking: false },
        sunday: { start: '09:00', end: '17:00', isWorking: false }
      };

      const result = await providerService.updateWorkingHours('507f1f77bcf86cd799439011', testClinic._id.toString(), workingHours);

      expect(result).toBeNull();
    });
  });

  describe('updateAppointmentTypes', () => {
    it('should update appointment types successfully', async () => {
      const providerData = {
        name: 'Dr. Types Test',
        email: 'types@example.com',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      };

      const createdProvider = await providerService.createProvider(providerData);
      const providerId = (createdProvider._id as any).toString();

      const appointmentTypeIds = [(testAppointmentType._id as any).toString()];

      const result = await providerService.updateAppointmentTypes(providerId, testClinic._id.toString(), appointmentTypeIds);

      expect(result).toBeDefined();
      expect(result!.appointmentTypes).toHaveLength(1);
      expect(result!.appointmentTypes[0].toString()).toBe(testAppointmentType._id.toString());
    });

    it('should throw error for invalid appointment type ID', async () => {
      const providerData = {
        name: 'Dr. Invalid Types',
        email: 'invalid@example.com',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      };

      const createdProvider = await providerService.createProvider(providerData);
      const providerId = (createdProvider._id as any).toString();

      const invalidTypeIds = ['invalid-id'];

      await expect(
        providerService.updateAppointmentTypes(providerId, testClinic._id.toString(), invalidTypeIds)
      ).rejects.toThrow('ID de tipo de agendamento inválido');
    });
  });

  describe('getProviderStats', () => {
    beforeEach(async () => {
      // Create providers with different statuses and specialties
      await providerService.createProvider({
        name: 'Dr. Active General',
        email: 'active1@example.com',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      });

      await providerService.createProvider({
        name: 'Dr. Active Ortho',
        email: 'active2@example.com',
        specialties: ['orthodontics'],
        clinicId: testClinic._id.toString()
      });

      await providerService.createProvider({
        name: 'Dr. Inactive',
        email: 'inactive@example.com',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      });

      // Make one provider inactive
      const providers = await providerService.getProvidersByClinic(testClinic._id.toString());
      const inactiveProvider = providers.find(p => p.name === 'Dr. Inactive');
      if (inactiveProvider) {
        await providerService.deleteProvider((inactiveProvider._id as any).toString(), testClinic._id.toString());
      }
    });

    it('should return correct provider statistics', async () => {
      const result = await providerService.getProviderStats(testClinic._id.toString());

      expect(result).toBeDefined();
      expect(result.total).toBe(3);
      expect(result.active).toBe(2);
      expect(result.inactive).toBe(1);
      expect(result.bySpecialty).toBeDefined();
      expect(Array.isArray(result.bySpecialty)).toBe(true);
    });

    it('should return specialty breakdown', async () => {
      const result = await providerService.getProviderStats(testClinic._id.toString());

      const generalSpecialty = result.bySpecialty.find(s => s.specialty === 'general_dentistry');
      const orthoSpecialty = result.bySpecialty.find(s => s.specialty === 'orthodontics');

      expect(generalSpecialty).toBeDefined();
      expect(generalSpecialty!.count).toBe(2); // One active, one inactive but still counted
      expect(orthoSpecialty).toBeDefined();
      expect(orthoSpecialty!.count).toBe(1);
    });

    it('should throw error for invalid clinic ID', async () => {
      await expect(
        providerService.getProviderStats('invalid-id')
      ).rejects.toThrow('ID da clínica inválido');
    });
  });

  describe('reactivateProvider', () => {
    it('should reactivate inactive provider', async () => {
      const providerData = {
        name: 'Dr. Reactivate Test',
        email: 'reactivate@example.com',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      };

      const createdProvider = await providerService.createProvider(providerData);
      const providerId = (createdProvider._id as mongoose.Types.ObjectId).toString();

      // Deactivate provider
      await providerService.deleteProvider(providerId, testClinic._id.toString());

      // Reactivate provider
      const result = await providerService.reactivateProvider(providerId, testClinic._id.toString());

      expect(result).toBeDefined();
      expect(result!.isActive).toBe(true);
    });

    it('should throw error for non-existent provider', async () => {
      await expect(
        providerService.reactivateProvider('507f1f77bcf86cd799439011', testClinic._id.toString())
      ).rejects.toThrow('Profissional inativo não encontrado');
    });

    it('should throw error for active provider', async () => {
      const providerData = {
        name: 'Dr. Already Active',
        email: 'alreadyactive@example.com',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      };

      const createdProvider = await providerService.createProvider(providerData);
      const providerId = (createdProvider._id as any).toString();

      await expect(
        providerService.reactivateProvider(providerId, testClinic._id.toString())
      ).rejects.toThrow('Profissional inativo não encontrado');
    });

    it('should throw error for duplicate email when reactivating', async () => {
      // Create first provider
      await providerService.createProvider({
        name: 'Dr. First',
        email: 'conflict@example.com',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      });

      // Create and deactivate second provider with same email
      const secondProvider = await providerService.createProvider({
        name: 'Dr. Second',
        email: 'conflict@example.com',
        specialties: ['general_dentistry'],
        clinicId: testClinic._id.toString()
      });

      await providerService.deleteProvider((secondProvider._id as any).toString(), testClinic._id.toString());

      // Try to reactivate second provider
      await expect(
        providerService.reactivateProvider((secondProvider._id as any).toString(), testClinic._id.toString())
      ).rejects.toThrow('Já existe um profissional ativo com este e-mail nesta clínica');
    });
  });
});
