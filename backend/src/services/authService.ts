// backend/src/services/authService.ts - FIXED VERSION
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { RefreshToken } from '../models/RefreshToken';
import { SignOptions, JwtPayload } from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { Clinic } from '../models/Clinic';

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    clinic?: {
        name: string;
        phone: string;
        address: {
            street: string;
            number?: string;
            city?: string;
            state?: string;
            zipCode?: string;
        };
    };
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthResponse {
    success: true;
    data: {
        user: IUser;
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    };
}

// FIXED: Proper TypeScript interface for token payload
export interface TokenPayload extends JwtPayload {
    userId: string;
    email: string;
    role: string;
    clinicId?: string;
}

// FIXED: Interface for device information
export interface DeviceInfo {
    userAgent?: string;
    ipAddress?: string;
    deviceId?: string;
}

class AuthService {
    private readonly ACCESS_TOKEN_EXPIRES: string;
    private readonly REFRESH_TOKEN_EXPIRES_DAYS: number;
    private readonly MAX_REFRESH_TOKENS_PER_USER: number;

    constructor() {
        this.ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || '15m';
        this.REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10);
        this.MAX_REFRESH_TOKENS_PER_USER = parseInt(process.env.MAX_REFRESH_TOKENS_PER_USER || '5', 10);
    }

    // Get JWT secret with runtime environment variable reading
    private getJwtSecret(): string {
        const secret = process.env.JWT_SECRET || '';
        if (!secret || secret === 'your-secret-key') {
            if (process.env.NODE_ENV === 'production') {
                console.error('FATAL: JWT_SECRET is not configured. Set JWT_SECRET env var before starting the app.');
                process.exit(1);
            } else {
                // For tests and development, use a consistent fallback
                return process.env.JWT_SECRET || 'test-jwt-secret-key';
            }
        }
        return secret;
    }

    // FIXED: Generate short-lived access token with proper typing
    private generateAccessToken(payload: TokenPayload): string {
        // Ensure payload is clean and properly typed
        const cleanPayload: TokenPayload = {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            ...(payload.clinicId && { clinicId: payload.clinicId })
        };

        const options: SignOptions = {
            expiresIn: this.ACCESS_TOKEN_EXPIRES as any,
            issuer: 'topsmile-api',
            audience: 'topsmile-client',
            algorithm: 'HS256' // Explicit algorithm for security
        };

        return jwt.sign(cleanPayload, this.getJwtSecret(), options);
    }

    // Generate secure random refresh token string
    private generateRefreshTokenString(): string {
        return crypto.randomBytes(48).toString('hex');
    }

    // FIXED: Create refresh token document in DB with proper typing
    private async createRefreshToken(userId: string, deviceInfo?: DeviceInfo) {
        const tokenStr = this.generateRefreshTokenString();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRES_DAYS);

        await this.cleanupOldRefreshTokens(userId);

        const refreshToken = new RefreshToken({
            token: tokenStr,
            userId,
            expiresAt,
            deviceInfo: deviceInfo || {}
        });

        return await refreshToken.save();
    }

    // Keep only most recent MAX_REFRESH_TOKENS_PER_USER refresh tokens; revoke older ones
    private async cleanupOldRefreshTokens(userId: string): Promise<void> {
        try {
            const tokens = await RefreshToken.find({ 
                userId, 
                isRevoked: false 
            }).sort({ createdAt: -1 });
            
            if (tokens.length >= this.MAX_REFRESH_TOKENS_PER_USER) {
                const toRevoke = tokens.slice(this.MAX_REFRESH_TOKENS_PER_USER - 1);
                const ids = toRevoke.map(t => t._id);
                await RefreshToken.updateMany({ 
                    _id: { $in: ids } 
                }, { 
                    isRevoked: true 
                });
            }
        } catch (error) {
            console.error('Error cleaning up old refresh tokens:', error);
            // Don't throw - this is a maintenance operation
        }
    }

    // FIXED: Verify access token with proper error handling and typing
    verifyAccessToken(token: string): TokenPayload {
        try {
            const payload = jwt.verify(token, this.getJwtSecret(), {
                issuer: 'topsmile-api',
                audience: 'topsmile-client',
                algorithms: ['HS256'] // Explicit algorithm verification
            });

            // FIXED: Proper type checking instead of unsafe casting
            if (typeof payload === 'string') {
                throw new Error('Token payload deve ser um objeto');
            }

            const typedPayload = payload as TokenPayload;
            
            // Validate required fields
            if (!typedPayload.userId || !typedPayload.email || !typedPayload.role) {
                throw new Error('Token payload incompleto');
            }

            return typedPayload;
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                throw new Error('Token inválido');
            } else if (error instanceof jwt.TokenExpiredError) {
                throw new Error('Token expirado');
            } else if (error instanceof jwt.NotBeforeError) {
                throw new Error('Token ainda não é válido');
            }
            throw error;
        }
    }

    // FIXED: Rotate and refresh access token with better error handling
    async refreshAccessToken(refreshTokenString: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: string }> {
        if (!refreshTokenString) {
            throw new Error('Token de atualização é obrigatório');
        }

        const stored = await RefreshToken.findOne({
            token: refreshTokenString,
            isRevoked: false,
            expiresAt: { $gt: new Date() }
        }).populate('userId');

        if (!stored) {
            throw new Error('Token de atualização inválido ou expirado');
        }

        const user = stored.userId as any;
        if (!user || !user.isActive) {
            // Revoke the token if user is inactive
            stored.isRevoked = true;
            await stored.save();
            throw new Error('Usuário inválido ou inativo');
        }

        // Revoke used refresh token (rotation for security)
        stored.isRevoked = true;
        await stored.save();

        // FIXED: Proper payload construction with type safety
        const payload: TokenPayload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            ...(user.clinic && { clinicId: user.clinic.toString() })
        };

        const accessToken = this.generateAccessToken(payload);
        const newRefreshDoc = await this.createRefreshToken(
            user._id.toString(), 
            stored.deviceInfo
        );

        return { 
            accessToken, 
            refreshToken: newRefreshDoc.token, 
            expiresIn: this.ACCESS_TOKEN_EXPIRES 
        };
    }

    // Logout (revoke a refresh token)
    async logout(refreshTokenString: string): Promise<void> {
        if (!refreshTokenString) return;
        
        try {
            await RefreshToken.findOneAndUpdate(
                { token: refreshTokenString }, 
                { isRevoked: true }
            );
        } catch (error) {
            console.error('Error during logout:', error);
            // Don't throw - logout should be graceful
        }
    }

    // Logout all devices for a user
    async logoutAllDevices(userId: string): Promise<void> {
        if (!userId) {
            throw new Error('ID do usuário é obrigatório');
        }

        try {
            await RefreshToken.updateMany(
                { userId, isRevoked: false }, 
                { isRevoked: true }
            );
        } catch (error) {
            console.error('Error during logout all devices:', error);
            throw new Error('Erro ao fazer logout de todos os dispositivos');
        }
    }

    // FIXED: Register new user with better error handling and validation
    async register(data: RegisterData): Promise<AuthResponse> {
        try {
            // Validate input data
            if (!data.name || !data.email || !data.password) {
                throw new Error('Dados obrigatórios não fornecidos');
            }

            if (data.password.length < 6) {
                throw new Error('Senha deve ter pelo menos 6 caracteres');
            }

            // Check if user already exists
            const existingUser = await User.findOne({ email: data.email.toLowerCase() });
            if (existingUser) {
                throw new Error('Usuário já existe');
            }

            let clinicId;
            if (data.clinic) {
                const clinic = new Clinic({
                    name: data.clinic.name,
                    email: data.email.toLowerCase(),
                    phone: data.clinic.phone,
                    address: data.clinic.address,
                    subscription: {
                        plan: 'basic',
                        status: 'active',
                        startDate: new Date()
                    },
                    settings: {
                        timezone: 'America/Sao_Paulo',
                        workingHours: {
                            monday: { start: '08:00', end: '18:00', isWorking: true },
                            tuesday: { start: '08:00', end: '18:00', isWorking: true },
                            wednesday: { start: '08:00', end: '18:00', isWorking: true },
                            thursday: { start: '08:00', end: '18:00', isWorking: true },
                            friday: { start: '08:00', end: '18:00', isWorking: true },
                            saturday: { start: '08:00', end: '12:00', isWorking: false },
                            sunday: { start: '08:00', end: '12:00', isWorking: false }
                        },
                        appointmentDuration: 60,
                        allowOnlineBooking: true
                    }
                });

                const savedClinic = await clinic.save();
                clinicId = savedClinic._id;
            }

            const user = new User({
                name: data.name,
                email: data.email.toLowerCase(),
                password: data.password,
                clinic: clinicId
            });

            const savedUser = await user.save();

            // FIXED: Generate tokens with proper typing
            const tokenPayload: TokenPayload = {
                userId: (savedUser._id as any).toString(),
                email: savedUser.email,
                role: savedUser.role,
                ...(savedUser.clinic && { clinicId: savedUser.clinic.toString() })
            };

            const accessToken = this.generateAccessToken(tokenPayload);
            const refreshDoc = await this.createRefreshToken((savedUser._id as any).toString());

            // Update last login
            savedUser.lastLogin = new Date();
            await savedUser.save();

            return {
                success: true,
                data: {
                    user: savedUser,
                    accessToken,
                    refreshToken: refreshDoc.token,
                    expiresIn: this.ACCESS_TOKEN_EXPIRES
                }
            };
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao registrar usuário');
        }
    }

    // FIXED: Login user with better error handling and security
    async login(data: LoginData, deviceInfo?: DeviceInfo): Promise<AuthResponse> {
        try {
            // Validate input
            if (!data.email || !data.password) {
                throw new Error('E-mail e senha são obrigatórios');
            }

            const user = await User.findOne({ email: data.email.toLowerCase() })
                .select('+password')
                .populate('clinic');

            if (!user) {
                // Use same message for both cases to prevent user enumeration
                throw new Error('E-mail ou senha inválidos');
            }

            const isMatch = await user.comparePassword(data.password);
            if (!isMatch) {
                throw new Error('E-mail ou senha inválidos');
            }

            if (!user.isActive) {
                throw new Error('Usuário inativo');
            }

            // FIXED: Proper payload construction
            const tokenPayload: TokenPayload = {
                userId: (user._id as any).toString(),
                email: user.email,
                role: user.role,
                ...(user.clinic && { 
                    clinicId: user.clinic._id?.toString() || user.clinic.toString() 
                })
            };

            const accessToken = this.generateAccessToken(tokenPayload);
            const refreshDoc = await this.createRefreshToken(
                (user._id as any).toString(),
                deviceInfo
            );

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            return {
                success: true,
                data: {
                    user: user,
                    accessToken,
                    refreshToken: refreshDoc.token,
                    expiresIn: this.ACCESS_TOKEN_EXPIRES
                }
            };
        } catch (error) {
            throw error instanceof Error ? error : new Error('Erro ao fazer login');
        }
    }

    // Get user by ID with clinic info
    async getUserById(userId: string): Promise<IUser | null> {
        try {
            if (!userId) {
                throw new Error('ID do usuário é obrigatório');
            }

            return await User.findById(userId).populate('clinic', 'name subscription settings');
        } catch (error) {
            console.error('Error fetching user by ID:', error);
            throw new Error('Erro ao buscar usuário');
        }
    }

    // FIXED: Change password with better security
    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
        try {
            if (!userId || !currentPassword || !newPassword) {
                throw new Error('Todos os campos são obrigatórios');
            }

            if (newPassword.length < 6) {
                throw new Error('Nova senha deve ter pelo menos 6 caracteres');
            }

            if (currentPassword === newPassword) {
                throw new Error('Nova senha deve ser diferente da atual');
            }

            const user = await User.findById(userId).select('+password');
            if (!user) {
                throw new Error('Usuário não encontrado');
            }

            const isCurrentPasswordValid = await user.comparePassword(currentPassword);
            if (!isCurrentPasswordValid) {
                throw new Error('Senha atual incorreta');
            }

            user.password = newPassword;
            await user.save();

            // Revoke all refresh tokens to force re-login
            await this.logoutAllDevices(userId);

            return true;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao alterar senha');
        }
    }

    // Reset password (for forgot password feature) - IMPROVED
    async resetPassword(email: string): Promise<string> {
        try {
            if (!email) {
                throw new Error('E-mail é obrigatório');
            }

            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                throw new Error('E-mail não encontrado');
            }

            // Generate more secure temporary password
            const tempPassword = crypto.randomBytes(12).toString('base64').slice(0, 12);
            user.password = tempPassword;
            await user.save();

            // Revoke all existing tokens
            await this.logoutAllDevices((user._id as any).toString());

            return tempPassword;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro ao resetar senha');
        }
    }

    // DEPRECATED: Legacy method for backward compatibility - will be removed
    async refreshToken(oldToken: string): Promise<string> {
        console.warn('refreshToken method is deprecated. Use refreshAccessToken instead.');
        try {
            const decoded = this.verifyAccessToken(oldToken);
            const user = await this.getUserById(decoded.userId);

            if (!user || !user.isActive) {
                throw new Error('Usuário inválido');
            }

            const payload: TokenPayload = {
                userId: (user._id as any).toString(),
                email: user.email,
                role: user.role,
                ...(user.clinic && { 
                    clinicId: user.clinic._id?.toString() || user.clinic.toString() 
                })
            };

            return this.generateAccessToken(payload);
        } catch (error) {
            throw new Error('Erro ao renovar token');
        }
    }
}

export const authService = new AuthService();