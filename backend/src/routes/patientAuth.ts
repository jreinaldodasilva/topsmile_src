import express from 'express';
import { body, validationResult } from 'express-validator';
import { patientAuthService, PatientRegisterData, PatientLoginData } from '../services/patientAuthService';
import { authenticatePatient, PatientAuthenticatedRequest } from '../middleware/patientAuth';

const router = express.Router();

// Validation rules for patient registration
const registerValidation = [
  body('patientId')
    .isMongoId()
    .withMessage('ID do paciente inválido'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('E-mail inválido'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número')
];

// Validation rules for patient login
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('E-mail inválido'),

  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória')
];

// Validation rules for password reset
const resetPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('E-mail inválido')
];

const newPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Token é obrigatório'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número')
];

/**
 * @swagger
 * /api/patient/auth/register:
 *   post:
 *     summary: Registrar conta de paciente
 *     description: Cria uma nova conta para um paciente existente
 *     tags: [Patient Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - email
 *               - password
 *             properties:
 *               patientId:
 *                 type: string
 *                 description: ID do paciente
 *               email:
 *                 type: string
 *                 format: email
 *                 description: E-mail do paciente
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Senha da conta
 *     responses:
 *       201:
 *         description: Conta criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 patientUser:
 *                   $ref: '#/components/schemas/PatientUser'
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/register', registerValidation, async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const registerData: PatientRegisterData = {
      patientId: req.body.patientId,
      email: req.body.email,
      password: req.body.password
    };

    const result = await patientAuthService.register(registerData);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Patient registration error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao registrar conta'
    });
  }
});

/**
 * @swagger
 * /api/patient/auth/login:
 *   post:
 *     summary: Login do paciente
 *     description: Autentica um paciente e retorna tokens de acesso
 *     tags: [Patient Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: E-mail do paciente
 *               password:
 *                 type: string
 *                 description: Senha da conta
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 patientUser:
 *                   $ref: '#/components/schemas/PatientUser'
 *                 accessToken:
 *                   type: string
 *                   description: Token de acesso JWT
 *                 refreshToken:
 *                   type: string
 *                   description: Token de refresh
 *       400:
 *         description: Credenciais inválidas
 *       401:
 *         description: Conta bloqueada ou inativa
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/login', loginValidation, async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const loginData: PatientLoginData = {
      email: req.body.email,
      password: req.body.password
    };

    const result = await patientAuthService.login(loginData);

    if (!result.success) {
      const statusCode = result.message?.includes('bloqueada') ? 401 : 400;
      return res.status(statusCode).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Patient login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao fazer login'
    });
  }
});

/**
 * @swagger
 * /api/patient/auth/refresh:
 *   post:
 *     summary: Renovar token de acesso
 *     description: Renova o token de acesso usando o refresh token
 *     tags: [Patient Auth]
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                   description: Novo token de acesso
 *                 refreshToken:
 *                   type: string
 *                   description: Novo token de refresh
 *       401:
 *         description: Token inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/refresh', async (req: express.Request, res: express.Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token é obrigatório'
      });
    }

    const result = await patientAuthService.refreshToken(refreshToken);

    if (!result.success) {
      return res.status(401).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao renovar token'
    });
  }
});

/**
 * @swagger
 * /api/patient/auth/me:
 *   get:
 *     summary: Obter dados do paciente logado
 *     description: Retorna os dados do paciente atualmente logado
 *     tags: [Patient Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do paciente retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 patientUser:
 *                   $ref: '#/components/schemas/PatientUser'
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/me', authenticatePatient, async (req: PatientAuthenticatedRequest, res) => {
  try {
    return res.json({
      success: true,
      patientUser: req.patientUser
    });
  } catch (error: any) {
    console.error('Get patient profile error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao obter dados do paciente'
    });
  }
});

/**
 * @swagger
 * /api/patient/auth/verify-email:
 *   post:
 *     summary: Verificar e-mail
 *     description: Verifica o e-mail do paciente usando token de verificação
 *     tags: [Patient Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token de verificação de e-mail
 *     responses:
 *       200:
 *         description: E-mail verificado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Token inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/verify-email', async (req: express.Request, res: express.Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token de verificação é obrigatório'
      });
    }

    const result = await patientAuthService.verifyEmail(token);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao verificar e-mail'
    });
  }
});

/**
 * @swagger
 * /api/patient/auth/forgot-password:
 *   post:
 *     summary: Solicitar redefinição de senha
 *     description: Envia e-mail com instruções para redefinir senha
 *     tags: [Patient Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: E-mail do paciente
 *     responses:
 *       200:
 *         description: Instruções enviadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/forgot-password', resetPasswordValidation, async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const result = await patientAuthService.requestPasswordReset(req.body.email);

    return res.json(result);
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao solicitar redefinição de senha'
    });
  }
});

/**
 * @swagger
 * /api/patient/auth/reset-password:
 *   post:
 *     summary: Redefinir senha
 *     description: Redefine a senha do paciente usando token
 *     tags: [Patient Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token de redefinição de senha
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Nova senha
 *     responses:
 *       200:
 *         description: Senha redefinida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Token inválido ou senha fraca
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/reset-password', newPasswordValidation, async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { token, password } = req.body;
    const result = await patientAuthService.resetPassword(token, password);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao redefinir senha'
    });
  }
});

/**
 * @swagger
 * /api/patient/auth/logout:
 *   post:
 *     summary: Logout do paciente
 *     description: Invalida a sessão do paciente
 *     tags: [Patient Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
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
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/logout', authenticatePatient, async (req: PatientAuthenticatedRequest, res) => {
  try {
    // In a production environment, you might want to blacklist the token
    // For now, we'll just return success since the client should discard the tokens
    return res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao fazer logout'
    });
  }
});

export default router;
