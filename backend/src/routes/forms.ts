// backend/src/routes/forms.ts
import express from 'express';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// All form routes require authentication
router.use(authenticate);

// Mock form templates data (in a real app, this would come from a database)
const mockFormTemplates = [
  {
    _id: '1',
    title: 'Anamnese Geral',
    description: 'Formulário de anamnese geral para novos pacientes',
    category: 'medical',
    isActive: true,
    questions: [
      {
        id: 'q1',
        label: 'Você tem alguma alergia conhecida?',
        type: 'textarea',
        required: true
      },
      {
        id: 'q2',
        label: 'Está tomando algum medicamento atualmente?',
        type: 'textarea',
        required: false
      },
      {
        id: 'q3',
        label: 'Tem alguma condição médica pré-existente?',
        type: 'textarea',
        required: false
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '2',
    title: 'Avaliação de Dor',
    description: 'Formulário para avaliação de dor odontológica',
    category: 'assessment',
    isActive: true,
    questions: [
      {
        id: 'q1',
        label: 'Em uma escala de 1 a 10, qual é o nível da sua dor?',
        type: 'number',
        required: true,
        min: 1,
        max: 10
      },
      {
        id: 'q2',
        label: 'Quando a dor começou?',
        type: 'date',
        required: true
      },
      {
        id: 'q3',
        label: 'Descreva a dor (pulsante, constante, aguda, etc.)',
        type: 'textarea',
        required: true
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '3',
    title: 'Satisfação do Paciente',
    description: 'Formulário de avaliação da satisfação pós-tratamento',
    category: 'feedback',
    isActive: true,
    questions: [
      {
        id: 'q1',
        label: 'Como você avalia o atendimento recebido?',
        type: 'select',
        required: true,
        options: ['Excelente', 'Bom', 'Regular', 'Ruim']
      },
      {
        id: 'q2',
        label: 'Você recomendaria nossa clínica?',
        type: 'radio',
        required: true,
        options: ['Sim', 'Não', 'Talvez']
      },
      {
        id: 'q3',
        label: 'Comentários adicionais',
        type: 'textarea',
        required: false
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// Mock form responses data
const mockFormResponses = [
  {
    _id: 'r1',
    templateId: '1',
    patientId: 'patient1',
    answers: {
      q1: 'Alergia a penicilina',
      q2: 'Losartana 50mg',
      q3: 'Hipertensão arterial'
    },
    submittedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15')
  },
  {
    _id: 'r2',
    templateId: '2',
    patientId: 'patient2',
    answers: {
      q1: '8',
      q2: '2024-01-10',
      q3: 'Dor pulsante no dente superior direito'
    },
    submittedAt: new Date('2024-01-16'),
    createdAt: new Date('2024-01-16')
  }
];

// Validation for form templates
const templateValidation = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Título deve ter entre 2 e 100 caracteres'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres'),
  
  body('category')
    .optional()
    .isIn(['medical', 'assessment', 'feedback', 'intake', 'consent'])
    .withMessage('Categoria inválida'),
  
  body('questions')
    .isArray({ min: 1 })
    .withMessage('Pelo menos uma pergunta é obrigatória'),
  
  body('questions.*.label')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Rótulo da pergunta deve ter entre 2 e 200 caracteres'),
  
  body('questions.*.type')
    .isIn(['text', 'textarea', 'number', 'date', 'select', 'radio', 'checkbox'])
    .withMessage('Tipo de pergunta inválido'),
  
  body('questions.*.required')
    .isBoolean()
    .withMessage('Campo obrigatório deve ser verdadeiro ou falso')
];

// Validation for form responses
const responseValidation = [
  body('templateId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('ID do template é obrigatório'),
  
  body('patientId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('ID do paciente é obrigatório'),
  
  body('answers')
    .isObject()
    .withMessage('Respostas devem ser um objeto')
];

// FORM TEMPLATES ROUTES

// Get all form templates
/**
 * @swagger
 * /api/forms/templates:
 *   get:
 *     summary: Listar templates de formulário
 *     description: Retorna lista de templates de formulário com filtros opcionais
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [medical, assessment, feedback, intake, consent]
 *         description: Filtrar por categoria
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo
 *     responses:
 *       200:
 *         description: Templates retornados com sucesso
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
 *                     $ref: '#/components/schemas/FormTemplate'
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/templates', async (req: AuthenticatedRequest, res) => {
  try {
    const { category, isActive } = req.query;
    
    let templates = [...mockFormTemplates];
    
    // Filter by category
    if (category) {
      templates = templates.filter(t => t.category === category);
    }
    
    // Filter by active status
    if (isActive !== undefined) {
      const activeFilter = isActive === 'true';
      templates = templates.filter(t => t.isActive === activeFilter);
    }
    
    return res.json({
      success: true,
      data: templates
    });
  } catch (error: any) {
    console.error('Error fetching form templates:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar templates de formulário'
    });
  }
});

// Get specific form template
/**
 * @swagger
 * /api/forms/templates/{id}:
 *   get:
 *     summary: Buscar template de formulário por ID
 *     description: Retorna um template de formulário específico pelo ID
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do template
 *     responses:
 *       200:
 *         description: Template encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/FormTemplate'
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Template não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/templates/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const template = mockFormTemplates.find(t => t._id === req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template de formulário não encontrado'
      });
    }
    
    return res.json({
      success: true,
      data: template
    });
  } catch (error: any) {
    console.error('Error fetching form template:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar template de formulário'
    });
  }
});

/**
 * @swagger
 * /api/forms/templates:
 *   post:
 *     summary: Criar template de formulário
 *     description: Cria um novo template de formulário
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FormTemplate'
 *     responses:
 *       201:
 *         description: Template criado com sucesso
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
 *                   $ref: '#/components/schemas/FormTemplate'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.post('/templates',
  authorize('super_admin', 'admin', 'manager'),
  templateValidation,
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
      
      const newTemplate = {
        _id: `template_${Date.now()}`,
        ...req.body,
        isActive: req.body.isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // In a real app, save to database
      mockFormTemplates.push(newTemplate);
      
      return res.status(201).json({
        success: true,
        message: 'Template de formulário criado com sucesso',
        data: newTemplate
      });
    } catch (error: any) {
      console.error('Error creating form template:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar template de formulário'
      });
    }
  }
);

/**
 * @swagger
 * /api/forms/templates/{id}:
 *   patch:
 *     summary: Atualizar template de formulário
 *     description: Atualiza os dados de um template de formulário
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do template
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FormTemplate'
 *     responses:
 *       200:
 *         description: Template atualizado com sucesso
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
 *                   $ref: '#/components/schemas/FormTemplate'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Template não encontrado
 */
router.patch('/templates/:id',
  authorize('super_admin', 'admin', 'manager'),
  templateValidation.map(validation => validation.optional()),
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
      
      const templateIndex = mockFormTemplates.findIndex(t => t._id === req.params.id);
      
      if (templateIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Template de formulário não encontrado'
        });
      }
      
      // Update template
      mockFormTemplates[templateIndex] = {
        ...mockFormTemplates[templateIndex],
        ...req.body,
        updatedAt: new Date()
      };
      
      return res.json({
        success: true,
        message: 'Template de formulário atualizado com sucesso',
        data: mockFormTemplates[templateIndex]
      });
    } catch (error: any) {
      console.error('Error updating form template:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar template de formulário'
      });
    }
  }
);

/**
 * @swagger
 * /api/forms/templates/{id}:
 *   delete:
 *     summary: Excluir template de formulário
 *     description: Exclui um template de formulário
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do template
 *     responses:
 *       200:
 *         description: Template excluído com sucesso
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
 *         description: Template não encontrado
 */
router.delete('/templates/:id',
  authorize('super_admin', 'admin'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const templateIndex = mockFormTemplates.findIndex(t => t._id === req.params.id);
      
      if (templateIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Template de formulário não encontrado'
        });
      }
      
      // In a real app, you might want to soft delete or check for dependencies
      mockFormTemplates.splice(templateIndex, 1);
      
      return res.json({
        success: true,
        message: 'Template de formulário excluído com sucesso'
      });
    } catch (error: any) {
      console.error('Error deleting form template:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao excluir template de formulário'
      });
    }
  }
);

// FORM RESPONSES ROUTES

// Get all form responses
/**
 * @swagger
 * /api/forms/responses:
 *   get:
 *     summary: Listar respostas de formulário
 *     description: Retorna lista de respostas de formulário com filtros opcionais
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: templateId
 *         schema:
 *           type: string
 *         description: Filtrar por ID do template
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *         description: Filtrar por ID do paciente
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final
 *     responses:
 *       200:
 *         description: Respostas retornadas com sucesso
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
 *                     $ref: '#/components/schemas/FormResponse'
 *       401:
 *         description: Não autorizado
 */
router.get('/responses', async (req: AuthenticatedRequest, res) => {
  try {
    const { templateId, patientId, startDate, endDate } = req.query;
    
    let responses = [...mockFormResponses];
    
    // Filter by template
    if (templateId) {
      responses = responses.filter(r => r.templateId === templateId);
    }
    
    // Filter by patient
    if (patientId) {
      responses = responses.filter(r => r.patientId === patientId);
    }
    
    // Filter by date range
    if (startDate || endDate) {
      responses = responses.filter(r => {
        const responseDate = new Date(r.submittedAt);
        if (startDate && responseDate < new Date(startDate as string)) return false;
        if (endDate && responseDate > new Date(endDate as string)) return false;
        return true;
      });
    }
    
    return res.json({
      success: true,
      data: responses
    });
  } catch (error: any) {
    console.error('Error fetching form responses:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar respostas de formulário'
    });
  }
});

/**
 * @swagger
 * /api/forms/responses/{id}:
 *   get:
 *     summary: Buscar resposta de formulário por ID
 *     description: Retorna uma resposta de formulário específica pelo ID
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da resposta
 *     responses:
 *       200:
 *         description: Resposta encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/FormResponse'
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Resposta não encontrada
 */
router.get('/responses/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const response = mockFormResponses.find(r => r._id === req.params.id);
    
    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Resposta de formulário não encontrada'
      });
    }
    
    return res.json({
      success: true,
      data: response
    });
  } catch (error: any) {
    console.error('Error fetching form response:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar resposta de formulário'
    });
  }
});

/**
 * @swagger
 * /api/forms/responses:
 *   post:
 *     summary: Criar resposta de formulário
 *     description: Cria uma nova resposta de formulário
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FormResponse'
 *     responses:
 *       201:
 *         description: Resposta criada com sucesso
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
 *                   $ref: '#/components/schemas/FormResponse'
 *       400:
 *         description: Dados inválidos
 */
router.post('/responses',
  responseValidation,
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
      
      // Validate that template exists
      const template = mockFormTemplates.find(t => t._id === req.body.templateId);
      if (!template) {
        return res.status(400).json({
          success: false,
          message: 'Template de formulário não encontrado'
        });
      }
      
      const newResponse = {
        _id: `response_${Date.now()}`,
        templateId: req.body.templateId,
        patientId: req.body.patientId,
        answers: req.body.answers,
        submittedAt: new Date(),
        createdAt: new Date()
      };
      
      // In a real app, save to database
      mockFormResponses.push(newResponse);
      
      return res.status(201).json({
        success: true,
        message: 'Resposta de formulário salva com sucesso',
        data: newResponse
      });
    } catch (error: any) {
      console.error('Error creating form response:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao salvar resposta de formulário'
      });
    }
  }
);

/**
 * @swagger
 * /api/forms/responses/{id}:
 *   patch:
 *     summary: Atualizar resposta de formulário
 *     description: Atualiza os dados de uma resposta de formulário
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da resposta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FormResponse'
 *     responses:
 *       200:
 *         description: Resposta atualizada com sucesso
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
 *                   $ref: '#/components/schemas/FormResponse'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Resposta não encontrada
 */
router.patch('/responses/:id',
  responseValidation.map(validation => validation.optional()),
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
      
      const responseIndex = mockFormResponses.findIndex(r => r._id === req.params.id);
      
      if (responseIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Resposta de formulário não encontrada'
        });
      }
      
      // Update response
      mockFormResponses[responseIndex] = {
        ...mockFormResponses[responseIndex],
        ...req.body,
        updatedAt: new Date()
      };
      
      return res.json({
        success: true,
        message: 'Resposta de formulário atualizada com sucesso',
        data: mockFormResponses[responseIndex]
      });
    } catch (error: any) {
      console.error('Error updating form response:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar resposta de formulário'
      });
    }
  }
);

/**
 * @swagger
 * /api/forms/responses/{id}:
 *   delete:
 *     summary: Excluir resposta de formulário
 *     description: Exclui uma resposta de formulário
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da resposta
 *     responses:
 *       200:
 *         description: Resposta excluída com sucesso
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
 *         description: Resposta não encontrada
 */
router.delete('/responses/:id',
  authorize('super_admin', 'admin', 'manager'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const responseIndex = mockFormResponses.findIndex(r => r._id === req.params.id);
      
      if (responseIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Resposta de formulário não encontrada'
        });
      }
      
      mockFormResponses.splice(responseIndex, 1);
      
      return res.json({
        success: true,
        message: 'Resposta de formulário excluída com sucesso'
      });
    } catch (error: any) {
      console.error('Error deleting form response:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao excluir resposta de formulário'
      });
    }
  }
);

/**
 * @swagger
 * /api/forms/stats:
 *   get:
 *     summary: Estatísticas de formulários
 *     description: Retorna estatísticas dos formulários da clínica
 *     tags: [Forms]
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
 *                     totalTemplates:
 *                       type: integer
 *                     activeTemplates:
 *                       type: integer
 *                     totalResponses:
 *                       type: integer
 *                     responsesByTemplate:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           templateId:
 *                             type: string
 *                           templateTitle:
 *                             type: string
 *                           responseCount:
 *                             type: integer
 *                     recentResponses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FormResponse'
 *       401:
 *         description: Não autorizado
 */
router.get('/stats',
  authorize('super_admin', 'admin', 'manager'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const stats = {
        totalTemplates: mockFormTemplates.length,
        activeTemplates: mockFormTemplates.filter(t => t.isActive).length,
        totalResponses: mockFormResponses.length,
        responsesByTemplate: mockFormTemplates.map(template => ({
          templateId: template._id,
          templateTitle: template.title,
          responseCount: mockFormResponses.filter(r => r.templateId === template._id).length
        })),
        recentResponses: mockFormResponses
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
          .slice(0, 10)
      };
      
      return res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Error fetching form stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas de formulários'
      });
    }
  }
);

export default router;