import { contactService } from '../../../src/services/contactService';
import { Contact } from '../../../src/models/Contact';
import { createTestClinic } from '../../testHelpers';

describe('ContactService', () => {
  let testClinic: any;

  beforeEach(async () => {
    testClinic = await createTestClinic();
  });

  describe('createContact', () => {
    it('should create a new contact successfully', async () => {
      const contactData = {
        name: 'João Silva',
        email: 'joao.silva@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia Geral',
        phone: '(11) 99999-9999',
        source: 'website'
      };

      const result = await contactService.createContact(contactData);

      expect(result).toBeDefined();
      expect(result.name).toBe(contactData.name);
      expect(result.email).toBe(contactData.email);
      expect(result.clinic.toString()).toBe(testClinic._id.toString());
      expect(result.specialty).toBe(contactData.specialty);
      expect(result.phone).toBe(contactData.phone);
      expect(result.source).toBe(contactData.source);
      expect(result.status).toBe('new');
    });

    it('should create contact with default source', async () => {
      const contactData = {
        name: 'Maria Santos',
        email: 'maria@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Ortodontia',
        phone: '(11) 88888-8888'
      };

      const result = await contactService.createContact(contactData);

      expect(result).toBeDefined();
      expect(result.source).toBe('website_contact_form');
    });

    it('should update existing contact when email already exists', async () => {
      const contactData1 = {
        name: 'João Silva',
        email: 'joao@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia Geral',
        phone: '(11) 99999-9999'
      };

      const contactData2 = {
        name: 'João Silva Atualizado',
        email: 'joao@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Ortodontia',
        phone: '(11) 88888-8888'
      };

      const firstResult = await contactService.createContact(contactData1);
      const secondResult = await contactService.createContact(contactData2);

      expect(secondResult.name).toBe(contactData2.name);
      expect(secondResult.specialty).toBe(contactData2.specialty);
      expect(secondResult.phone).toBe(contactData2.phone);
      expect(secondResult.status).toBe('new'); // Status reset to new
    });
  });

  describe('createContactSafe', () => {
    it('should create new contact and return isNew true', async () => {
      const contactData = {
        name: 'Pedro Costa',
        email: 'pedro@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia',
        phone: '(11) 77777-7777'
      };

      const result = await contactService.createContactSafe(contactData);

      expect(result.contact).toBeDefined();
      expect(result.isNew).toBe(true);
      expect(result.message).toBe('Contato criado com sucesso');
      expect(result.contact.name).toBe(contactData.name);
    });

    it('should update existing contact and return isNew false', async () => {
      const contactData1 = {
        name: 'Ana Oliveira',
        email: 'ana@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia',
        phone: '(11) 66666-6666'
      };

      const contactData2 = {
        name: 'Ana Oliveira Silva',
        email: 'ana@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Ortodontia',
        phone: '(11) 55555-5555'
      };

      await contactService.createContactSafe(contactData1);
      const result = await contactService.createContactSafe(contactData2);

      expect(result.contact).toBeDefined();
      expect(result.isNew).toBe(false);
      expect(result.message).toBe('Contato atualizado com sucesso');
      expect(result.contact.name).toBe(contactData2.name);
    });

    it('should throw error for missing required fields', async () => {
      const invalidData = {
        name: 'Test User',
        email: '', // Missing email
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia',
        phone: '(11) 99999-9999'
      };

      await expect(
        contactService.createContactSafe(invalidData as any)
      ).rejects.toThrow('Campos obrigatórios não fornecidos');
    });
  });

  describe('createMultipleContacts', () => {
    it('should create multiple new contacts successfully', async () => {
      const contactsData = [
        {
          name: 'Contact 1',
          email: 'contact1@example.com',
          clinic: testClinic._id.toString(),
          specialty: 'Odontologia',
          phone: '(11) 11111-1111'
        },
        {
          name: 'Contact 2',
          email: 'contact2@example.com',
          clinic: testClinic._id.toString(),
          specialty: 'Ortodontia',
          phone: '(11) 22222-2222'
        }
      ];

      const result = await contactService.createMultipleContacts(contactsData);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.failed.length).toBe(0);
      expect(result.contacts.length).toBe(2);
    });

    it('should handle mix of new and existing contacts', async () => {
      // Create first contact
      await contactService.createContact({
        name: 'Existing Contact',
        email: 'existing@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia',
        phone: '(11) 99999-9999'
      });

      const contactsData = [
        {
          name: 'Existing Contact Updated',
          email: 'existing@example.com',
          clinic: testClinic._id.toString(),
          specialty: 'Ortodontia',
          phone: '(11) 88888-8888'
        },
        {
          name: 'New Contact',
          email: 'new@example.com',
          clinic: testClinic._id.toString(),
          specialty: 'Odontologia',
          phone: '(11) 77777-7777'
        }
      ];

      const result = await contactService.createMultipleContacts(contactsData);

      expect(result.created).toBe(1);
      expect(result.updated).toBe(1);
      expect(result.failed.length).toBe(0);
      expect(result.contacts.length).toBe(2);
    });

    it('should handle errors in batch creation', async () => {
      const contactsData = [
        {
          name: 'Valid Contact',
          email: 'valid@example.com',
          clinic: testClinic._id.toString(),
          specialty: 'Odontologia',
          phone: '(11) 99999-9999'
        },
        {
          name: 'Invalid Contact',
          email: '', // Invalid email
          clinic: testClinic._id.toString(),
          specialty: 'Odontologia',
          phone: '(11) 88888-8888'
        }
      ];

      const result = await contactService.createMultipleContacts(contactsData);

      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.failed.length).toBe(1);
      expect(result.failed[0].email).toBe('');
      expect(result.contacts.length).toBe(1);
    });
  });

  describe('getContactById', () => {
    it('should return contact by ID', async () => {
      const contactData = {
        name: 'Get By ID Test',
        email: 'getbyid@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia',
        phone: '(11) 99999-9999'
      };

      const createdContact = await contactService.createContact(contactData);

      const result = await contactService.getContactById(createdContact.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(createdContact.id);
      expect(result!.name).toBe(contactData.name);
    });

    it('should return null for non-existent contact', async () => {
      const result = await contactService.getContactById('507f1f77bcf86cd799439011');

      expect(result).toBeNull();
    });
  });

  describe('getContactByEmail', () => {
    it('should return contact by email', async () => {
      const contactData = {
        name: 'Get By Email Test',
        email: 'getbyemail@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia',
        phone: '(11) 99999-9999'
      };

      const createdContact = await contactService.createContact(contactData);

      const result = await contactService.getContactByEmail(contactData.email);

      expect(result).toBeDefined();
      expect(result!.email).toBe(contactData.email);
      expect(result!.name).toBe(contactData.name);
    });

    it('should handle email case insensitivity', async () => {
      const contactData = {
        name: 'Case Test',
        email: 'casetest@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia',
        phone: '(11) 99999-9999'
      };

      await contactService.createContact(contactData);

      const result = await contactService.getContactByEmail('CASETEST@EXAMPLE.COM');

      expect(result).toBeDefined();
      expect(result!.email).toBe(contactData.email);
    });

    it('should throw error for empty email', async () => {
      await expect(
        contactService.getContactByEmail('')
      ).rejects.toThrow('E-mail é obrigatório');
    });
  });

  describe('getContacts', () => {
    beforeEach(async () => {
      // Create test contacts
      await contactService.createContact({
        name: 'João Silva',
        email: 'joao@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia Geral',
        phone: '(11) 99999-9999',
        source: 'website'
      });

      await contactService.createContact({
        name: 'Maria Santos',
        email: 'maria@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Ortodontia',
        phone: '(11) 88888-8888',
        source: 'referral'
      });

      await contactService.createContact({
        name: 'Pedro Costa',
        email: 'pedro@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia Geral',
        phone: '(11) 77777-7777',
        source: 'website'
      });
    });

    it('should return all contacts with pagination', async () => {
      const result = await contactService.getContacts({}, { page: 1, limit: 10 });

      expect(result).toBeDefined();
      expect(result.contacts.length).toBe(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.pages).toBe(1);
    });

    it('should filter by status', async () => {
      const result = await contactService.getContacts(
        { status: 'new' },
        { page: 1, limit: 10 }
      );

      expect(result.contacts.length).toBe(3); // All are new by default
    });

    it('should filter by source', async () => {
      const result = await contactService.getContacts(
        { source: 'website' },
        { page: 1, limit: 10 }
      );

      expect(result.contacts.length).toBe(2);
    });

    it('should filter by date range', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await contactService.getContacts(
        { dateFrom: yesterday, dateTo: tomorrow },
        { page: 1, limit: 10 }
      );

      expect(result.contacts.length).toBe(3);
    });

    it('should search by name', async () => {
      const result = await contactService.getContacts(
        { search: 'João' },
        { page: 1, limit: 10 }
      );

      expect(result.contacts.length).toBe(1);
      expect(result.contacts[0].name).toBe('João Silva');
    });

    it('should search by email', async () => {
      const result = await contactService.getContacts(
        { search: 'maria@example.com' },
        { page: 1, limit: 10 }
      );

      expect(result.contacts.length).toBe(1);
      expect(result.contacts[0].email).toBe('maria@example.com');
    });

    it('should paginate results', async () => {
      const result = await contactService.getContacts(
        {},
        { page: 1, limit: 2 }
      );

      expect(result.contacts.length).toBe(2);
      expect(result.total).toBe(3);
      expect(result.pages).toBe(2);
    });

    it('should sort results', async () => {
      const result = await contactService.getContacts(
        {},
        { page: 1, limit: 10, sortBy: 'name', sortOrder: 'asc' }
      );

      expect(result.contacts[0].name).toBe('João Silva');
      expect(result.contacts[1].name).toBe('Maria Santos');
      expect(result.contacts[2].name).toBe('Pedro Costa');
    });
  });

  describe('updateContact', () => {
    it('should update contact successfully', async () => {
      const contactData = {
        name: 'Original Name',
        email: 'original@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia',
        phone: '(11) 99999-9999'
      };

      const createdContact = await contactService.createContact(contactData);
      const contactId = createdContact.id;

      const updateData = {
        name: 'Updated Name',
        specialty: 'Ortodontia',
        status: 'contacted' as const
      };

      const result = await contactService.updateContact(contactId, updateData);

      expect(result).toBeDefined();
      expect(result!.name).toBe(updateData.name);
      expect(result!.specialty).toBe(updateData.specialty);
      expect(result!.status).toBe(updateData.status);
    });

    it('should not update protected fields', async () => {
      const contactData = {
        name: 'Protected Fields Test',
        email: 'protected@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia',
        phone: '(11) 99999-9999'
      };

      const createdContact = await contactService.createContact(contactData);
      const contactId = (createdContact._id as any).toString();
      const originalCreatedAt = createdContact.createdAt;

      const updateData = {
        _id: 'fake-id',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-01')
      };

      const result = await contactService.updateContact(contactId, updateData);

      expect(result).toBeDefined();
      expect(result!.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });

    it('should return null for non-existent contact', async () => {
      const updateData = { name: 'New Name' };

      const result = await contactService.updateContact('507f1f77bcf86cd799439011', updateData);

      expect(result).toBeNull();
    });
  });

  describe('updateContactStatus', () => {
    it('should update status for multiple contacts', async () => {
      const contact1 = await contactService.createContact({
        name: 'Contact 1',
        email: 'contact1@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia',
        phone: '(11) 11111-1111'
      });

      const contact2 = await contactService.createContact({
        name: 'Contact 2',
        email: 'contact2@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia',
        phone: '(11) 22222-2222'
      });

      const result = await contactService.updateContactStatus(
        [contact1.id, contact2.id],
        'contacted'
      );

      expect(result.modifiedCount).toBe(2);
      expect(result.matchedCount).toBe(2);
    });

    it('should update status and assign contact', async () => {
      const contact = await contactService.createContact({
        name: 'Assign Test',
        email: 'assign@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia',
        phone: '(11) 99999-9999'
      });

      const assignedToId = '507f1f77bcf86cd799439011'; // Mock user ID

      const result = await contactService.updateContactStatus(
        [contact.id],
        'qualified',
        assignedToId
      );

      expect(result.modifiedCount).toBe(1);
      expect(result.matchedCount).toBe(1);
    });
  });

  describe('deleteContact', () => {
    it('should delete contact successfully', async () => {
      const contactData = {
        name: 'Delete Test',
        email: 'delete@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia',
        phone: '(11) 99999-9999'
      };

      const createdContact = await contactService.createContact(contactData);
      const contactId = createdContact.id;

      const result = await contactService.deleteContact(contactId);

      expect(result).toBe(true);

      // Verify contact is deleted
      const deletedContact = await Contact.findById(contactId);
      expect(deletedContact).toBeNull();
    });

    it('should return false for non-existent contact', async () => {
      const result = await contactService.deleteContact('507f1f77bcf86cd799439011');

      expect(result).toBe(false);
    });
  });

  describe('softDeleteContact', () => {
    it('should soft delete contact successfully', async () => {
      const contactData = {
        name: 'Soft Delete Test',
        email: 'softdelete@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia',
        phone: '(11) 99999-9999'
      };

      const createdContact = await contactService.createContact(contactData);
      const contactId = createdContact.id;

      const result = await contactService.softDeleteContact(contactId, 'user123');

      expect(result).toBeDefined();
      expect(result!.status).toBe('deleted');
      expect(result!.deletedAt).toBeDefined();
      expect(result!.deletedBy).toBe('user123');
    });

    it('should return null for non-existent contact', async () => {
      const result = await contactService.softDeleteContact('507f1f77bcf86cd799439011');

      expect(result).toBeNull();
    });
  });

  describe('getContactStats', () => {
    beforeEach(async () => {
      // Create contacts with different statuses and sources
      await contactService.createContact({
        name: 'New Contact',
        email: 'new@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia',
        phone: '(11) 11111-1111',
        source: 'website'
      });

      await contactService.createContact({
        name: 'Contacted Contact',
        email: 'contacted@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Ortodontia',
        phone: '(11) 22222-2222',
        source: 'referral'
      });

      // Update one contact to contacted status
      const contactedContact = await contactService.getContactByEmail('contacted@example.com');
      if (contactedContact) {
        await contactService.updateContact(contactedContact.id, { status: 'contacted' });
      }
    });

    it('should return correct contact statistics', async () => {
      const result = await contactService.getContactStats();

      expect(result).toBeDefined();
      expect(result.total).toBe(2);
      expect(Array.isArray(result.byStatus)).toBe(true);
      expect(Array.isArray(result.bySource)).toBe(true);
      expect(typeof result.recentCount).toBe('number');
      expect(Array.isArray(result.monthlyTrend)).toBe(true);
    });

    it('should return status breakdown', async () => {
      const result = await contactService.getContactStats();

      const newStatus = result.byStatus.find(s => s._id === 'new');
      const contactedStatus = result.byStatus.find(s => s._id === 'contacted');

      expect(newStatus).toBeDefined();
      expect(newStatus!.count).toBe(1);
      expect(contactedStatus).toBeDefined();
      expect(contactedStatus!.count).toBe(1);
    });

    it('should return source breakdown', async () => {
      const result = await contactService.getContactStats();

      const websiteSource = result.bySource.find(s => s._id === 'website');
      const referralSource = result.bySource.find(s => s._id === 'referral');

      expect(websiteSource).toBeDefined();
      expect(websiteSource!.count).toBe(1);
      expect(referralSource).toBeDefined();
      expect(referralSource!.count).toBe(1);
    });
  });

  describe('findDuplicateContacts', () => {
    beforeEach(async () => {
      // Create contacts with duplicate emails
      await contactService.createContact({
        name: 'João Silva',
        email: 'duplicate@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia',
        phone: '(11) 99999-9999'
      });

      await contactService.createContact({
        name: 'João Silva 2',
        email: 'duplicate@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Ortodontia',
        phone: '(11) 88888-8888'
      });

      await contactService.createContact({
        name: 'Unique Contact',
        email: 'unique@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia',
        phone: '(11) 77777-7777'
      });
    });

    it('should find duplicate contacts by email', async () => {
      const result = await contactService.findDuplicateContacts();

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].email).toBe('duplicate@example.com');
      expect(result[0].count).toBe(2);
      expect(result[0].contacts.length).toBe(2);
    });

    it('should return empty array when no duplicates', async () => {
      // Delete duplicates first
      const duplicates = await contactService.findDuplicateContacts();
      for (const dup of duplicates) {
        await contactService.deleteContact(dup.contacts[1].id);
      }

      const result = await contactService.findDuplicateContacts();

      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });
  });

  describe('mergeDuplicateContacts', () => {
    it('should merge duplicate contacts successfully', async () => {
      // Create duplicate contacts
      const contact1 = await contactService.createContact({
        name: 'João Silva',
        email: 'merge@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Odontologia',
        phone: '(11) 99999-9999',
        source: 'website'
      });

      const contact2 = await contactService.createContact({
        name: 'João Silva Atualizado',
        email: 'merge@example.com',
        clinic: testClinic._id.toString(),
        specialty: 'Ortodontia',
        phone: '(11) 88888-8888',
        source: 'referral'
      });

      const result = await contactService.mergeDuplicateContacts(
        contact1.id,
        [contact2.id]
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('João Silva Atualizado'); // Most recent data
      expect(result.specialty).toBe('Ortodontia');
      expect(result.phone).toBe('(11) 88888-8888');
      expect(result.source).toContain('website');
      expect(result.source).toContain('referral');

      // Check that duplicate was marked as merged
      const mergedContact = await Contact.findById(contact2.id);
      expect(mergedContact!.status).toBe('merged');
      expect(mergedContact!.mergedInto?.toString()).toBe(contact1.id);
    });

    it('should throw error for non-existent primary contact', async () => {
      await expect(
        contactService.mergeDuplicateContacts('507f1f77bcf86cd799439011', [])
      ).rejects.toThrow('Contato principal não encontrado');
    });
  });
});
