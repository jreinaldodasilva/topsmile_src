//backend/src/routes/auth.ts
import express from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { authService } from '../services/authService';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import DOMPurify from 'isomorphic-dompurify';
import { Request, Response } from 'express';

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    success: false,
    message: 'Muitos cadastros realizados. Tente novamente em 1 hora.'
  }
});

// Validation rules
const registerValidation = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]*$/)
    .withMessage('Nome deve conter apenas letras e espaços'),

  body('email')
    .isEmail()
    .withMessage('Digite um e-mail válido')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter ao menos uma letra minúscula, uma maiúscula e um número'),

  // Clinic validation (optional)
  body('clinic.name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome da clínica deve ter entre 2 e 100 caracteres'),

  body('clinic.phone')
    .optional()
    .matches(/^[\d\s\-()+]{10,20}$/)
    .withMessage('Telefone da clínica inválido'),

  body('clinic.address.street')
    .optional()
    .isLength({ min: 5, max: 100 })
    .withMessage('Endereço deve ter entre 5 e 100 caracteres'),

  body('clinic.address.city')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Cidade deve ter entre 2 e 50 caracteres'),

  body('clinic.address.state')
    .optional()
    .isLength({ min: 2, max: 2 })
    .withMessage('Estado deve ter 2 caracteres'),

  body('clinic.address.zipCode')
    .optional()
    .matches(/^\d{5}-?\d{3}$/)
    .withMessage('CEP inválido')
];

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: E-mail do usuário
 *         password:
 *           type: string
 *           description: Senha do usuário
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: Nome completo do usuário
 *         email:
 *           type: string
 *           format: email
 *           description: E-mail do usuário
 *         password:
 *           type: string
 *           minLength: 8
 *           description: Senha (mínimo 8 caracteres, deve conter maiúscula, minúscula, número e símbolo)
 *         clinic:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               description: Nome da clínica
 *             phone:
 *               type: string
 *               description: Telefone da clínica
 *             address:
 *               type: object
 *               properties:
 *                 street:
 *                   type: string
 *                   description: Rua
 *                 number:
 *                   type: string
 *                   description: Número
 *                 neighborhood:
 *                   type: string
 *                   description: Bairro
 *                 city:
 *                   type: string
 *                   description: Cidade
 *                 state:
 *                   type: string
 *                   description: Estado
 *                 zipCode:
 *                   type: string
 *                   description: CEP
 */
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Digite um e-mail válido')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 1 })
    .withMessage('Senha é obrigatória')
];

const changePasswordValidation = [
  body('currentPassword')
    .isLength({ min: 1 })
    .withMessage('Senha atual é obrigatória'),

  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nova senha deve conter ao menos uma letra minúscula, uma maiúscula e um número')
];

// Sanitize input data
const sanitizeAuthData = (data: any) => {
  const sanitized: any = {};

  for (const key in data) {
    if (typeof data[key] === 'string') {
      sanitized[key] = DOMPurify.sanitize(data[key].trim());
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      sanitized[key] = sanitizeAuthData(data[key]);
    } else {
      sanitized[key] = data[key];
    }
  }

  return sanitized;
};

// Register endpoint
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar novo usuário
 *     description: Cria uma nova conta de usuário no sistema
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Muitas tentativas de registro
 */
router.post('/register', registerLimiter, registerValidation, async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    // Sanitize input
    const sanitizedData = sanitizeAuthData(req.body);

    const result = await authService.register(sanitizedData);

    return res.status(201).json(result);
  } catch (error) {
    console.error('Register error:', error);

    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao criar usuário'
    });
  }
});

// Login endpoint
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Fazer login
 *     description: Autentica um usuário e retorna tokens de acesso
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Credenciais inválidas
 *       429:
 *         description: Muitas tentativas de login
 */
router.post('/login', authLimiter, loginValidation, async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    // Sanitize input
    const sanitizedData = sanitizeAuthData(req.body);

    // Extract device info for refresh token
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
      deviceId: req.headers['x-device-id'] as string
    };

    const result = await authService.login(sanitizedData, deviceInfo);

    return res.json(result);
  } catch (error) {
    console.error('Login error:', error);

    return res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao fazer login'
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obter perfil do usuário atual
 *     description: Retorna os dados do usuário autenticado
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Não autorizado
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await authService.getUserById(req.user!.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    return res.json({
      success: true,
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar perfil do usuário'
    });
  }
});

/**
 * @swagger
 * /api/auth/change-password:
 *   patch:
 *     summary: Alterar senha
 *     description: Altera a senha do usuário autenticado
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Senha atual
 *               newPassword:
 *                 type: string
 *                 description: Nova senha
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *       400:
 *         description: Dados inválidos ou senha atual incorreta
 *       401:
 *         description: Não autorizado
 */
router.patch('/change-password', authenticate, changePasswordValidation, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(req.user!.id, currentPassword, newPassword);

    return res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao alterar senha'
    });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renovar token de acesso
 *     description: Renova o token de acesso usando o refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Token de refresh
 *     responses:
 *       200:
 *         description: Token renovado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Token de refresh inválido ou expirado
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token de atualização obrigatório' 
      });
    }

    const tokens = await authService.refreshAccessToken(refreshToken);

    return res.json({ success: true, data: tokens });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao renovar token'
    });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Fazer logout
 *     description: Revoga um token de refresh específico (logout de um dispositivo)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Token de refresh a ser revogado
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 *       401:
 *         description: Não autorizado
 */
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    
    // Log for development
    console.log(`User ${req.user!.email} logged out at ${new Date().toISOString()}`);
    
    return res.json({ 
      success: true, 
      message: 'Logout realizado com sucesso' 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao fazer logout' 
    });
  }
});

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: Fazer logout de todos os dispositivos
 *     description: Revoga todos os tokens de refresh do usuário (logout de todos os dispositivos)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado em todos os dispositivos
 *       401:
 *         description: Não autorizado
 */
router.post('/logout-all', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await authService.logoutAllDevices(req.user!.id);
    return res.json({ 
      success: true, 
      message: 'Logout realizado em todos os dispositivos' 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao fazer logout' 
    });
  }
});

export default router;