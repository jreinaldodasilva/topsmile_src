// backend/src/routes/appointmentTypes.ts
import express from 'express';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { appointmentTypeService } from '../services/appointmentTypeService';
import { body, query, validationResult } from 'express-validator';

const router = express.Router();

// All appointment type routes require authentication
router.use(authenticate);

// Validation rules for creating appointment types
const createAppointmentTypeValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Descrição deve ter no máximo 500 caracteres'),
    
    body('duration')
        .isInt({ min: 15, max: 480 })
        .withMessage('Duração deve ser entre 15 minutos e 8 horas'),
    
    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Preço deve ser positivo'),
    
    body('color')
        .matches(/^#[0-9A-F]{6}$/i)
        .withMessage('Cor deve estar no formato hexadecimal (#RRGGBB)'),
    
    body('category')
        .isIn(['consultation', 'cleaning', 'treatment', 'surgery', 'emergency'])
        .withMessage('Categoria inválida'),
    
    body('allowOnlineBooking')
        .optional()
        .isBoolean()
        .withMessage('Permitir reserva online deve ser verdadeiro ou falso'),
    
    body('requiresApproval')
        .optional()
        .isBoolean()
        .withMessage('Requer aprovação deve ser verdadeiro ou falso'),
    
    body('bufferBefore')
        .optional()
        .isInt({ min: 0, max: 120 })
        .withMessage('Tempo de intervalo antes deve ser entre 0 e 120 minutos'),
    
    body('bufferAfter')
        .optional()
        .isInt({ min: 0, max: 120 })
        .withMessage('Tempo de intervalo depois deve ser entre 0 e 120 minutos'),
    
    body('preparationInstructions')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Instruções de preparo devem ter no máximo 1000 caracteres'),
    
    body('postTreatmentInstructions')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Instruções pós-tratamento devem ter no máximo 1000 caracteres')
];

// Validation rules for updating appointment types
const updateAppointmentTypeValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Descrição deve ter no máximo 500 caracteres'),
    
    body('duration')
        .optional()
        .isInt({ min: 15, max: 480 })
        .withMessage('Duração deve ser entre 15 minutos e 8 horas'),
    
    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Preço deve ser positivo'),
    
    body('color')
        .optional()
        .matches(/^#[0-9A-F]{6}$/i)
        .withMessage('Cor deve estar no formato hexadecimal (#RRGGBB)'),
    
    body('category')
        .optional()
        .isIn(['consultation', 'cleaning', 'treatment', 'surgery', 'emergency'])
        .withMessage('Categoria inválida'),
    
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('Status ativo deve ser verdadeiro ou falso'),
    
    body('allowOnlineBooking')
        .optional()
        .isBoolean()
        .withMessage('Permitir reserva online deve ser verdadeiro ou falso'),
    
    body('requiresApproval')
        .optional()
        .isBoolean()
        .withMessage('Requer aprovação deve ser verdadeiro ou falso'),
    
    body('bufferBefore')
        .optional()
        .isInt({ min: 0, max: 120 })
        .withMessage('Tempo de intervalo antes deve ser entre 0 e 120 minutos'),
    
    body('bufferAfter')
        .optional()
        .isInt({ min: 0, max: 120 })
        .withMessage('Tempo de intervalo depois deve ser entre 0 e 120 minutos'),
    
    body('preparationInstructions')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Instruções de preparo devem ter no máximo 1000 caracteres'),
    
    body('postTreatmentInstructions')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Instruções pós-tratamento devem ter no máximo 1000 caracteres')
];

// Search validation
const searchValidation = [
    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Busca deve ter entre 1 e 100 caracteres'),
    
    query('isActive')
        .optional()
        .isBoolean()
        .withMessage('Status ativo inválido'),
    
    query('category')
        .optional()
        .isIn(['consultation', 'cleaning', 'treatment', 'surgery', 'emergency'])
        .withMessage('Categoria inválida'),
    
    query('allowOnlineBooking')
        .optional()
        .isBoolean()
        .withMessage('Permitir reserva online inválido'),
    
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Página deve ser um número inteiro maior que 0'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limite deve ser um número inteiro entre 1 e 100'),
    
    query('sortBy')
        .optional()
        .isIn(['name', 'duration', 'price', 'category', 'createdAt', 'updatedAt'])
        .withMessage('Campo de ordenação inválido'),
    
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Ordem de classificação inválida')
];

// Create a new appointment type
router.post('/', 
    authorize('super_admin', 'admin', 'manager'),
    createAppointmentTypeValidation, 
    async (req: AuthenticatedRequest, res: any) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Dados inválidos',
                    errors: errors.array()
                });
            }

            if (!req.user?.clinicId) {
                return res.status(400).json({
                    success: false,
                    message: 'Clínica não identificada'
                });
            }

            const appointmentTypeData = {
                ...req.body,
                clinicId: req.user.clinicId
            };

            const appointmentType = await appointmentTypeService.createAppointmentType(appointmentTypeData);

            return res.status(201).json({
                success: true,
                message: 'Tipo de agendamento criado com sucesso',
                data: appointmentType
            });
        } catch (error: any) {
            console.error('Error creating appointment type:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao criar tipo de agendamento'
            });
        }
    }
);

// Get all appointment types with search and pagination
router.get('/', searchValidation, async (req: AuthenticatedRequest, res: any) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetros inválidos',
                errors: errors.array()
            });
        }

        if (!req.user?.clinicId) {
            return res.status(400).json({
                success: false,
                message: 'Clínica não identificada'
            });
        }

        const filters = {
            clinicId: req.user.clinicId,
            search: req.query.search as string,
            isActive: req.query.isActive === 'false' ? false : true,
            category: req.query.category as string,
            allowOnlineBooking: req.query.allowOnlineBooking === 'true' ? true : 
                               req.query.allowOnlineBooking === 'false' ? false : undefined,
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 20,
            sortBy: req.query.sortBy as string || 'name',
            sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'asc'
        };

        const result = await appointmentTypeService.searchAppointmentTypes(filters);

        return res.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('Error searching appointment types:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Erro ao buscar tipos de agendamento'
        });
    }
});

// Get appointment type statistics
router.get('/stats', 
    authorize('super_admin', 'admin', 'manager'),
    async (req: AuthenticatedRequest, res) => {
        try {
            if (!req.user?.clinicId) {
                return res.status(400).json({
                    success: false,
                    message: 'Clínica não identificada'
                });
            }

            const stats = await appointmentTypeService.getAppointmentTypeStats(req.user.clinicId);

            return res.json({
                success: true,
                data: stats
            });
        } catch (error: any) {
            console.error('Error getting appointment type stats:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Erro ao buscar estatísticas de tipos de agendamento'
            });
        }
    }
);

// Get appointment types by category
router.get('/category/:category', async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user?.clinicId) {
            return res.status(400).json({
                success: false,
                message: 'Clínica não identificada'
            });
        }

        const category = req.params.category as 'consultation' | 'cleaning' | 'treatment' | 'surgery' | 'emergency';
        
        if (!['consultation', 'cleaning', 'treatment', 'surgery', 'emergency'].includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Categoria inválida'
            });
        }

        const appointmentTypes = await appointmentTypeService.getAppointmentTypesByCategory(
            req.user.clinicId, 
            category
        );

        return res.json({
            success: true,
            data: appointmentTypes
        });
    } catch (error: any) {
        console.error('Error getting appointment types by category:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Erro ao buscar tipos de agendamento por categoria'
        });
    }
});

// Get appointment types available for online booking
router.get('/online-booking', async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user?.clinicId) {
            return res.status(400).json({
                success: false,
                message: 'Clínica não identificada'
            });
        }

        const appointmentTypes = await appointmentTypeService.getOnlineBookingTypes(req.user.clinicId);

        return res.json({
            success: true,
            data: appointmentTypes
        });
    } catch (error: any) {
        console.error('Error getting online booking types:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Erro ao buscar tipos de agendamento para reserva online'
        });
    }
});

// Get specific appointment type by ID
router.get('/:id', async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user?.clinicId) {
            return res.status(400).json({
                success: false,
                message: 'Clínica não identificada'
            });
        }

        const appointmentType = await appointmentTypeService.getAppointmentTypeById(
            req.params.id, 
            req.user.clinicId
        );

        if (!appointmentType) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de agendamento não encontrado'
            });
        }

        return res.json({
            success: true,
            data: appointmentType
        });
    } catch (error: any) {
        console.error('Error getting appointment type:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Erro ao buscar tipo de agendamento'
        });
    }
});

// Update appointment type
router.put('/:id', 
    authorize('super_admin', 'admin', 'manager'),
    updateAppointmentTypeValidation, 
    async (req: AuthenticatedRequest, res: any) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Dados inválidos',
                    errors: errors.array()
                });
            }

            if (!req.user?.clinicId) {
                return res.status(400).json({
                    success: false,
                    message: 'Clínica não identificada'
                });
            }

            const appointmentType = await appointmentTypeService.updateAppointmentType(
                req.params.id,
                req.user.clinicId,
                req.body
            );

            if (!appointmentType) {
                return res.status(404).json({
                    success: false,
                    message: 'Tipo de agendamento não encontrado'
                });
            }

            return res.json({
                success: true,
                message: 'Tipo de agendamento atualizado com sucesso',
                data: appointmentType
            });
        } catch (error: any) {
            console.error('Error updating appointment type:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao atualizar tipo de agendamento'
            });
        }
    }
);

// Duplicate appointment type
router.post('/:id/duplicate',
    authorize('super_admin', 'admin', 'manager'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
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

            if (!req.user?.clinicId) {
                return res.status(400).json({
                    success: false,
                    message: 'Clínica não identificada'
                });
            }

            const duplicatedType = await appointmentTypeService.duplicateAppointmentType(
                req.params.id,
                req.user.clinicId,
                req.body.name
            );

            return res.status(201).json({
                success: true,
                message: 'Tipo de agendamento duplicado com sucesso',
                data: duplicatedType
            });
        } catch (error: any) {
            console.error('Error duplicating appointment type:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao duplicar tipo de agendamento'
            });
        }
    }
);

// Reactivate appointment type
router.patch('/:id/reactivate', 
    authorize('super_admin', 'admin', 'manager'),
    async (req: AuthenticatedRequest, res) => {
        try {
            if (!req.user?.clinicId) {
                return res.status(400).json({
                    success: false,
                    message: 'Clínica não identificada'
                });
            }

            const appointmentType = await appointmentTypeService.reactivateAppointmentType(
                req.params.id, 
                req.user.clinicId
            );

            if (!appointmentType) {
                return res.status(404).json({
                    success: false,
                    message: 'Tipo de agendamento inativo não encontrado'
                });
            }

            return res.json({
                success: true,
                message: 'Tipo de agendamento reativado com sucesso',
                data: appointmentType
            });
        } catch (error: any) {
            console.error('Error reactivating appointment type:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao reativar tipo de agendamento'
            });
        }
    }
);

// Delete appointment type (soft delete)
router.delete('/:id', 
    authorize('super_admin', 'admin'),
    async (req: AuthenticatedRequest, res) => {
        try {
            if (!req.user?.clinicId) {
                return res.status(400).json({
                    success: false,
                    message: 'Clínica não identificada'
                });
            }

            const success = await appointmentTypeService.deleteAppointmentType(
                req.params.id, 
                req.user.clinicId
            );

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Tipo de agendamento não encontrado'
                });
            }

            return res.json({
                success: true,
                message: 'Tipo de agendamento excluído com sucesso'
            });
        } catch (error: any) {
            console.error('Error deleting appointment type:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Erro ao excluir tipo de agendamento'
            });
        }
    }
);

export default router;