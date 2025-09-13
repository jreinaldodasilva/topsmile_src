// backend/src/services/patientService.ts
import { Patient, IPatient } from '../models/Patient';
import mongoose from 'mongoose';

export interface CreatePatientData {
    name: string;
    email?: string;
    phone: string;
    birthDate?: Date;
    gender?: 'male' | 'female' | 'other';
    cpf?: string;
    address?: {
        street?: string;
        number?: string;
        complement?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
        zipCode?: string;
    };
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    };
    medicalHistory?: {
        allergies?: string[];
        medications?: string[];
        conditions?: string[];
        notes?: string;
    };
    clinicId: string;
}

export interface UpdatePatientData extends Partial<CreatePatientData> {
    status?: 'active' | 'inactive';
}

export interface PatientSearchFilters {
    clinicId: string;
    search?: string;
    status?: 'active' | 'inactive';
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PatientSearchResult {
    patients: IPatient[];
    total: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

class PatientService {
    // Create a new patient
    async createPatient(data: CreatePatientData): Promise<IPatient> {
        try {
            // Validate required fields
            if (!data.name || !data.phone || !data.clinicId) {
                throw new Error('Nome, telefone e clínica são obrigatórios');
            }

            // Validate clinic ID
            if (!mongoose.Types.ObjectId.isValid(data.clinicId)) {
                throw new Error('ID da clínica inválido');
            }

            // Check if patient with same phone already exists in the clinic
            const existingPatient = await Patient.findOne({
                phone: data.phone,
                clinic: data.clinicId,
                status: 'active'
            });

            if (existingPatient) {
                throw new Error('Já existe um paciente ativo com este telefone nesta clínica');
            }

            // Check if email is provided and already exists in the clinic
            if (data.email) {
                const existingEmailPatient = await Patient.findOne({
                    email: data.email.toLowerCase(),
                    clinic: data.clinicId,
                    status: 'active'
                });

                if (existingEmailPatient) {
                    throw new Error('Já existe um paciente ativo com este e-mail nesta clínica');
                }
            }

            const patient = new Patient({
                ...data,
                clinic: data.clinicId,
                email: data.email?.toLowerCase(),
                status: 'active'
            });

            return await patient.save();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao criar paciente');
        }
    }

    // Get patient by ID
    async getPatientById(patientId: string, clinicId: string): Promise<IPatient | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(patientId)) {
                throw new Error('ID do paciente inválido');
            }

            const patient = await Patient.findOne({
                _id: patientId,
                clinic: clinicId
            }).populate('clinic', 'name');

            return patient;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao buscar paciente');
        }
    }

    // Update patient
    async updatePatient(patientId: string, clinicId: string, data: UpdatePatientData): Promise<IPatient | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(patientId)) {
                throw new Error('ID do paciente inválido');
            }

            const patient = await Patient.findOne({
                _id: patientId,
                clinic: clinicId
            });

            if (!patient) {
                return null;
            }

            // Check for duplicate phone if phone is being updated
            if (data.phone && data.phone !== patient.phone) {
                const existingPatient = await Patient.findOne({
                    phone: data.phone,
                    clinic: clinicId,
                    status: 'active',
                    _id: { $ne: patientId }
                });

                if (existingPatient) {
                    throw new Error('Já existe um paciente ativo com este telefone nesta clínica');
                }
            }

            // Check for duplicate email if email is being updated
            if (data.email && data.email.toLowerCase() !== patient.email) {
                const existingEmailPatient = await Patient.findOne({
                    email: data.email.toLowerCase(),
                    clinic: clinicId,
                    status: 'active',
                    _id: { $ne: patientId }
                });

                if (existingEmailPatient) {
                    throw new Error('Já existe um paciente ativo com este e-mail nesta clínica');
                }
            }

            // Update patient data
            Object.keys(data).forEach(key => {
                if (key === 'email' && data.email) {
                    (patient as any)[key] = data.email.toLowerCase();
                } else if (data[key as keyof UpdatePatientData] !== undefined) {
                    (patient as any)[key] = data[key as keyof UpdatePatientData];
                }
            });

            return await patient.save();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao atualizar paciente');
        }
    }

    // Delete patient (soft delete by setting status to inactive)
    async deletePatient(patientId: string, clinicId: string): Promise<boolean> {
        try {
            if (!mongoose.Types.ObjectId.isValid(patientId)) {
                throw new Error('ID do paciente inválido');
            }

            const patient = await Patient.findOneAndUpdate(
                {
                    _id: patientId,
                    clinic: clinicId
                },
                {
                    status: 'inactive'
                },
                { new: true }
            );

            return !!patient;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao excluir paciente');
        }
    }

    // Search patients with filters and pagination
    async searchPatients(filters: PatientSearchFilters): Promise<PatientSearchResult> {
        try {
            const {
                clinicId,
                search,
                status = 'active',
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
                status
            };

            // Add search functionality
            if (search && search.trim()) {
                const searchRegex = new RegExp(search.trim(), 'i');
                query.$or = [
                    { name: searchRegex },
                    { email: searchRegex },
                    { phone: searchRegex },
                    { cpf: searchRegex },
                    { 'medicalHistory.conditions': searchRegex },
                    { 'medicalHistory.allergies': searchRegex }
                ];
            }

            // Calculate pagination
            const skip = (page - 1) * limit;
            const sortOptions: any = {};
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

            // Execute query with pagination
            const [patients, total] = await Promise.all([
                Patient.find(query)
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(limit)
                    .populate('clinic', 'name'),
                Patient.countDocuments(query)
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                patients,
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
            throw new Error('Erro ao buscar pacientes');
        }
    }

    // Get patients by clinic
    async getPatientsByClinic(clinicId: string, status: 'active' | 'inactive' | 'all' = 'active'): Promise<IPatient[]> {
        try {
            if (!mongoose.Types.ObjectId.isValid(clinicId)) {
                throw new Error('ID da clínica inválido');
            }

            const query: any = { clinic: clinicId };
            if (status !== 'all') {
                query.status = status;
            }

            return await Patient.find(query)
                .sort({ name: 1 })
                .populate('clinic', 'name');
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao buscar pacientes da clínica');
        }
    }

    // Update medical history
    async updateMedicalHistory(
        patientId: string, 
        clinicId: string, 
        medicalHistory: {
            allergies?: string[];
            medications?: string[];
            conditions?: string[];
            notes?: string;
        }
    ): Promise<IPatient | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(patientId)) {
                throw new Error('ID do paciente inválido');
            }

            const patient = await Patient.findOneAndUpdate(
                {
                    _id: patientId,
                    clinic: clinicId
                },
                {
                    $set: {
                        'medicalHistory.allergies': medicalHistory.allergies || [],
                        'medicalHistory.medications': medicalHistory.medications || [],
                        'medicalHistory.conditions': medicalHistory.conditions || [],
                        'medicalHistory.notes': medicalHistory.notes || ''
                    }
                },
                { new: true, runValidators: true }
            ).populate('clinic', 'name');

            return patient;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao atualizar histórico médico');
        }
    }

    // Get patient statistics for a clinic
    async getPatientStats(clinicId: string): Promise<{
        total: number;
        active: number;
        inactive: number;
        recentlyAdded: number;
        withMedicalHistory: number;
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
                recentlyAdded,
                withMedicalHistory
            ] = await Promise.all([
                Patient.countDocuments({ clinic: clinicId }),
                Patient.countDocuments({ clinic: clinicId, status: 'active' }),
                Patient.countDocuments({ clinic: clinicId, status: 'inactive' }),
                Patient.countDocuments({ 
                    clinic: clinicId, 
                    createdAt: { $gte: thirtyDaysAgo } 
                }),
                Patient.countDocuments({
                    clinic: clinicId,
                    $or: [
                        { 'medicalHistory.allergies.0': { $exists: true } },
                        { 'medicalHistory.medications.0': { $exists: true } },
                        { 'medicalHistory.conditions.0': { $exists: true } },
                        { 'medicalHistory.notes': { $ne: '', $exists: true } }
                    ]
                })
            ]);

            return {
                total,
                active,
                inactive,
                recentlyAdded,
                withMedicalHistory
            };
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao buscar estatísticas de pacientes');
        }
    }

    // Reactivate patient
    async reactivatePatient(patientId: string, clinicId: string): Promise<IPatient | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(patientId)) {
                throw new Error('ID do paciente inválido');
            }

            const patient = await Patient.findOne({
                _id: patientId,
                clinic: clinicId,
                status: 'inactive'
            });

            if (!patient) {
                throw new Error('Paciente inativo não encontrado');
            }

            // Check for duplicate phone with active patients
            const existingActivePatient = await Patient.findOne({
                phone: patient.phone,
                clinic: clinicId,
                status: 'active',
                _id: { $ne: patientId }
            });

            if (existingActivePatient) {
                throw new Error('Já existe um paciente ativo com este telefone nesta clínica');
            }

            // Check for duplicate email with active patients
            if (patient.email) {
                const existingActiveEmailPatient = await Patient.findOne({
                    email: patient.email,
                    clinic: clinicId,
                    status: 'active',
                    _id: { $ne: patientId }
                });

                if (existingActiveEmailPatient) {
                    throw new Error('Já existe um paciente ativo com este e-mail nesta clínica');
                }
            }

            patient.status = 'active';
            return await patient.save();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao reativar paciente');
        }
    }
}

export const patientService = new PatientService();