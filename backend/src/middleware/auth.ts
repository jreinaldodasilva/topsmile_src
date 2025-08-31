// backend/src/middleware/auth.ts - FIXED VERSION
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';

/**
 * Extended request interface with user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
    clinicId?: string;
  };
}

/**
 * Extract Bearer token from Authorization header or cookies
 */
const extractToken = (req: Request): string | null => {
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) return match[1];
  }

  // Check cookies as fallback (if using cookie-based auth)
  const cookies = (req as any).cookies;
  if (cookies) {
    return cookies['topsmile_access_token'] || 
           cookies['topsmile_token'] || 
           cookies['access_token'] || 
           null;
  }

  return null;
};

/**
 * Authentication middleware: verifies access token and attaches req.user
 */
export const authenticate = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Token de acesso obrigatório',
        code: 'NO_TOKEN'
      });
      return;
    }

    // Verify the access token
    const payload = await authService.verifyAccessToken(token);
    
    // Type-safe payload extraction
    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      res.status(401).json({ 
        success: false, 
        message: 'Token inválido: formato incorreto',
        code: 'INVALID_TOKEN_FORMAT'
      });
      return;
    }

    // Extract user information with proper typing
    const typedPayload = payload as any; // We'll fix this with proper TokenPayload type
    const userId = typedPayload.userId || typedPayload.id;
    
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Token inválido: dados do usuário não encontrados',
        code: 'INVALID_TOKEN_PAYLOAD'
      });
      return;
    }

    // Attach user info to request
    req.user = {
      id: String(userId),
      email: typedPayload.email,
      role: typedPayload.role,
      clinicId: typedPayload.clinicId,
    };

    // Optional: Verify user still exists and is active
    if (process.env.VERIFY_USER_ON_REQUEST === 'true') {
      const user = await authService.getUserById(req.user.id);
      if (!user || !user.isActive) {
        res.status(401).json({ 
          success: false, 
          message: 'Usuário inválido ou inativo',
          code: 'USER_INACTIVE'
        });
        return;
      }
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Handle different JWT errors with better logging
    let message = 'Token inválido ou expirado';
    let code = 'INVALID_TOKEN';
    
    if (error instanceof Error) {
      // Log the actual error for debugging (but don't expose to client)
      console.error('JWT Error Details:', error.message);
      
      if (error.message.includes('expired')) {
        message = 'Token expirado';
        code = 'TOKEN_EXPIRED';
      } else if (error.message.includes('invalid')) {
        message = 'Token inválido';
        code = 'INVALID_TOKEN';
      } else if (error.message.includes('malformed')) {
        message = 'Token malformado';
        code = 'MALFORMED_TOKEN';
      }
    }

    res.status(401).json({ 
      success: false, 
      message,
      code
    });
    return;
  }
};

/**
 * Role-based authorization middleware factory - SECURITY FIXED
 * Usage: authorize('admin', 'manager') - allows only these roles
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'Autenticação obrigatória',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const userRole = req.user.role;
    
    if (!userRole) {
      res.status(403).json({ 
        success: false, 
        message: 'Permissões de usuário não definidas',
        code: 'NO_ROLE'
      });
      return;
    }

    // Super admin has access to everything
    if (userRole === 'super_admin') {
      next();
      return;
    }

    // Check if user's role is in allowed roles
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      // SECURITY FIX: Don't expose internal role structure
      res.status(403).json({ 
        success: false, 
        message: 'Acesso negado: permissão insuficiente',
        code: 'INSUFFICIENT_ROLE'
        // Removed: required and current fields for security
      });
      return;
    }

    next();
  };
};

/**
 * Clinic access middleware: ensures user has access to requested clinic resources
 * IMPROVED with better validation
 */
export const ensureClinicAccess = (
  field: 'params' | 'body' | 'query' = 'params', 
  key: string = 'clinicId'
) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'Autenticação obrigatória',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const userClinic = req.user.clinicId;
    if (!userClinic) {
      res.status(403).json({ 
        success: false, 
        message: 'Usuário não está associado a uma clínica',
        code: 'NO_CLINIC_ASSOCIATION'
      });
      return;
    }

    // Super admin can access any clinic
    if (req.user.role === 'super_admin') {
      next();
      return;
    }

    // Get the requested clinic ID from the specified field
    const requestData = (req as any)[field];
    const requestedClinic = requestData?.[key];
    
    // IMPROVED: Handle both string and ObjectId comparisons
    if (requestedClinic && String(requestedClinic) !== String(userClinic)) {
      res.status(403).json({ 
        success: false, 
        message: 'Acesso negado: clínica não autorizada',
        code: 'CLINIC_ACCESS_DENIED'
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication middleware: adds user info if token is present but doesn't require it
 */
export const optionalAuth = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const payload = await authService.verifyAccessToken(token);
      
      if (payload && typeof payload === 'object' && 'userId' in payload) {
        const typedPayload = payload as any;
        const userId = typedPayload.userId || typedPayload.id;
        
        if (userId) {
          req.user = {
            id: String(userId),
            email: typedPayload.email,
            role: typedPayload.role,
            clinicId: typedPayload.clinicId,
          };
        }
      }
    }
    
    next();
  } catch (error) {
    // Don't fail on optional auth - just continue without user info
    console.warn('Optional auth failed:', error instanceof Error ? error.message : 'Unknown error');
    next();
  }
};

/**
 * Middleware to check if user owns a resource
 * IMPROVED with better type safety
 */
export const ensureOwnership = (
  field: 'params' | 'body' | 'query' = 'params',
  key: string = 'userId'
) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'Autenticação obrigatória',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    // Super admin can access any resource
    if (req.user.role === 'super_admin') {
      next();
      return;
    }

    const requestData = (req as any)[field];
    const resourceUserId = requestData?.[key];
    
    if (resourceUserId && String(resourceUserId) !== String(req.user.id)) {
      res.status(403).json({ 
        success: false, 
        message: 'Acesso negado: você só pode acessar seus próprios recursos',
        code: 'OWNERSHIP_REQUIRED'
      });
      return;
    }

    next();
  };
};

/**
 * Rate limiting aware middleware - for sensitive operations
 */
export const sensitiveOperation = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ 
      success: false, 
      message: 'Autenticação obrigatória',
      code: 'NOT_AUTHENTICATED'
    });
    return;
  }

  // Add request metadata for audit logging
  (req as any).auditContext = {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    clinicId: req.user.clinicId,
    timestamp: new Date(),
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  };

  next();
};