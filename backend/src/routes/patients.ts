// backend/src/routes/patients.ts
import express from 'express';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { patientService } from '../services/patientService';
import { body, query, validationResult } from 'express-validator';

const router = express.Router();

// All patient routes require authentication
router.use(authenticate);

// Validation rules for creating patients
const createPatientValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('E-mail inválido'),
    
    body('phone')
        .trim()
        .isLength({ min: 10, max: 15 })
        .withMessage('Telefone deve ter entre 10 e 15 caracteres'),
    
    body('birthDate')
        .optional()
        .isISO8601()
        .withMessage('Data de nascimento inválida'),
    
    body('gender')
        .optional()
        .isIn(['male', 'female', 'other'])
        .withMessage('Gênero inválido'),
    
    body('cpf')
        .optional()
        .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
        .withMessage('CPF deve estar no formato XXX.XXX.XXX-XX'),
    
    body('address.street')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Rua deve ter no máximo 200 caracteres'),
    
    body('address.number')
        .optional()
        .trim()
        .isLength({ max: 20 })
        .withMessage('Número deve ter no máximo 20 caracteres'),
    
    body('address.complement')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Complemento deve ter no máximo 100 caracteres'),
    
    body('address.neighborhood')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Bairro deve ter no máximo 100 caracteres'),
    
    body('address.city')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Cidade deve ter no máximo 100 caracteres'),
    
    body('address.state')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Estado deve ter no máximo 50 caracteres'),
    
    body('address.zipCode')
        .optional()
        .trim()
        .matches(/^\d{5}-?\d{3}$/)
        .withMessage('CEP deve estar no formato XXXXX-XXX ou XXXXXXXX'),
    
    body('emergencyContact.name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome do contato de emergência deve ter entre 2 e 100 caracteres'),
    
    body('emergencyContact.phone')
        .optional()
        .trim()
        .isLength({ min: 10, max: 15 })
        .withMessage('Telefone do contato de emergência deve ter entre 10 e 15 caracteres'),
    
    body('emergencyContact.relationship')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Relacionamento deve ter entre 2 e 50 caracteres'),
    
    body('medicalHistory.allergies')
        .optional()
        .isArray()
        .withMessage('Alergias deve ser um array'),
    
    body('medicalHistory.medications')
        .optional()
        .isArray()
        .withMessage('Medicamentos deve ser um array'),
    
    body('medicalHistory.conditions')
        .optional()
        .isArray()
        .withMessage('Condições deve ser um array'),
    
    body('medicalHistory.notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Observações médicas devem ter no máximo 1000 caracteres')
];

// Validation rules for updating patients
const updatePatientValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('E-mail inválido'),
    
    body('phone')
        .optional()
        .trim()
        .isLength({ min: 10, max: 15 })
        .withMessage('Telefone deve ter entre 10 e 15 caracteres'),
    
    body('birthDate')
        .optional()
        .isISO8601()
        .withMessage('Data de nascimento inválida'),
    
    body('gender')
        .optional()
        .isIn(['male', 'female', 'other'])
        .withMessage('Gênero inválido'),
    
    body('cpf')
        .optional()
        .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
        .withMessage('CPF deve estar no formato XXX.XXX.XXX-XX'),
    
    body('status')
        .optional()
        .isIn(['active', 'inactive'])
        .withMessage('Status inválido'),
    
    // Address validations (same as create)
    body('address.street')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Rua deve ter no máximo 200 caracteres'),
    
    body('address.number')
        .optional()
        .trim()
        .isLength({ max: 20 })
        .withMessage('Número deve ter no máximo 20 caracteres'),
    
    body('address.complement')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Complemento deve ter no máximo 100 caracteres'),
    
    body('address.neighborhood')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Bairro deve ter no máximo 100 caracteres'),
    
    body('address.city')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Cidade deve ter no máximo 100 caracteres'),
    
    body('address.state')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Estado deve ter no máximo 50 caracteres'),
    
    body('address.zipCode')
        .optional()
        .trim()
        .matches(/^\d{5}-?\d{3}$/)
        .withMessage('CEP deve estar no formato XXXXX-XXX ou XXXXXXXX'),
    
    // Emergency contact validations (same as create)
    body('emergencyContact.name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome do contato de emergência deve ter entre 2 e 100 caracteres'),
    
    body('emergencyContact.phone')
        .optional()
        .trim()
        .isLength({ min: 10, max: 15 })
        .withMessage('Telefone do contato de emergência deve ter entre 10 e 15 caracteres'),
    
    body('emergencyContact.relationship')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Relacionamento deve ter entre 2 e 50 caracteres'),
    
    // Medical history validations (same as create)
    body('medicalHistory.allergies')
        .optional()
        .isArray()
        .withMessage('Alergias deve ser um array'),
    
    body('medicalHistory.medications')
        .optional()
        .isArray()
        .withMessage('Medicamentos deve ser um array'),
    
    body('medicalHistory.conditions')
        .optional()
        .isArray()
        .withMessage('Condições deve ser um array'),
    
    body('medicalHistory.notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Observações médicas devem ter no máximo 1000 caracteres')
];

// Search validation
const searchValidation = [
    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Busca deve ter entre 1 e 100 caracteres'),
    
    query('status')
        .optional()
        .isIn(['active', 'inactive'])
        .withMessage('Status inválido'),
    
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
        .isIn(['name', 'email', 'phone', 'createdAt', 'updatedAt'])
        .withMessage('Campo de ordenação inválido'),
    
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Ordem de classificação inválida')
];

// Create a new patient
router.post('/', createPatientValidation, async (req: AuthenticatedRequest, res: any) => {
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

        const patientData = {
            ...req.body,
            clinicId: req.user.clinicId
        };

        const patient = await patientService.createPatient(patientData);

        return res.status(201).json({
            success: true,
            message: 'Paciente criado com sucesso',
            data: patient
        });
    } catch (error: any) {
        console.error('Error creating patient:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Erro ao criar paciente'
        });
    }
});

// Get all patients with search and pagination
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
            status: req.query.status as 'active' | 'inactive' || 'active',
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 20,
            sortBy: req.query.sortBy as string || 'name',
            sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'asc'
        };

        const result = await patientService.searchPatients(filters);

        return res.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('Error searching patients:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Erro ao buscar pacientes'
        });
    }
});

// Get patient statistics
router.get('/stats', async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user?.clinicId) {
            return res.status(400).json({
                success: false,
                message: 'Clínica não identificada'
            });
        }

        const stats = await patientService.getPatientStats(req.user.clinicId);

        return res.json({
            success: true,
            data: stats
        });
    } catch (error: any) {
        console.error('Error getting patient stats:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Erro ao buscar estatísticas de pacientes'
        });
    }
});

// Get specific patient by ID
router.get('/:id', async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user?.clinicId) {
            return res.status(400).json({
                success: false,
                message: 'Clínica não identificada'
            });
        }

        const patient = await patientService.getPatientById(req.params.id, req.user.clinicId);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Paciente não encontrado'
            });
        }

        return res.json({
            success: true,
            data: patient
        });
    } catch (error: any) {
        console.error('Error getting patient:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Erro ao buscar paciente'
        });
    }
});

// Update patient
router.patch('/:id', updatePatientValidation, async (req: AuthenticatedRequest, res: any) => {
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

        const patient = await patientService.updatePatient(
            req.params.id,
            req.user.clinicId,
            req.body
        );

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Paciente não encontrado'
            });
        }

        return res.json({
            success: true,
            message: 'Paciente atualizado com sucesso',
            data: patient
        });
    } catch (error: any) {
        console.error('Error updating patient:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Erro ao atualizar paciente'
        });
    }
});

// Update medical history
router.patch('/:id/medical-history', 
    body('allergies').optional().isArray().withMessage('Alergias deve ser um array'),
    body('medications').optional().isArray().withMessage('Medicamentos deve ser um array'),
    body('conditions').optional().isArray().withMessage('Condições deve ser um array'),
    body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Observações devem ter no máximo 1000 caracteres'),
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

            const patient = await patientService.updateMedicalHistory(
                req.params.id,
                req.user.clinicId,
                req.body
            );

            if (!patient) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente não encontrado'
                });
            }

            return res.json({
                success: true,
                message: 'Histórico médico atualizado com sucesso',
                data: patient
            });
        } catch (error: any) {
            console.error('Error updating medical history:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao atualizar histórico médico'
            });
        }
    }
);

// Reactivate patient
router.patch('/:id/reactivate', async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user?.clinicId) {
            return res.status(400).json({
                success: false,
                message: 'Clínica não identificada'
            });
        }

        const patient = await patientService.reactivatePatient(req.params.id, req.user.clinicId);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Paciente inativo não encontrado'
            });
        }

        return res.json({
            success: true,
            message: 'Paciente reativado com sucesso',
            data: patient
        });
    } catch (error: any) {
        console.error('Error reactivating patient:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Erro ao reativar paciente'
        });
    }
});

// Delete patient (soft delete)
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user?.clinicId) {
            return res.status(400).json({
                success: false,
                message: 'Clínica não identificada'
            });
        }

        const success = await patientService.deletePatient(req.params.id, req.user.clinicId);

        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Paciente não encontrado'
            });
        }

        return res.json({
            success: true,
            message: 'Paciente excluído com sucesso'
        });
    } catch (error: any) {
        console.error('Error deleting patient:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Erro ao excluir paciente'
        });
    }
});

export default router;