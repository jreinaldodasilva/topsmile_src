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
    .matches(/^[\d\s\-\(\)\+]{10,20}$/)
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

// Get current user profile
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

// Change password
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
 * Refresh access token using refresh token rotation
 * POST /api/auth/refresh
 * body: { refreshToken }
 * returns: { success: true, data: { accessToken, refreshToken, expiresIn } }
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
 * Revoke a specific refresh token (logout from a device)
 * POST /api/auth/logout
 * body: { refreshToken }
 * Auth required.
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
 * Revoke all refresh tokens for the current user (logout from all devices)
 * POST /api/auth/logout-all
 * Auth required.
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