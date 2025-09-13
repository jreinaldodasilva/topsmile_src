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
/**
 * @swagger
 * /api/appointment-types:
 *   post:
 *     summary: Criar tipo de agendamento
 *     description: Cria um novo tipo de agendamento na clínica
 *     tags: [Appointment Types]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - duration
 *               - color
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               duration:
 *                 type: integer
 *                 minimum: 15
 *                 maximum: 480
 *               price:
 *                 type: number
 *                 minimum: 0
 *               color:
 *                 type: string
 *                 pattern: '^#[0-9A-F]{6}$'
 *               category:
 *                 type: string
 *                 enum: [consultation, cleaning, treatment, surgery, emergency]
 *               allowOnlineBooking:
 *                 type: boolean
 *               requiresApproval:
 *                 type: boolean
 *               bufferBefore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 120
 *               bufferAfter:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 120
 *               preparationInstructions:
 *                 type: string
 *                 maxLength: 1000
 *               postTreatmentInstructions:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Tipo de agendamento criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AppointmentType'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
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
/**
 * @swagger
 * /api/appointment-types:
 *   get:
 *     summary: Listar tipos de agendamento
 *     description: Retorna lista de tipos de agendamento com filtros de busca e paginação
 *     tags: [Appointment Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Status ativo
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [consultation, cleaning, treatment, surgery, emergency]
 *         description: Categoria
 *       - in: query
 *         name: allowOnlineBooking
 *         schema:
 *           type: boolean
 *         description: Permitir reserva online
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Itens por página
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, duration, price, category, createdAt, updatedAt]
 *         description: Campo para ordenação
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Ordem de classificação
 *     responses:
 *       200:
 *         description: Lista de tipos de agendamento retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     appointmentTypes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AppointmentType'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autorizado
 */
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
/**
 * @swagger
 * /api/appointment-types/stats:
 *   get:
 *     summary: Estatísticas de tipos de agendamento
 *     description: Retorna estatísticas dos tipos de agendamento da clínica
 *     tags: [Appointment Types]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalTypes:
 *                       type: integer
 *                     activeTypes:
 *                       type: integer
 *                     inactiveTypes:
 *                       type: integer
 *                     typesByCategory:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                     onlineBookingTypes:
 *                       type: integer
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
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
/**
 * @swagger
 * /api/appointment-types/category/{category}:
 *   get:
 *     summary: Buscar tipos de agendamento por categoria
 *     description: Retorna tipos de agendamento de uma categoria específica
 *     tags: [Appointment Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [consultation, cleaning, treatment, surgery, emergency]
 *         description: Categoria dos tipos de agendamento
 *     responses:
 *       200:
 *         description: Tipos de agendamento retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AppointmentType'
 *       400:
 *         description: Categoria inválida
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
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
/**
 * @swagger
 * /api/appointment-types/online-booking:
 *   get:
 *     summary: Tipos de agendamento para reserva online
 *     description: Retorna tipos de agendamento disponíveis para reserva online
 *     tags: [Appointment Types]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tipos de agendamento retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AppointmentType'
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
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
/**
 * @swagger
 * /api/appointment-types/{id}:
 *   get:
 *     summary: Buscar tipo de agendamento por ID
 *     description: Retorna um tipo de agendamento específico pelo ID
 *     tags: [Appointment Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do tipo de agendamento
 *     responses:
 *       200:
 *         description: Tipo de agendamento encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AppointmentType'
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Tipo de agendamento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
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
/**
 * @swagger
 * /api/appointment-types/{id}:
 *   put:
 *     summary: Atualizar tipo de agendamento
 *     description: Atualiza os dados de um tipo de agendamento
 *     tags: [Appointment Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do tipo de agendamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppointmentType'
 *     responses:
 *       200:
 *         description: Tipo de agendamento atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AppointmentType'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Tipo de agendamento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
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
/**
 * @swagger
 * /api/appointment-types/{id}/duplicate:
 *   post:
 *     summary: Duplicar tipo de agendamento
 *     description: Cria uma cópia de um tipo de agendamento existente
 *     tags: [Appointment Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do tipo de agendamento a ser duplicado
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Novo nome para o tipo duplicado
 *     responses:
 *       201:
 *         description: Tipo de agendamento duplicado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AppointmentType'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Tipo de agendamento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
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
/**
 * @swagger
 * /api/appointment-types/{id}/reactivate:
 *   patch:
 *     summary: Reativar tipo de agendamento
 *     description: Reativa um tipo de agendamento inativo
 *     tags: [Appointment Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do tipo de agendamento
 *     responses:
 *       200:
 *         description: Tipo de agendamento reativado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AppointmentType'
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Tipo de agendamento inativo não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
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
/**
 * @swagger
 * /api/appointment-types/{id}:
 *   delete:
 *     summary: Excluir tipo de agendamento
 *     description: Exclui um tipo de agendamento (soft delete)
 *     tags: [Appointment Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do tipo de agendamento
 *     responses:
 *       200:
 *         description: Tipo de agendamento excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Tipo de agendamento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
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