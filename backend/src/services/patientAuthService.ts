import { PatientUser, IPatientUser } from '../models/PatientUser';
import { Patient } from '../models/Patient';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

export interface PatientRegisterData {
  patientId: string;
  email: string;
  password: string;
}

export interface PatientLoginData {
  email: string;
  password: string;
}

export interface PatientAuthResponse {
  success: boolean;
  patientUser?: any;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}

export interface TokenPayload {
  patientUserId: string;
  patientId: string;
  email: string;
  type: 'patient';
}

class PatientAuthService {
  // Register a new patient user account
  async register(data: PatientRegisterData): Promise<PatientAuthResponse> {
    try {
      const { patientId, email, password } = data;

      // Validate patient exists and is active
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return {
          success: false,
          message: 'Paciente não encontrado'
        };
      }

      if (patient.status !== 'active') {
        return {
          success: false,
          message: 'Paciente não está ativo'
        };
      }

      // Check if patient already has a user account
      const existingUser = await PatientUser.findOne({ patient: patientId });
      if (existingUser) {
        return {
          success: false,
          message: 'Já existe uma conta para este paciente'
        };
      }

      // Check if email is already taken
      const existingEmail = await PatientUser.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return {
          success: false,
          message: 'Este e-mail já está sendo usado'
        };
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Create patient user
      const patientUser = new PatientUser({
        patient: patientId,
        email: email.toLowerCase(),
        password,
        verificationToken,
        emailVerified: false
      });

      await patientUser.save();

      // Populate patient data
      await patientUser.populate('patient', 'name email phone');

      return {
        success: true,
        patientUser,
        message: 'Conta criada com sucesso. Verifique seu e-mail para ativar a conta.'
      };
    } catch (error: any) {
      console.error('Patient registration error:', error);
      return {
        success: false,
        message: error.message || 'Erro ao criar conta'
      };
    }
  }

  // Login patient user
  async login(data: PatientLoginData): Promise<PatientAuthResponse> {
    try {
      const { email, password } = data;

      // Find patient user by email
      const patientUser = await PatientUser.findOne({ email: email.toLowerCase() })
        .populate('patient', 'name email phone clinic');

      if (!patientUser) {
        return {
          success: false,
          message: 'E-mail ou senha incorretos'
        };
      }

      // Check if account is active
      if (!patientUser.isActive) {
        return {
          success: false,
          message: 'Conta desativada'
        };
      }

      // Check if account is locked
      if (patientUser.isLocked()) {
        return {
          success: false,
          message: 'Conta temporariamente bloqueada devido a muitas tentativas de login'
        };
      }

      // Verify password
      const isValidPassword = await patientUser.comparePassword(password);
      if (!isValidPassword) {
        patientUser.incLoginAttempts();
        await patientUser.save();

        return {
          success: false,
          message: 'E-mail ou senha incorretos'
        };
      }

      // Reset login attempts on successful login
      patientUser.resetLoginAttempts();
      patientUser.lastLogin = new Date();
      await patientUser.save();

      // Generate tokens
      const tokens = await this.generateTokens(patientUser);

      return {
        success: true,
        patientUser,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        message: 'Login realizado com sucesso'
      };
    } catch (error: any) {
      console.error('Patient login error:', error);
      return {
        success: false,
        message: error.message || 'Erro ao fazer login'
      };
    }
  }

  // Generate access and refresh tokens
  private async generateTokens(patientUser: IPatientUser): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: TokenPayload = {
      patientUserId: (patientUser._id as any).toString(),
      patientId: patientUser.patient.toString(),
      email: patientUser.email,
      type: 'patient'
    };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m', algorithm: 'HS256' } as SignOptions
    );

    const refreshToken = jwt.sign(
      { patientUserId: (patientUser._id as any).toString(), type: 'patient' },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7d' } as SignOptions
    );

    return { accessToken, refreshToken };
  }

  // Verify and refresh access token
  async refreshToken(token: string): Promise<PatientAuthResponse> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

      if (decoded.type !== 'patient') {
        return {
          success: false,
          message: 'Token inválido'
        };
      }

      const patientUser = await PatientUser.findById(decoded.patientUserId)
        .populate('patient', 'name email phone clinic');

      if (!patientUser || !patientUser.isActive) {
        return {
          success: false,
          message: 'Usuário não encontrado ou conta desativada'
        };
      }

      const tokens = await this.generateTokens(patientUser);

      return {
        success: true,
        patientUser,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        message: 'Token renovado com sucesso'
      };
    } catch (error: any) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        message: 'Token inválido ou expirado'
      };
    }
  }

  // Get patient user by ID
  async getPatientUserById(patientUserId: string): Promise<IPatientUser | null> {
    try {
      return await PatientUser.findById(patientUserId)
        .populate('patient', 'name email phone clinic birthDate gender');
    } catch (error) {
      console.error('Error getting patient user:', error);
      return null;
    }
  }

  // Verify email
  async verifyEmail(token: string): Promise<PatientAuthResponse> {
    try {
      const patientUser = await PatientUser.findOne({ verificationToken: token });

      if (!patientUser) {
        return {
          success: false,
          message: 'Token de verificação inválido'
        };
      }

      patientUser.emailVerified = true;
      patientUser.verificationToken = undefined;
      await patientUser.save();

      return {
        success: true,
        message: 'E-mail verificado com sucesso'
      };
    } catch (error: any) {
      console.error('Email verification error:', error);
      return {
        success: false,
        message: error.message || 'Erro ao verificar e-mail'
      };
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<PatientAuthResponse> {
    try {
      const patientUser = await PatientUser.findOne({ email: email.toLowerCase() });

      if (!patientUser) {
        // Don't reveal if email exists or not for security
        return {
          success: true,
          message: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha'
        };
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      patientUser.resetPasswordToken = resetToken;
      patientUser.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await patientUser.save();

      // TODO: Send email with reset token
      console.log(`Password reset token for ${email}: ${resetToken}`);

      return {
        success: true,
        message: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha'
      };
    } catch (error: any) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        message: error.message || 'Erro ao solicitar redefinição de senha'
      };
    }
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<PatientAuthResponse> {
    try {
      const patientUser = await PatientUser.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
      });

      if (!patientUser) {
        return {
          success: false,
          message: 'Token inválido ou expirado'
        };
      }

      patientUser.password = newPassword;
      patientUser.resetPasswordToken = undefined;
      patientUser.resetPasswordExpires = undefined;
      await patientUser.save();

      return {
        success: true,
        message: 'Senha redefinida com sucesso'
      };
    } catch (error: any) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: error.message || 'Erro ao redefinir senha'
      };
    }
  }
}

export const patientAuthService = new PatientAuthService();
