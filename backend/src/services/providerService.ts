// backend/src/services/providerService.ts
import { Provider, IProvider } from '../models/Provider';
import { User } from '../models/User';
import mongoose from 'mongoose';

export interface CreateProviderData {
    name: string;
    email?: string;
    phone?: string;
    specialties: string[];
    licenseNumber?: string;
    workingHours?: {
        monday: { start: string; end: string; isWorking: boolean };
        tuesday: { start: string; end: string; isWorking: boolean };
        wednesday: { start: string; end: string; isWorking: boolean };
        thursday: { start: string; end: string; isWorking: boolean };
        friday: { start: string; end: string; isWorking: boolean };
        saturday: { start: string; end: string; isWorking: boolean };
        sunday: { start: string; end: string; isWorking: boolean };
    };
    timeZone?: string;
    bufferTimeBefore?: number;
    bufferTimeAfter?: number;
    appointmentTypes?: string[];
    clinicId: string;
    userId?: string; // Optional link to User account
}

export interface UpdateProviderData extends Partial<CreateProviderData> {
    isActive?: boolean;
}

export interface ProviderSearchFilters {
    clinicId: string;
    search?: string;
    isActive?: boolean;
    specialties?: string[];
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ProviderSearchResult {
    providers: IProvider[];
    total: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

class ProviderService {
    // Default working hours template
    private getDefaultWorkingHours() {
        return {
            monday: { start: '08:00', end: '18:00', isWorking: true },
            tuesday: { start: '08:00', end: '18:00', isWorking: true },
            wednesday: { start: '08:00', end: '18:00', isWorking: true },
            thursday: { start: '08:00', end: '18:00', isWorking: true },
            friday: { start: '08:00', end: '18:00', isWorking: true },
            saturday: { start: '08:00', end: '12:00', isWorking: false },
            sunday: { start: '08:00', end: '12:00', isWorking: false }
        };
    }

    // Create a new provider
    async createProvider(data: CreateProviderData): Promise<IProvider> {
        try {
            // Validate required fields
            if (!data.name || !data.clinicId) {
                throw new Error('Nome e clínica são obrigatórios');
            }

            // Validate clinic ID
            if (!mongoose.Types.ObjectId.isValid(data.clinicId)) {
                throw new Error('ID da clínica inválido');
            }

            // Validate user ID if provided
            if (data.userId && !mongoose.Types.ObjectId.isValid(data.userId)) {
                throw new Error('ID do usuário inválido');
            }

            // Check if provider with same email already exists in the clinic
            if (data.email) {
                const existingProvider = await Provider.findOne({
                    email: data.email.toLowerCase(),
                    clinic: data.clinicId,
                    isActive: true
                });

                if (existingProvider) {
                    throw new Error('Já existe um profissional ativo com este e-mail nesta clínica');
                }
            }

            // Validate user exists and belongs to the clinic if userId is provided
            if (data.userId) {
                const user = await User.findOne({
                    _id: data.userId,
                    clinic: data.clinicId,
                    isActive: true
                });

                if (!user) {
                    throw new Error('Usuário não encontrado ou não pertence a esta clínica');
                }

                // Check if user is already linked to another provider
                const existingProviderWithUser = await Provider.findOne({
                    user: data.userId,
                    clinic: data.clinicId,
                    isActive: true
                });

                if (existingProviderWithUser) {
                    throw new Error('Este usuário já está vinculado a outro profissional');
                }
            }

            // Validate appointment types if provided
            if (data.appointmentTypes && data.appointmentTypes.length > 0) {
                for (const typeId of data.appointmentTypes) {
                    if (!mongoose.Types.ObjectId.isValid(typeId)) {
                        throw new Error('ID de tipo de agendamento inválido');
                    }
                }
            }

            const provider = new Provider({
                ...data,
                clinic: data.clinicId,
                user: data.userId || undefined,
                email: data.email?.toLowerCase(),
                workingHours: data.workingHours || this.getDefaultWorkingHours(),
                timeZone: data.timeZone || 'America/Sao_Paulo',
                bufferTimeBefore: data.bufferTimeBefore || 15,
                bufferTimeAfter: data.bufferTimeAfter || 15,
                appointmentTypes: data.appointmentTypes || [],
                isActive: true
            });

            return await provider.save();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao criar profissional');
        }
    }

    // Get provider by ID
    async getProviderById(providerId: string, clinicId: string): Promise<IProvider | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(providerId)) {
                throw new Error('ID do profissional inválido');
            }

            const provider = await Provider.findOne({
                _id: providerId,
                clinic: clinicId
            })
            .populate('clinic', 'name')
            .populate('user', 'name email role')
            .populate('appointmentTypes', 'name duration color category');

            return provider;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao buscar profissional');
        }
    }

    // Update provider
    async updateProvider(providerId: string, clinicId: string, data: UpdateProviderData): Promise<IProvider | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(providerId)) {
                throw new Error('ID do profissional inválido');
            }

            const provider = await Provider.findOne({
                _id: providerId,
                clinic: clinicId
            });

            if (!provider) {
                throw new Error('Profissional não encontrado');
            }

            // Check for duplicate email if email is being updated
            if (data.email && data.email.toLowerCase() !== provider.email) {
                const existingProvider = await Provider.findOne({
                    email: data.email.toLowerCase(),
                    clinic: clinicId,
                    isActive: true,
                    _id: { $ne: providerId }
                });

                if (existingProvider) {
                    throw new Error('Já existe um profissional ativo com este e-mail nesta clínica');
                }
            }

            // Validate user if being updated
            if (data.userId) {
                if (!mongoose.Types.ObjectId.isValid(data.userId)) {
                    throw new Error('ID do usuário inválido');
                }

                const user = await User.findOne({
                    _id: data.userId,
                    clinic: clinicId,
                    isActive: true
                });

                if (!user) {
                    throw new Error('Usuário não encontrado ou não pertence a esta clínica');
                }

                // Check if user is already linked to another provider
                const existingProviderWithUser = await Provider.findOne({
                    user: data.userId,
                    clinic: clinicId,
                    isActive: true,
                    _id: { $ne: providerId }
                });

                if (existingProviderWithUser) {
                    throw new Error('Este usuário já está vinculado a outro profissional');
                }
            }

            // Validate appointment types if provided
            if (data.appointmentTypes && data.appointmentTypes.length > 0) {
                for (const typeId of data.appointmentTypes) {
                    if (!mongoose.Types.ObjectId.isValid(typeId)) {
                        throw new Error('ID de tipo de agendamento inválido');
                    }
                }
            }

            // Update provider data
            Object.keys(data).forEach(key => {
                if (key === 'email' && data.email) {
                    (provider as any)[key] = data.email.toLowerCase();
                } else if (key === 'userId') {
                    provider.user = data.userId ? new mongoose.Types.ObjectId(data.userId) : undefined;
                } else if (data[key as keyof UpdateProviderData] !== undefined) {
                    (provider as any)[key] = data[key as keyof UpdateProviderData];
                }
            });

            return await provider.save();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao atualizar profissional');
        }
    }

    // Delete provider (soft delete by setting isActive to false)
    async deleteProvider(providerId: string, clinicId: string): Promise<boolean> {
        try {
            if (!mongoose.Types.ObjectId.isValid(providerId)) {
                throw new Error('ID do profissional inválido');
            }

            const provider = await Provider.findOneAndUpdate(
                {
                    _id: providerId,
                    clinic: clinicId
                },
                {
                    isActive: false
                },
                { new: true }
            );

            return !!provider;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao excluir profissional');
        }
    }

    // Search providers with filters and pagination
    async searchProviders(filters: ProviderSearchFilters): Promise<ProviderSearchResult> {
        try {
            const {
                clinicId,
                search,
                isActive = true,
                specialties,
                page = 1,
                limit = 20,
                sortBy = 'name',
                sortOrder = 'asc'
            } = filters;

            if (!mongoose.Types.ObjectId.isValid(clinicId)) {
                throw new Error('ID da clínica inválido');
            }

            // Build query
            const query: any = {
                clinic: clinicId,
                isActive
            };

            // Add search functionality
            if (search && search.trim()) {
                const searchRegex = new RegExp(search.trim(), 'i');
                query.$or = [
                    { name: searchRegex },
                    { email: searchRegex },
                    { phone: searchRegex },
                    { licenseNumber: searchRegex },
                    { specialties: { $in: [searchRegex] } }
                ];
            }

            // Filter by specialties
            if (specialties && specialties.length > 0) {
                query.specialties = { $in: specialties };
            }

            // Calculate pagination
            const skip = (page - 1) * limit;
            const sortOptions: any = {};
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

            // Execute query with pagination
            const [providers, total] = await Promise.all([
                Provider.find(query)
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(limit)
                    .populate('clinic', 'name')
                    .populate('user', 'name email role')
                    .populate('appointmentTypes', 'name duration color category'),
                Provider.countDocuments(query)
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                providers,
                total,
                page,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            };
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao buscar profissionais');
        }
    }

    // Get providers by clinic
    async getProvidersByClinic(clinicId: string, isActive: boolean = true): Promise<IProvider[]> {
        try {
            if (!mongoose.Types.ObjectId.isValid(clinicId)) {
                throw new Error('ID da clínica inválido');
            }

            return await Provider.find({
                clinic: clinicId,
                isActive
            })
            .sort({ name: 1 })
            .populate('clinic', 'name')
            .populate('user', 'name email role')
            .populate('appointmentTypes', 'name duration color category');
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao buscar profissionais da clínica');
        }
    }

    // Update working hours
    async updateWorkingHours(
        providerId: string,
        clinicId: string,
        workingHours: {
            monday: { start: string; end: string; isWorking: boolean };
            tuesday: { start: string; end: string; isWorking: boolean };
            wednesday: { start: string; end: string; isWorking: boolean };
            thursday: { start: string; end: string; isWorking: boolean };
            friday: { start: string; end: string; isWorking: boolean };
            saturday: { start: string; end: string; isWorking: boolean };
            sunday: { start: string; end: string; isWorking: boolean };
        }
    ): Promise<IProvider | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(providerId)) {
                throw new Error('ID do profissional inválido');
            }

            const provider = await Provider.findOneAndUpdate(
                {
                    _id: providerId,
                    clinic: clinicId
                },
                {
                    workingHours
                },
                { new: true, runValidators: true }
            )
            .populate('clinic', 'name')
            .populate('user', 'name email role')
            .populate('appointmentTypes', 'name duration color category');

            return provider;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao atualizar horários de trabalho');
        }
    }

    // Update appointment types for provider
    async updateAppointmentTypes(
        providerId: string,
        clinicId: string,
        appointmentTypeIds: string[]
    ): Promise<IProvider | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(providerId)) {
                throw new Error('ID do profissional inválido');
            }

            // Validate appointment type IDs
            for (const typeId of appointmentTypeIds) {
                if (!mongoose.Types.ObjectId.isValid(typeId)) {
                    throw new Error('ID de tipo de agendamento inválido');
                }
            }

            const provider = await Provider.findOneAndUpdate(
                {
                    _id: providerId,
                    clinic: clinicId
                },
                {
                    appointmentTypes: appointmentTypeIds
                },
                { new: true, runValidators: true }
            )
            .populate('clinic', 'name')
            .populate('user', 'name email role')
            .populate('appointmentTypes', 'name duration color category');

            return provider;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao atualizar tipos de agendamento');
        }
    }

    // Get provider statistics for a clinic
    async getProviderStats(clinicId: string): Promise<{
        total: number;
        active: number;
        inactive: number;
        bySpecialty: { specialty: string; count: number }[];
        withSystemAccess: number;
        recentlyAdded: number;
    }> {
        try {
            if (!mongoose.Types.ObjectId.isValid(clinicId)) {
                throw new Error('ID da clínica inválido');
            }

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const [
                total,
                active,
                inactive,
                withSystemAccess,
                recentlyAdded,
                specialtyStats
            ] = await Promise.all([
                Provider.countDocuments({ clinic: clinicId }),
                Provider.countDocuments({ clinic: clinicId, isActive: true }),
                Provider.countDocuments({ clinic: clinicId, isActive: false }),
                Provider.countDocuments({ 
                    clinic: clinicId, 
                    user: { $exists: true, $ne: null } 
                }),
                Provider.countDocuments({ 
                    clinic: clinicId, 
                    createdAt: { $gte: thirtyDaysAgo } 
                }),
                Provider.aggregate([
                    { $match: { clinic: new mongoose.Types.ObjectId(clinicId) } },
                    { $unwind: '$specialties' },
                    { $group: { _id: '$specialties', count: { $sum: 1 } } },
                    { $project: { specialty: '$_id', count: 1, _id: 0 } },
                    { $sort: { count: -1 } }
                ])
            ]);

            return {
                total,
                active,
                inactive,
                bySpecialty: specialtyStats,
                withSystemAccess,
                recentlyAdded
            };
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao buscar estatísticas de profissionais');
        }
    }

    // Reactivate provider
    async reactivateProvider(providerId: string, clinicId: string): Promise<IProvider | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(providerId)) {
                throw new Error('ID do profissional inválido');
            }

            const provider = await Provider.findOne({
                _id: providerId,
                clinic: clinicId,
                isActive: false
            });

            if (!provider) {
                throw new Error('Profissional inativo não encontrado');
            }

            // Check for duplicate email with active providers
            if (provider.email) {
                const existingActiveProvider = await Provider.findOne({
                    email: provider.email,
                    clinic: clinicId,
                    isActive: true,
                    _id: { $ne: providerId }
                });

                if (existingActiveProvider) {
                    throw new Error('Já existe um profissional ativo com este e-mail nesta clínica');
                }
            }

            provider.isActive = true;
            return await provider.save();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao reativar profissional');
        }
    }
}

export const providerService = new ProviderService();