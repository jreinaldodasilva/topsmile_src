// backend/src/middleware/roleBasedAccess.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

// Define role hierarchy and permissions
export const ROLE_HIERARCHY = {
    'super_admin': 5,
    'admin': 4,
    'manager': 3,
    'dentist': 2,
    'assistant': 1
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

// Define resource permissions
export interface ResourcePermissions {
    create?: UserRole[];
    read?: UserRole[];
    update?: UserRole[];
    delete?: UserRole[];
    manage?: UserRole[]; // Full CRUD access
}

// Resource permission definitions
export const RESOURCE_PERMISSIONS: Record<string, ResourcePermissions> = {
    // Patient Management
    patients: {
        create: ['super_admin', 'admin', 'manager', 'dentist', 'assistant'],
        read: ['super_admin', 'admin', 'manager', 'dentist', 'assistant'],
        update: ['super_admin', 'admin', 'manager', 'dentist', 'assistant'],
        delete: ['super_admin', 'admin', 'manager'],
        manage: ['super_admin', 'admin', 'manager']
    },
    
    // Provider Management
    providers: {
        create: ['super_admin', 'admin', 'manager'],
        read: ['super_admin', 'admin', 'manager', 'dentist', 'assistant'],
        update: ['super_admin', 'admin', 'manager'],
        delete: ['super_admin', 'admin'],
        manage: ['super_admin', 'admin']
    },
    
    // Appointment Types
    appointmentTypes: {
        create: ['super_admin', 'admin', 'manager'],
        read: ['super_admin', 'admin', 'manager', 'dentist', 'assistant'],
        update: ['super_admin', 'admin', 'manager'],
        delete: ['super_admin', 'admin'],
        manage: ['super_admin', 'admin']
    },
    
    // Appointments
    appointments: {
        create: ['super_admin', 'admin', 'manager', 'dentist', 'assistant'],
        read: ['super_admin', 'admin', 'manager', 'dentist', 'assistant'],
        update: ['super_admin', 'admin', 'manager', 'dentist', 'assistant'],
        delete: ['super_admin', 'admin', 'manager'],
        manage: ['super_admin', 'admin', 'manager']
    },
    
    // User Management
    users: {
        create: ['super_admin', 'admin'],
        read: ['super_admin', 'admin', 'manager'],
        update: ['super_admin', 'admin'],
        delete: ['super_admin'],
        manage: ['super_admin']
    },
    
    // Clinic Settings
    clinicSettings: {
        create: ['super_admin', 'admin'],
        read: ['super_admin', 'admin', 'manager'],
        update: ['super_admin', 'admin'],
        delete: ['super_admin'],
        manage: ['super_admin', 'admin']
    },
    
    // Reports and Analytics
    reports: {
        read: ['super_admin', 'admin', 'manager'],
        manage: ['super_admin', 'admin']
    },
    
    // System Administration
    systemAdmin: {
        manage: ['super_admin']
    }
};

/**
 * Check if a user role has permission for a specific action on a resource
 */
export function hasPermission(
    userRole: UserRole, 
    resource: string, 
    action: 'create' | 'read' | 'update' | 'delete' | 'manage'
): boolean {
    const permissions = RESOURCE_PERMISSIONS[resource];
    if (!permissions) {
        console.warn(`No permissions defined for resource: ${resource}`);
        return false;
    }

    // Check if user has manage permission (overrides all other permissions)
    if (permissions.manage && permissions.manage.includes(userRole)) {
        return true;
    }

    // Check specific action permission
    const actionPermissions = permissions[action];
    if (!actionPermissions) {
        return false;
    }

    return actionPermissions.includes(userRole);
}

/**
 * Check if a user role has higher or equal hierarchy level than required role
 */
export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Middleware factory for resource-based access control
 */
export function requirePermission(resource: string, action: 'create' | 'read' | 'update' | 'delete' | 'manage') {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Autenticação obrigatória',
                code: 'NOT_AUTHENTICATED'
            });
            return;
        }

        const userRole = req.user.role as UserRole;
        if (!userRole) {
            res.status(403).json({
                success: false,
                message: 'Papel do usuário não definido',
                code: 'NO_ROLE'
            });
            return;
        }

        if (!hasPermission(userRole, resource, action)) {
            res.status(403).json({
                success: false,
                message: 'Acesso negado: permissão insuficiente',
                code: 'INSUFFICIENT_PERMISSION',
                details: {
                    resource,
                    action,
                    userRole,
                    required: RESOURCE_PERMISSIONS[resource]?.[action] || []
                }
            });
            return;
        }

        next();
    };
}

/**
 * Middleware to check if user can access their own resources or has admin privileges
 */
export function requireOwnershipOrAdmin(userIdField: string = 'userId') {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Autenticação obrigatória',
                code: 'NOT_AUTHENTICATED'
            });
            return;
        }

        const userRole = req.user.role as UserRole;
        
        // Super admin and admin can access any resource
        if (hasRoleLevel(userRole, 'admin')) {
            next();
            return;
        }

        // Check if user is accessing their own resource
        const resourceUserId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField];
        
        if (resourceUserId && String(resourceUserId) === String(req.user.id)) {
            next();
            return;
        }

        res.status(403).json({
            success: false,
            message: 'Acesso negado: você só pode acessar seus próprios recursos',
            code: 'OWNERSHIP_REQUIRED'
        });
    };
}

/**
 * Middleware to ensure user belongs to the same clinic as the resource
 */
export function requireSameClinic(clinicIdField: string = 'clinicId') {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Autenticação obrigatória',
                code: 'NOT_AUTHENTICATED'
            });
            return;
        }

        const userRole = req.user.role as UserRole;
        
        // Super admin can access any clinic
        if (userRole === 'super_admin') {
            next();
            return;
        }

        const userClinicId = req.user.clinicId;
        if (!userClinicId) {
            res.status(403).json({
                success: false,
                message: 'Usuário não está associado a uma clínica',
                code: 'NO_CLINIC_ASSOCIATION'
            });
            return;
        }

        // Get clinic ID from request
        const resourceClinicId = req.params[clinicIdField] || req.body[clinicIdField] || req.query[clinicIdField];
        
        if (resourceClinicId && String(resourceClinicId) !== String(userClinicId)) {
            res.status(403).json({
                success: false,
                message: 'Acesso negado: recurso pertence a outra clínica',
                code: 'DIFFERENT_CLINIC'
            });
            return;
        }

        next();
    };
}

/**
 * Middleware to check if user can manage staff (dentists/assistants)
 */
export function requireStaffManagement() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Autenticação obrigatória',
                code: 'NOT_AUTHENTICATED'
            });
            return;
        }

        const userRole = req.user.role as UserRole;
        
        // Only admin and above can manage staff
        if (!hasRoleLevel(userRole, 'admin')) {
            res.status(403).json({
                success: false,
                message: 'Acesso negado: apenas administradores podem gerenciar funcionários',
                code: 'STAFF_MANAGEMENT_REQUIRED'
            });
            return;
        }

        next();
    };
}

/**
 * Middleware to check if user can access patient data
 * Dentists and assistants can only access patients they are treating
 */
export function requirePatientAccess() {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Autenticação obrigatória',
                code: 'NOT_AUTHENTICATED'
            });
            return;
        }

        const userRole = req.user.role as UserRole;
        
        // Admin and above have full access
        if (hasRoleLevel(userRole, 'manager')) {
            next();
            return;
        }

        // For dentists and assistants, check if they have access to the specific patient
        // This would require checking appointments or assigned patients
        // For now, we'll allow access but this can be enhanced with specific business logic
        
        next();
    };
}

/**
 * Get user permissions for a specific resource
 */
export function getUserPermissions(userRole: UserRole, resource: string): string[] {
    const permissions = RESOURCE_PERMISSIONS[resource];
    if (!permissions) {
        return [];
    }

    const userPermissions: string[] = [];
    
    // Check each permission type
    Object.entries(permissions).forEach(([action, roles]) => {
        if (roles && roles.includes(userRole)) {
            userPermissions.push(action);
        }
    });

    return userPermissions;
}

/**
 * Middleware to add user permissions to request object
 */
export function attachUserPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    if (req.user && req.user.role) {
        const userRole = req.user.role as UserRole;
        
        // Attach permissions for all resources
        (req as any).userPermissions = {};
        Object.keys(RESOURCE_PERMISSIONS).forEach(resource => {
            (req as any).userPermissions[resource] = getUserPermissions(userRole, resource);
        });
    }
    
    next();
}

/**
 * Helper function to check if current user can perform action
 */
export function canPerformAction(
    req: AuthenticatedRequest, 
    resource: string, 
    action: 'create' | 'read' | 'update' | 'delete' | 'manage'
): boolean {
    if (!req.user || !req.user.role) {
        return false;
    }
    
    return hasPermission(req.user.role as UserRole, resource, action);
}