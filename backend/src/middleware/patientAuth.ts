import jwt from 'jsonwebtoken';
import { PatientUser } from '../models/PatientUser';
import { Request, Response, NextFunction } from 'express';

export interface PatientAuthenticatedRequest extends Request {
  patientUser?: any;
  patient?: any;
}

export const authenticatePatient = async (
  req: PatientAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido'
      });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback-secret'
      ) as any;

      if (decoded.type !== 'patient') {
        res.status(401).json({
          success: false,
          message: 'Token inválido para pacientes'
        });
        return;
      }

      // Get patient user with populated patient data
      const patientUser = await PatientUser.findById(decoded.patientUserId)
        .populate('patient', 'name email phone clinic birthDate gender address emergencyContact medicalHistory status');

      if (!patientUser || !patientUser.isActive) {
        res.status(401).json({
          success: false,
          message: 'Usuário não encontrado ou conta desativada'
        });
        return;
      }

      req.patientUser = patientUser;
      req.patient = patientUser.patient;
      next();
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
      return;
    }
  } catch (error) {
    console.error('Patient authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const requirePatientVerification = (
  req: PatientAuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.patientUser?.emailVerified) {
    res.status(403).json({
      success: false,
      message: 'E-mail não verificado. Verifique seu e-mail antes de continuar.'
    });
    return;
  }
  next();
};
