// backend/src/routes/providers.ts
import express from 'express';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { providerService } from '../services/providerService';
import { body, query, validationResult } from 'express-validator';

const router = express.Router();

// All provider routes require authentication
router.use(authenticate);

// Validation rules for creating providers
const createProviderValidation = [
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
        .optional()
        .trim()
        .isLength({ min: 10, max: 15 })
        .withMessage('Telefone deve ter entre 10 e 15 caracteres'),
    
    body('specialties')
        .isArray({ min: 1 })
        .withMessage('Pelo menos uma especialidade é obrigatória'),
    
    body('specialties.*')
        .isIn([
            'general_dentistry',
            'orthodontics', 
            'oral_surgery',
            'periodontics',
            'endodontics',
            'prosthodontics',
            'pediatric_dentistry',
            'oral_pathology',
            'dental_hygiene'
        ])
        .withMessage('Especialidade inválida'),
    
    body('licenseNumber')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Número da licença deve ter entre 1 e 50 caracteres'),
    
    body('timeZone')
        .optional()
        .isString()
        .withMessage('Fuso horário inválido'),
    
    body('bufferTimeBefore')
        .optional()
        .isInt({ min: 0, max: 60 })
        .withMessage('Tempo de intervalo antes deve ser entre 0 e 60 minutos'),
    
    body('bufferTimeAfter')
        .optional()
        .isInt({ min: 0, max: 60 })
        .withMessage('Tempo de intervalo depois deve ser entre 0 e 60 minutos'),
    
    body('userId')
        .optional()
        .isMongoId()
        .withMessage('ID do usuário inválido'),
    
    body('appointmentTypes')
        .optional()
        .isArray()
        .withMessage('Tipos de agendamento deve ser um array'),
    
    body('appointmentTypes.*')
        .optional()
        .isMongoId()
        .withMessage('ID de tipo de agendamento inválido'),
    
    // Working hours validation
    body('workingHours.*.start')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Formato de horário inválido. Use HH:MM'),
    
    body('workingHours.*.end')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Formato de horário inválido. Use HH:MM'),
    
    body('workingHours.*.isWorking')
        .optional()
        .isBoolean()
        .withMessage('isWorking deve ser verdadeiro ou falso')
];

// Validation rules for updating providers
const updateProviderValidation = [
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
    
    body('specialties')
        .optional()
        .isArray({ min: 1 })
        .withMessage('Pelo menos uma especialidade é obrigatória'),
    
    body('specialties.*')
        .optional()
        .isIn([
            'general_dentistry',
            'orthodontics', 
            'oral_surgery',
            'periodontics',
            'endodontics',
            'prosthodontics',
            'pediatric_dentistry',
            'oral_pathology',
            'dental_hygiene'
        ])
        .withMessage('Especialidade inválida'),
    
    body('licenseNumber')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Número da licença deve ter entre 1 e 50 caracteres'),
    
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('Status ativo deve ser verdadeiro ou falso'),
    
    body('timeZone')
        .optional()
        .isString()
        .withMessage('Fuso horário inválido'),
    
    body('bufferTimeBefore')
        .optional()
        .isInt({ min: 0, max: 60 })
        .withMessage('Tempo de intervalo antes deve ser entre 0 e 60 minutos'),
    
    body('bufferTimeAfter')
        .optional()
        .isInt({ min: 0, max: 60 })
        .withMessage('Tempo de intervalo depois deve ser entre 0 e 60 minutos'),
    
    body('userId')
        .optional()
        .isMongoId()
        .withMessage('ID do usuário inválido'),
    
    body('appointmentTypes')
        .optional()
        .isArray()
        .withMessage('Tipos de agendamento deve ser um array'),
    
    body('appointmentTypes.*')
        .optional()
        .isMongoId()
        .withMessage('ID de tipo de agendamento inválido'),
    
    // Working hours validation
    body('workingHours.*.start')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Formato de horário inválido. Use HH:MM'),
    
    body('workingHours.*.end')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Formato de horário inválido. Use HH:MM'),
    
    body('workingHours.*.isWorking')
        .optional()
        .isBoolean()
        .withMessage('isWorking deve ser verdadeiro ou falso')
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
    
    query('specialties')
        .optional()
        .custom((value) => {
            if (typeof value === 'string') {
                return true; // Single specialty
            }
            if (Array.isArray(value)) {
                return value.every(s => typeof s === 'string'); // Array of specialties
            }
            return false;
        })
        .withMessage('Especialidades inválidas'),
    
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
        .isIn(['name', 'email', 'createdAt', 'updatedAt'])
        .withMessage('Campo de ordenação inválido'),
    
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Ordem de classificação inválida')
];

// Working hours validation
const workingHoursValidation = [
    body('monday.start')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Formato de horário inválido para segunda-feira'),
    
    body('monday.end')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Formato de horário inválido para segunda-feira'),
    
    body('monday.isWorking')
        .isBoolean()
        .withMessage('Status de trabalho para segunda-feira deve ser verdadeiro ou falso'),
    
    // Repeat for other days...
    body('tuesday.start')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Formato de horário inválido para terça-feira'),
    
    body('tuesday.end')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Formato de horário inválido para terça-feira'),
    
    body('tuesday.isWorking')
        .isBoolean()
        .withMessage('Status de trabalho para terça-feira deve ser verdadeiro ou falso'),
    
    body('wednesday.start')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Formato de horário inválido para quarta-feira'),
    
    body('wednesday.end')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Formato de horário inválido para quarta-feira'),
    
    body('wednesday.isWorking')
        .isBoolean()
        .withMessage('Status de trabalho para quarta-feira deve ser verdadeiro ou falso'),
    
    body('thursday.start')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Formato de horário inválido para quinta-feira'),
    
    body('thursday.end')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Formato de horário inválido para quinta-feira'),
    
    body('thursday.isWorking')
        .isBoolean()
        .withMessage('Status de trabalho para quinta-feira deve ser verdadeiro ou falso'),
    
    body('friday.start')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Formato de horário inválido para sexta-feira'),
    
    body('friday.end')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Formato de horário inválido para sexta-feira'),
    
    body('friday.isWorking')
        .isBoolean()
        .withMessage('Status de trabalho para sexta-feira deve ser verdadeiro ou falso'),
    
    body('saturday.start')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Formato de horário inválido para sábado'),
    
    body('saturday.end')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Formato de horário inválido para sábado'),
    
    body('saturday.isWorking')
        .isBoolean()
        .withMessage('Status de trabalho para sábado deve ser verdadeiro ou falso'),
    
    body('sunday.start')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Formato de horário inválido para domingo'),
    
    body('sunday.end')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Formato de horário inválido para domingo'),
    
    body('sunday.isWorking')
        .isBoolean()
        .withMessage('Status de trabalho para domingo deve ser verdadeiro ou falso')
];

// Create a new provider
/**
 * @swagger
 * /api/providers:
 *   post:
 *     summary: Criar novo profissional
 *     description: Cria um novo profissional na clínica
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Provider'
 *     responses:
 *       201:
 *         description: Profissional criado com sucesso
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
 *                   $ref: '#/components/schemas/Provider'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.post('/', 
    authorize('super_admin', 'admin', 'manager'),
    createProviderValidation, 
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

            const providerData = {
                ...req.body,
                clinicId: req.user.clinicId
            };

            const provider = await providerService.createProvider(providerData);

            return res.status(201).json({
                success: true,
                message: 'Profissional criado com sucesso',
                data: provider
            });
        } catch (error: any) {
            console.error('Error creating provider:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao criar profissional'
            });
        }
    }
);

// Get all providers with search and pagination
/**
 * @swagger
 * /api/providers:
 *   get:
 *     summary: Listar profissionais
 *     description: Retorna lista de profissionais com filtros de busca e paginação
 *     tags: [Providers]
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
 *         name: specialties
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Especialidades
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
 *           enum: [name, email, createdAt, updatedAt]
 *         description: Campo para ordenação
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Ordem de classificação
 *     responses:
 *       200:
 *         description: Lista de profissionais retornada com sucesso
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
 *                     providers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Provider'
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

        // Handle specialties parameter (can be string or array)
        let specialties: string[] | undefined;
        if (req.query.specialties) {
            if (typeof req.query.specialties === 'string') {
                specialties = [req.query.specialties];
            } else if (Array.isArray(req.query.specialties)) {
                specialties = req.query.specialties as string[];
            }
        }

        const filters = {
            clinicId: req.user.clinicId,
            search: req.query.search as string,
            isActive: req.query.isActive === 'false' ? false : true,
            specialties,
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 20,
            sortBy: req.query.sortBy as string || 'name',
            sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'asc'
        };

        const result = await providerService.searchProviders(filters);

        return res.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('Error searching providers:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Erro ao buscar profissionais'
        });
    }
});

// Get provider statistics
/**
 * @swagger
 * /api/providers/stats:
 *   get:
 *     summary: Estatísticas de profissionais
 *     description: Retorna estatísticas dos profissionais da clínica
 *     tags: [Providers]
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
 *                     totalProviders:
 *                       type: integer
 *                     activeProviders:
 *                       type: integer
 *                     inactiveProviders:
 *                       type: integer
 *                     providersBySpecialty:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
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

            const stats = await providerService.getProviderStats(req.user.clinicId);

            return res.json({
                success: true,
                data: stats
            });
        } catch (error: any) {
            console.error('Error getting provider stats:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Erro ao buscar estatísticas de profissionais'
            });
        }
    }
);

// Get specific provider by ID
/**
 * @swagger
 * /api/providers/{id}:
 *   get:
 *     summary: Buscar profissional por ID
 *     description: Retorna um profissional específico pelo ID
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do profissional
 *     responses:
 *       200:
 *         description: Profissional encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Provider'
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Profissional não encontrado
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

        const provider = await providerService.getProviderById(req.params.id, req.user.clinicId);

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Profissional não encontrado'
            });
        }

        return res.json({
            success: true,
            data: provider
        });
    } catch (error: any) {
        console.error('Error getting provider:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Erro ao buscar profissional'
        });
    }
});

// Update provider
/**
 * @swagger
 * /api/providers/{id}:
 *   patch:
 *     summary: Atualizar profissional
 *     description: Atualiza os dados de um profissional
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do profissional
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Provider'
 *     responses:
 *       200:
 *         description: Profissional atualizado com sucesso
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
 *                   $ref: '#/components/schemas/Provider'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Profissional não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.patch('/:id',
    authorize('super_admin', 'admin', 'manager'),
    updateProviderValidation,
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

            const provider = await providerService.updateProvider(
                req.params.id,
                req.user.clinicId,
                req.body
            );

            if (!provider) {
                return res.status(404).json({
                    success: false,
                    message: 'Profissional não encontrado'
                });
            }

            return res.json({
                success: true,
                message: 'Profissional atualizado com sucesso',
                data: provider
            });
        } catch (error: any) {
            console.error('Error updating provider:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao atualizar profissional'
            });
        }
    }
);

// Update working hours
/**
 * @swagger
 * /api/providers/{id}/working-hours:
 *   patch:
 *     summary: Atualizar horários de trabalho
 *     description: Atualiza os horários de trabalho de um profissional
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do profissional
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               monday:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                   end:
 *                     type: string
 *                   isWorking:
 *                     type: boolean
 *               tuesday:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                   end:
 *                     type: string
 *                   isWorking:
 *                     type: boolean
 *               wednesday:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                   end:
 *                     type: string
 *                   isWorking:
 *                     type: boolean
 *               thursday:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                   end:
 *                     type: string
 *                   isWorking:
 *                     type: boolean
 *               friday:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                   end:
 *                     type: string
 *                   isWorking:
 *                     type: boolean
 *               saturday:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                   end:
 *                     type: string
 *                   isWorking:
 *                     type: boolean
 *               sunday:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                   end:
 *                     type: string
 *                   isWorking:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Horários atualizados com sucesso
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
 *                   $ref: '#/components/schemas/Provider'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Profissional não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.patch('/:id/working-hours',
    authorize('super_admin', 'admin', 'manager'),
    workingHoursValidation,
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

            const provider = await providerService.updateWorkingHours(
                req.params.id,
                req.user.clinicId,
                req.body
            );

            if (!provider) {
                return res.status(404).json({
                    success: false,
                    message: 'Profissional não encontrado'
                });
            }

            return res.json({
                success: true,
                message: 'Horários de trabalho atualizados com sucesso',
                data: provider
            });
        } catch (error: any) {
            console.error('Error updating working hours:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao atualizar horários de trabalho'
            });
        }
    }
);

// Update appointment types
/**
 * @swagger
 * /api/providers/{id}/appointment-types:
 *   patch:
 *     summary: Atualizar tipos de agendamento
 *     description: Atualiza os tipos de agendamento de um profissional
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do profissional
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               appointmentTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Tipos de agendamento atualizados com sucesso
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
 *                   $ref: '#/components/schemas/Provider'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Profissional não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.patch('/:id/appointment-types',
    authorize('super_admin', 'admin', 'manager'),
    body('appointmentTypes').isArray().withMessage('Tipos de agendamento deve ser um array'),
    body('appointmentTypes.*').isMongoId().withMessage('ID de tipo de agendamento inválido'),
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

            const provider = await providerService.updateAppointmentTypes(
                req.params.id,
                req.user.clinicId,
                req.body.appointmentTypes
            );

            if (!provider) {
                return res.status(404).json({
                    success: false,
                    message: 'Profissional não encontrado'
                });
            }

            return res.json({
                success: true,
                message: 'Tipos de agendamento atualizados com sucesso',
                data: provider
            });
        } catch (error: any) {
            console.error('Error updating appointment types:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao atualizar tipos de agendamento'
            });
        }
    }
);

// Reactivate provider
/**
 * @swagger
 * /api/providers/{id}/reactivate:
 *   patch:
 *     summary: Reativar profissional
 *     description: Reativa um profissional inativo
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do profissional
 *     responses:
 *       200:
 *         description: Profissional reativado com sucesso
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
 *                   $ref: '#/components/schemas/Provider'
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Profissional inativo não encontrado
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

            const provider = await providerService.reactivateProvider(req.params.id, req.user.clinicId);

            if (!provider) {
                return res.status(404).json({
                    success: false,
                    message: 'Profissional inativo não encontrado'
                });
            }

            return res.json({
                success: true,
                message: 'Profissional reativado com sucesso',
                data: provider
            });
        } catch (error: any) {
            console.error('Error reactivating provider:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao reativar profissional'
            });
        }
    }
);

// Delete provider (soft delete)
/**
 * @swagger
 * /api/providers/{id}:
 *   delete:
 *     summary: Excluir profissional
 *     description: Exclui um profissional (soft delete)
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do profissional
 *     responses:
 *       200:
 *         description: Profissional excluído com sucesso
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
 *         description: Profissional não encontrado
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

            const success = await providerService.deleteProvider(req.params.id, req.user.clinicId);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Profissional não encontrado'
                });
            }

            return res.json({
                success: true,
                message: 'Profissional excluído com sucesso'
            });
        } catch (error: any) {
            console.error('Error deleting provider:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Erro ao excluir profissional'
            });
        }
    }
);

export default router;