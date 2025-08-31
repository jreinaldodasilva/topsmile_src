import { Contact, IContact } from '../models/Contact';
import { FilterQuery } from 'mongoose';

export interface CreateContactData {
  name: string;
  email: string;
  clinic: string;
  specialty: string;
  phone: string;
  source?: string;
}

export interface ContactFilters {
  status?: string;
  source?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ContactListResponse {
  contacts: IContact[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

class ContactService {
  /**
   * FIXED: Create contact with atomic operation to prevent race conditions
   */
  async createContact(data: CreateContactData): Promise<IContact> {
    try {
      // FIXED: Use findOneAndUpdate with upsert for atomic operation
      // This prevents race conditions between check and create/update
      const updatedContact = await Contact.findOneAndUpdate(
        { email: data.email }, // Find by email
        {
          $set: {
            name: data.name,
            clinic: data.clinic,
            specialty: data.specialty,
            phone: data.phone,
            status: 'new', // Reset status to new for existing contacts
            source: data.source || 'website_contact_form'
          }
        },
        { 
          new: true,                 // Return the updated document
          upsert: true,              // Create if doesn't exist
          runValidators: true,       // Run schema validators
          setDefaultsOnInsert: true  // Set default values when creating
        }
      );

      return updatedContact;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  /**
   * IMPROVED: Create contact with better error handling and validation
   */
  async createContactSafe(data: CreateContactData): Promise<{
    contact: IContact;
    isNew: boolean;
    message: string;
  }> {
    try {
      // Validate required fields
      if (!data.email || !data.name || !data.clinic || !data.specialty) {
        throw new Error('Campos obrigatórios não fornecidos');
      }

      // Check if contact exists first to determine if it's new or updated
      const existingContact = await Contact.findOne({ email: data.email }).lean();
      const isNew = !existingContact;

      // Use atomic operation
      const updatedContact = await Contact.findOneAndUpdate(
        { email: data.email },
        {
          $set: {
            name: data.name,
            clinic: data.clinic,
            specialty: data.specialty,
            phone: data.phone,
            source: data.source || 'website_contact_form',
            ...(existingContact ? { status: 'new' } : {}) // Only reset status if updating
          }
        },
        { 
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true
        }
      );

      return {
        contact: updatedContact,
        isNew,
        message: isNew ? 'Contato criado com sucesso' : 'Contato atualizado com sucesso'
      };
    } catch (error) {
      console.error('Error creating contact safely:', error);
      throw error;
    }
  }

  /**
   * ADDED: Batch create contacts with atomic operations
   */
  async createMultipleContacts(contactsData: CreateContactData[]): Promise<{
    created: number;
    updated: number;
    failed: Array<{ email: string; error: string }>;
    contacts: IContact[];
  }> {
    const results = {
      created: 0,
      updated: 0,
      failed: [] as Array<{ email: string; error: string }>,
      contacts: [] as IContact[]
    };

    for (const data of contactsData) {
      try {
        const result = await this.createContactSafe(data);
        
        if (result.isNew) {
          results.created++;
        } else {
          results.updated++;
        }
        
        results.contacts.push(result.contact);
      } catch (error) {
        results.failed.push({
          email: data.email,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    return results;
  }

  async getContactById(id: string): Promise<IContact | null> {
    try {
      return await Contact.findById(id).populate('assignedTo', 'name email');
    } catch (error) {
      console.error('Error fetching contact:', error);
      throw error;
    }
  }

  /**
   * IMPROVED: Get contact by email with better error handling
   */
  async getContactByEmail(email: string): Promise<IContact | null> {
    try {
      if (!email) {
        throw new Error('E-mail é obrigatório');
      }

      return await Contact.findOne({ email: email.toLowerCase().trim() })
        .populate('assignedTo', 'name email');
    } catch (error) {
      console.error('Error fetching contact by email:', error);
      throw error;
    }
  }

  async getContacts(
    filters: ContactFilters = {},
    pagination: PaginationOptions
  ): Promise<ContactListResponse> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      const skip = (page - 1) * limit;

      // Build query
      const query: FilterQuery<IContact> = {};

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.source) {
        query.source = filters.source;
      }

      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) {
          query.createdAt.$gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          query.createdAt.$lte = filters.dateTo;
        }
      }

      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } },
          { clinic: { $regex: filters.search, $options: 'i' } },
          { specialty: { $regex: filters.search, $options: 'i' } }
        ];
      }

      // Execute query with pagination
      const [contacts, total] = await Promise.all([
        Contact.find(query)
          .populate('assignedTo', 'name email')
          .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
          .skip(skip)
          .limit(limit),
        Contact.countDocuments(query)
      ]);

      const pages = Math.ceil(total / limit);

      return {
        contacts,
        total,
        page,
        pages,
        limit
      };
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }

  /**
   * IMPROVED: Update contact with atomic operation
   */
  async updateContact(id: string, updates: Partial<IContact>): Promise<IContact | null> {
    try {
      // Remove fields that shouldn't be updated directly
      const { _id, createdAt, updatedAt, ...safeUpdates } = updates as any;

      return await Contact.findByIdAndUpdate(
        id,
        { $set: safeUpdates },
        { 
          new: true, 
          runValidators: true,
          upsert: false // Don't create if doesn't exist
        }
      ).populate('assignedTo', 'name email');
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  /**
   * IMPROVED: Batch update contacts
   */
  async updateContactStatus(
    contactIds: string[],
    status: IContact['status'],
    assignedTo?: string
  ): Promise<{ modifiedCount: number; matchedCount: number }> {
    try {
      const updateData: any = { status };
      
      if (assignedTo) {
        updateData.assignedTo = assignedTo;
      }

      const result = await Contact.updateMany(
        { _id: { $in: contactIds } },
        { $set: updateData },
        { runValidators: true }
      );

      return {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      };
    } catch (error) {
      console.error('Error updating contact status:', error);
      throw error;
    }
  }

  async deleteContact(id: string): Promise<boolean> {
    try {
      const result = await Contact.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  /**
   * IMPROVED: Soft delete with atomic operation
   */
  async softDeleteContact(id: string, deletedBy?: string): Promise<IContact | null> {
    try {
      return await Contact.findByIdAndUpdate(
        id,
        {
          $set: {
            status: 'deleted',
            deletedAt: new Date(),
            deletedBy: deletedBy
          }
        },
        { new: true, runValidators: true }
      );
    } catch (error) {
      console.error('Error soft deleting contact:', error);
      throw error;
    }
  }

  /**
   * IMPROVED: Get contact stats with better aggregation
   */
  async getContactStats(): Promise<{
    total: number;
    byStatus: Array<{ _id: string; count: number }>;
    bySource: Array<{ _id: string; count: number }>;
    recentCount: number;
    monthlyTrend: Array<{ month: string; count: number }>;
  }> {
    try {
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

      const [total, byStatus, bySource, recentCount, monthlyTrend] = await Promise.all([
        // Total contacts (excluding deleted)
        Contact.countDocuments({ status: { $ne: 'deleted' } }),
        
        // By status
        Contact.aggregate([
          { $match: { status: { $ne: 'deleted' } } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        
        // By source
        Contact.aggregate([
          { $match: { status: { $ne: 'deleted' } } },
          { $group: { _id: '$source', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        
        // Recent count (last week)
        Contact.countDocuments({ 
          createdAt: { $gte: lastWeek },
          status: { $ne: 'deleted' }
        }),
        
        // Monthly trend (last 12 months)
        Contact.aggregate([
          { 
            $match: { 
              createdAt: { $gte: lastYear },
              status: { $ne: 'deleted' }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              count: { $sum: 1 }
            }
          },
          {
            $project: {
              month: {
                $concat: [
                  { $toString: '$_id.year' },
                  '-',
                  { $toString: '$_id.month' }
                ]
              },
              count: 1,
              _id: 0
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ])
      ]);

      return {
        total,
        byStatus,
        bySource,
        recentCount,
        monthlyTrend
      };
    } catch (error) {
      console.error('Error fetching contact stats:', error);
      throw error;
    }
  }

  /**
   * ADDED: Find duplicate contacts by email
   */
  async findDuplicateContacts(): Promise<Array<{
    email: string;
    contacts: IContact[];
    count: number;
  }>> {
    try {
      const duplicates = await Contact.aggregate([
        {
          $match: { status: { $ne: 'deleted' } }
        },
        {
          $group: {
            _id: '$email',
            contacts: { $push: '$$ROOT' },
            count: { $sum: 1 }
          }
        },
        {
          $match: { count: { $gt: 1 } }
        },
        {
          $project: {
            email: '$_id',
            contacts: 1,
            count: 1,
            _id: 0
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      return duplicates;
    } catch (error) {
      console.error('Error finding duplicate contacts:', error);
      throw error;
    }
  }

  /**
   * ADDED: Merge duplicate contacts
   */
  async mergeDuplicateContacts(
    primaryContactId: string,
    duplicateContactIds: string[]
  ): Promise<IContact> {
    try {
      // Get the primary contact
      const primaryContact = await Contact.findById(primaryContactId);
      if (!primaryContact) {
        throw new Error('Contato principal não encontrado');
      }

      // Get duplicate contacts to merge data
      const duplicateContacts = await Contact.find({
        _id: { $in: duplicateContactIds }
      });

      // Merge data (you can customize this logic based on business rules)
      const mergedData: any = {};
      
      // Collect all sources
      const sources = [primaryContact.source, ...duplicateContacts.map(c => c.source)]
        .filter(Boolean);
      if (sources.length > 0) {
        mergedData.source = sources.join(', ');
      }

      // Use most recent data for other fields
      const allContacts = [primaryContact, ...duplicateContacts]
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      const mostRecent = allContacts[0];
      mergedData.name = mostRecent.name;
      mergedData.phone = mostRecent.phone;
      mergedData.clinic = mostRecent.clinic;
      mergedData.specialty = mostRecent.specialty;

      // Update primary contact with merged data
      const updatedContact = await Contact.findByIdAndUpdate(
        primaryContactId,
        { $set: mergedData },
        { new: true, runValidators: true }
      );

      // Soft delete duplicate contacts
      await Contact.updateMany(
        { _id: { $in: duplicateContactIds } },
        { 
          $set: { 
            status: 'merged',
            mergedInto: primaryContactId,
            deletedAt: new Date()
          }
        }
      );

      return updatedContact!;
    } catch (error) {
      console.error('Error merging duplicate contacts:', error);
      throw error;
    }
  }
}

export const contactService = new ContactService();