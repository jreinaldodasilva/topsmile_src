// backend/src/services/appointmentTypeService.ts
import { AppointmentType, IAppointmentType } from '../models/AppointmentType';
import mongoose from 'mongoose';

export interface CreateAppointmentTypeData {
    name: string;
    description?: string;
    duration: number; // minutes
    price?: number;
    color: string; // Hex color
    category: 'consultation' | 'cleaning' | 'treatment' | 'surgery' | 'emergency';
    allowOnlineBooking?: boolean;
    requiresApproval?: boolean;
    bufferBefore?: number;
    bufferAfter?: number;
    preparationInstructions?: string;
    postTreatmentInstructions?: string;
    clinicId: string;
}

export interface UpdateAppointmentTypeData extends Partial<CreateAppointmentTypeData> {
    isActive?: boolean;
}

export interface AppointmentTypeSearchFilters {
    clinicId: string;
    search?: string;
    isActive?: boolean;
    category?: string;
    allowOnlineBooking?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface AppointmentTypeSearchResult {
    appointmentTypes: IAppointmentType[];
    total: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

class AppointmentTypeService {
    // Create a new appointment type
    async createAppointmentType(data: CreateAppointmentTypeData): Promise<IAppointmentType> {
        try {
            // Validate required fields
            if (!data.name || !data.duration || !data.color || !data.category || !data.clinicId) {
                throw new Error('Nome, duração, cor, categoria e clínica são obrigatórios');
            }

            // Validate clinic ID
            if (!mongoose.Types.ObjectId.isValid(data.clinicId)) {
                throw new Error('ID da clínica inválido');
            }

            // Validate color format
            if (!/^#[0-9A-F]{6}$/i.test(data.color)) {
                throw new Error('Cor deve estar no formato hexadecimal (#RRGGBB)');
            }

            // Validate duration
            if (data.duration < 15 || data.duration > 480) {
                throw new Error('Duração deve ser entre 15 minutos e 8 horas');
            }

            // Validate price if provided
            if (data.price !== undefined && data.price < 0) {
                throw new Error('Preço deve ser positivo');
            }

            // Check if appointment type with same name already exists in the clinic
            const existingType = await AppointmentType.findOne({
                name: data.name.trim(),
                clinic: data.clinicId,
                isActive: true
            });

            if (existingType) {
                throw new Error('Já existe um tipo de agendamento ativo com este nome nesta clínica');
            }

            const appointmentType = new AppointmentType({
                ...data,
                clinic: data.clinicId,
                name: data.name.trim(),
                allowOnlineBooking: data.allowOnlineBooking ?? true,
                requiresApproval: data.requiresApproval ?? false,
                bufferBefore: data.bufferBefore ?? 0,
                bufferAfter: data.bufferAfter ?? 0,
                isActive: true
            });

            return await appointmentType.save();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao criar tipo de agendamento');
        }
    }

    // Get appointment type by ID
    async getAppointmentTypeById(typeId: string, clinicId: string): Promise<IAppointmentType | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(typeId)) {
                throw new Error('ID do tipo de agendamento inválido');
            }

            const appointmentType = await AppointmentType.findOne({
                _id: typeId,
                clinic: clinicId
            }).populate('clinic', 'name');

            return appointmentType;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao buscar tipo de agendamento');
        }
    }

    // Update appointment type
    async updateAppointmentType(typeId: string, clinicId: string, data: UpdateAppointmentTypeData): Promise<IAppointmentType | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(typeId)) {
                throw new Error('ID do tipo de agendamento inválido');
            }

            const appointmentType = await AppointmentType.findOne({
                _id: typeId,
                clinic: clinicId
            });

            if (!appointmentType) {
                throw new Error('Tipo de agendamento não encontrado');
            }

            // Validate color format if being updated
            if (data.color && !/^#[0-9A-F]{6}$/i.test(data.color)) {
                throw new Error('Cor deve estar no formato hexadecimal (#RRGGBB)');
            }

            // Validate duration if being updated
            if (data.duration !== undefined && (data.duration < 15 || data.duration > 480)) {
                throw new Error('Duração deve ser entre 15 minutos e 8 horas');
            }

            // Validate price if being updated
            if (data.price !== undefined && data.price < 0) {
                throw new Error('Preço deve ser positivo');
            }

            // Check for duplicate name if name is being updated
            if (data.name && data.name.trim() !== appointmentType.name) {
                const existingType = await AppointmentType.findOne({
                    name: data.name.trim(),
                    clinic: clinicId,
                    isActive: true,
                    _id: { $ne: typeId }
                });

                if (existingType) {
                    throw new Error('Já existe um tipo de agendamento ativo com este nome nesta clínica');
                }
            }

            // Update appointment type data
            Object.keys(data).forEach(key => {
                if (key === 'name' && data.name) {
                    (appointmentType as any)[key] = data.name.trim();
                } else if (data[key as keyof UpdateAppointmentTypeData] !== undefined) {
                    (appointmentType as any)[key] = data[key as keyof UpdateAppointmentTypeData];
                }
            });

            return await appointmentType.save();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao atualizar tipo de agendamento');
        }
    }

    // Delete appointment type (soft delete by setting isActive to false)
    async deleteAppointmentType(typeId: string, clinicId: string): Promise<boolean> {
        try {
            if (!mongoose.Types.ObjectId.isValid(typeId)) {
                throw new Error('ID do tipo de agendamento inválido');
            }

            const appointmentType = await AppointmentType.findOneAndUpdate(
                {
                    _id: typeId,
                    clinic: clinicId
                },
                {
                    isActive: false
                },
                { new: true }
            );

            return !!appointmentType;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao excluir tipo de agendamento');
        }
    }

    // Search appointment types with filters and pagination
    async searchAppointmentTypes(filters: AppointmentTypeSearchFilters): Promise<AppointmentTypeSearchResult> {
        try {
            const {
                clinicId,
                search,
                isActive = true,
                category,
                allowOnlineBooking,
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
                    { description: searchRegex },
                    { category: searchRegex }
                ];
            }

            // Filter by category
            if (category) {
                query.category = category;
            }

            // Filter by online booking availability
            if (allowOnlineBooking !== undefined) {
                query.allowOnlineBooking = allowOnlineBooking;
            }

            // Calculate pagination
            const skip = (page - 1) * limit;
            const sortOptions: any = {};
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

            // Execute query with pagination
            const [appointmentTypes, total] = await Promise.all([
                AppointmentType.find(query)
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(limit)
                    .populate('clinic', 'name'),
                AppointmentType.countDocuments(query)
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                appointmentTypes,
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
            throw new Error('Erro ao buscar tipos de agendamento');
        }
    }

    // Get appointment types by clinic
    async getAppointmentTypesByClinic(clinicId: string, isActive: boolean = true): Promise<IAppointmentType[]> {
        try {
            if (!mongoose.Types.ObjectId.isValid(clinicId)) {
                throw new Error('ID da clínica inválido');
            }

            return await AppointmentType.find({
                clinic: clinicId,
                isActive
            })
            .sort({ name: 1 })
            .populate('clinic', 'name');
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao buscar tipos de agendamento da clínica');
        }
    }

    // Get appointment types by category
    async getAppointmentTypesByCategory(
        clinicId: string, 
        category: 'consultation' | 'cleaning' | 'treatment' | 'surgery' | 'emergency',
        isActive: boolean = true
    ): Promise<IAppointmentType[]> {
        try {
            if (!mongoose.Types.ObjectId.isValid(clinicId)) {
                throw new Error('ID da clínica inválido');
            }

            return await AppointmentType.find({
                clinic: clinicId,
                category,
                isActive
            })
            .sort({ name: 1 })
            .populate('clinic', 'name');
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao buscar tipos de agendamento por categoria');
        }
    }

    // Get appointment types available for online booking
    async getOnlineBookingTypes(clinicId: string): Promise<IAppointmentType[]> {
        try {
            if (!mongoose.Types.ObjectId.isValid(clinicId)) {
                throw new Error('ID da clínica inválido');
            }

            return await AppointmentType.find({
                clinic: clinicId,
                isActive: true,
                allowOnlineBooking: true
            })
            .sort({ category: 1, name: 1 })
            .populate('clinic', 'name');
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao buscar tipos de agendamento para reserva online');
        }
    }

    // Get appointment type statistics for a clinic
    async getAppointmentTypeStats(clinicId: string): Promise<{
        total: number;
        active: number;
        inactive: number;
        byCategory: { category: string; count: number }[];
        onlineBookingEnabled: number;
        requiresApproval: number;
        averageDuration: number;
        averagePrice: number;
    }> {
        try {
            if (!mongoose.Types.ObjectId.isValid(clinicId)) {
                throw new Error('ID da clínica inválido');
            }

            const [
                total,
                active,
                inactive,
                onlineBookingEnabled,
                requiresApproval,
                categoryStats,
                durationStats,
                priceStats
            ] = await Promise.all([
                AppointmentType.countDocuments({ clinic: clinicId }),
                AppointmentType.countDocuments({ clinic: clinicId, isActive: true }),
                AppointmentType.countDocuments({ clinic: clinicId, isActive: false }),
                AppointmentType.countDocuments({ 
                    clinic: clinicId, 
                    isActive: true, 
                    allowOnlineBooking: true 
                }),
                AppointmentType.countDocuments({ 
                    clinic: clinicId, 
                    isActive: true, 
                    requiresApproval: true 
                }),
                AppointmentType.aggregate([
                    { $match: { clinic: new mongoose.Types.ObjectId(clinicId), isActive: true } },
                    { $group: { _id: '$category', count: { $sum: 1 } } },
                    { $project: { category: '$_id', count: 1, _id: 0 } },
                    { $sort: { count: -1 } }
                ]),
                AppointmentType.aggregate([
                    { $match: { clinic: new mongoose.Types.ObjectId(clinicId), isActive: true } },
                    { $group: { _id: null, averageDuration: { $avg: '$duration' } } }
                ]),
                AppointmentType.aggregate([
                    { 
                        $match: { 
                            clinic: new mongoose.Types.ObjectId(clinicId), 
                            isActive: true,
                            price: { $exists: true, $ne: null, $gt: 0 }
                        } 
                    },
                    { $group: { _id: null, averagePrice: { $avg: '$price' } } }
                ])
            ]);

            return {
                total,
                active,
                inactive,
                byCategory: categoryStats,
                onlineBookingEnabled,
                requiresApproval,
                averageDuration: durationStats[0]?.averageDuration || 0,
                averagePrice: priceStats[0]?.averagePrice || 0
            };
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao buscar estatísticas de tipos de agendamento');
        }
    }

    // Reactivate appointment type
    async reactivateAppointmentType(typeId: string, clinicId: string): Promise<IAppointmentType | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(typeId)) {
                throw new Error('ID do tipo de agendamento inválido');
            }

            const appointmentType = await AppointmentType.findOne({
                _id: typeId,
                clinic: clinicId,
                isActive: false
            });

            if (!appointmentType) {
                throw new Error('Tipo de agendamento inativo não encontrado');
            }

            // Check for duplicate name with active types
            const existingActiveType = await AppointmentType.findOne({
                name: appointmentType.name,
                clinic: clinicId,
                isActive: true,
                _id: { $ne: typeId }
            });

            if (existingActiveType) {
                throw new Error('Já existe um tipo de agendamento ativo com este nome nesta clínica');
            }

            appointmentType.isActive = true;
            return await appointmentType.save();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao reativar tipo de agendamento');
        }
    }

    // Duplicate appointment type (create a copy)
    async duplicateAppointmentType(typeId: string, clinicId: string, newName?: string): Promise<IAppointmentType> {
        try {
            if (!mongoose.Types.ObjectId.isValid(typeId)) {
                throw new Error('ID do tipo de agendamento inválido');
            }

            const originalType = await AppointmentType.findOne({
                _id: typeId,
                clinic: clinicId
            });

            if (!originalType) {
                throw new Error('Tipo de agendamento não encontrado');
            }

            const duplicateName = newName || `${originalType.name} (Cópia)`;

            // Check if the new name already exists
            const existingType = await AppointmentType.findOne({
                name: duplicateName,
                clinic: clinicId,
                isActive: true
            });

            if (existingType) {
                throw new Error('Já existe um tipo de agendamento ativo com este nome');
            }

            const duplicateData: CreateAppointmentTypeData = {
                name: duplicateName,
                description: originalType.description,
                duration: originalType.duration,
                price: originalType.price,
                color: originalType.color,
                category: originalType.category,
                allowOnlineBooking: originalType.allowOnlineBooking,
                requiresApproval: originalType.requiresApproval,
                bufferBefore: originalType.bufferBefore,
                bufferAfter: originalType.bufferAfter,
                preparationInstructions: originalType.preparationInstructions,
                postTreatmentInstructions: originalType.postTreatmentInstructions,
                clinicId
            };

            return await this.createAppointmentType(duplicateData);
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao duplicar tipo de agendamento');
        }
    }
}

export const appointmentTypeService = new AppointmentTypeService();