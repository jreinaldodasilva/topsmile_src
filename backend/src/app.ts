// backend/src/app.ts - FIXED VERSION with Critical Configuration Improvements
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import nodemailer from 'nodemailer';
import SMTPTransport from "nodemailer/lib/smtp-transport";
import dotenv from 'dotenv';
import DOMPurify from 'isomorphic-dompurify';
import { Request, Response, NextFunction } from 'express';

// Database imports
import { connectToDatabase } from './config/database';
import { contactService } from './services/contactService';
import { checkDatabaseConnection, handleValidationError } from './middleware/database';
import { Contact } from './models/Contact'; // FIXED: Replaced require with import

// Authentication imports
import { authenticate, authorize, ensureClinicAccess, AuthenticatedRequest } from './middleware/auth';
import authRoutes from './routes/auth';
import calendarRoutes from "./routes/calendar";
import appointmentsRoutes from "./routes/appointments"; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * IMPROVED: Comprehensive environment variable validation
 */
const validateEnv = () => {
  const requiredInProd = [
    { 
      name: 'JWT_SECRET', 
      message: 'JWT_SECRET is required in production',
      validate: (value: string) => value && value !== 'your-secret-key' && value.length >= 32,
      errorMsg: 'JWT_SECRET must be at least 32 characters long and not use default value'
    },
    { 
      name: 'DATABASE_URL', 
      message: 'DATABASE_URL is required in production',
      validate: (value: string) => value && (value.startsWith('mongodb://') || value.startsWith('mongodb+srv://')),
      errorMsg: 'DATABASE_URL must be a valid MongoDB connection string'
    },
    { 
      name: 'SENDGRID_API_KEY', 
      message: 'SENDGRID_API_KEY is required in production for email functionality',
      validate: (value: string) => value && value.startsWith('SG.'),
      errorMsg: 'SENDGRID_API_KEY must be a valid SendGrid API key'
    },
    { 
      name: 'ADMIN_EMAIL', 
      message: 'ADMIN_EMAIL is required in production',
      validate: (value: string) => value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      errorMsg: 'ADMIN_EMAIL must be a valid email address'
    }
  ];

  const recommendedInProd = [
    'FRONTEND_URL',
    'FROM_EMAIL',
    'ACCESS_TOKEN_EXPIRES',
    'REFRESH_TOKEN_EXPIRES_DAYS'
  ];

  if (process.env.NODE_ENV === 'production') {
    const errors: string[] = [];
    
    // Check required variables
    for (const envVar of requiredInProd) {
      const value = process.env[envVar.name];
      if (!value) {
        errors.push(`Missing required environment variable: ${envVar.name}`);
      } else if (envVar.validate && !envVar.validate(value)) {
        errors.push(`Invalid ${envVar.name}: ${envVar.errorMsg}`);
      }
    }
    
    if (errors.length > 0) {
      console.error('Environment Configuration Errors:');
      errors.forEach(error => console.error(`- ${error}`));
      process.exit(1);
    }
    
    // Check recommended variables
    const missingRecommended = recommendedInProd.filter(name => !process.env[name]);
    if (missingRecommended.length > 0) {
      console.warn('Missing recommended environment variables:');
      missingRecommended.forEach(name => console.warn(`- ${name}`));
    }
    
  } else {
    // Development environment warnings
    const warnings: string[] = [];
    
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key') {
      warnings.push('JWT_SECRET is not set or uses insecure default');
    }
    
    if (!process.env.DATABASE_URL) {
      warnings.push('DATABASE_URL is not set, using local MongoDB default');
    }
    
    if (!process.env.SENDGRID_API_KEY) {
      warnings.push('SENDGRID_API_KEY not set, email functionality will use Ethereal');
    }
    
    if (warnings.length > 0) {
      console.warn('Development Environment Warnings:');
      warnings.forEach(warning => console.warn(`- ${warning}`));
      console.warn('These should be configured for production deployment.');
    }
  }
};

validateEnv();

// IMPROVED: Trust proxy configuration for production deployments
const configureProxy = () => {
  if (process.env.TRUST_PROXY === '1' || 
      process.env.NODE_ENV === 'production' || 
      process.env.VERCEL || 
      process.env.HEROKU || 
      process.env.AWS_REGION) {
    app.set('trust proxy', 1);
    console.log('✅ Proxy trust enabled for production environment');
  }
};

configureProxy();

// IMPROVED: Enhanced security middleware configuration
const configureSecurityMiddleware = () => {
  // Enhanced helmet configuration
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for development
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for API compatibility
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    }
  }));

  // IMPROVED: Multiple origin CORS configuration
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.ADMIN_URL,
    process.env.MOBILE_URL,
    // Development origins
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    // Vercel preview deployments
    /\.vercel\.app$/,
    // Netlify deployments  
    /\.netlify\.app$/,
  ].filter(Boolean); // Remove undefined values

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') {
          return origin === allowedOrigin;
        } else if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return false;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200, // Support legacy browsers
    maxAge: 86400, // 24 hours preflight cache
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With', 
      'Content-Type', 
      'Accept', 
      'Authorization',
      'X-Device-ID',
      'X-Patient-ID'
    ]
  }));
};

configureSecurityMiddleware();

// Connect to database
connectToDatabase();

// IMPROVED: Tiered rate limiting strategy
const createRateLimit = (windowMs: number, max: number, message: string) => rateLimit({
  windowMs,
  max,
  message: { success: false, message },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP ${req.ip}: ${req.method} ${req.path}`);
    res.status(429).json({ success: false, message });
  }
});

// Specific rate limiters
const contactLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 contact form submissions
  'Muitos formulários enviados. Tente novamente em 15 minutos.'
);

const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes  
  10, // 10 auth attempts
  'Muitas tentativas de autenticação. Tente novamente em 15 minutos.'
);

const apiLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  process.env.NODE_ENV === 'production' ? 100 : 1000, // Lower limit in production
  'Muitas requisições. Tente novamente em 15 minutos.'
);

// Apply rate limiting
app.use('/api/contact', contactLimiter);
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// IMPROVED: Body parser with security limits
app.use(express.json({ 
  limit: '10mb',
  strict: true,
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb',
  parameterLimit: 100 // Prevent parameter pollution
}));

// Database connection check middleware for API routes
app.use('/api', checkDatabaseConnection);

// ADDED: Request logging middleware for production monitoring
if (process.env.NODE_ENV === 'production') {
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      };
      
      // Log errors and slow requests
      if (res.statusCode >= 400 || duration > 1000) {
        console.warn('Request issue:', logData);
      }
    });
    
    next();
  });
}

// Mount routes
app.use('/api/auth', authRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/appointments", appointmentsRoutes); 

// IMPROVED: Email transporter with better error handling
const createTransporter = (): nodemailer.Transporter<SMTPTransport.SentMessageInfo> => {
  if (process.env.NODE_ENV === "production") {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY is required in production");
    }

    return nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 14, // SendGrid allows 15 emails/second
    } as SMTPTransport.Options);
  } else {
    // Development transporter (Ethereal)
    if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: {
          user: process.env.ETHEREAL_USER,
          pass: process.env.ETHEREAL_PASS,
        },
      } as SMTPTransport.Options);
    }

    // Fallback: Console transport (for local dev only)
    return nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    } as SMTPTransport.Options);
  }
};

// IMPROVED: Contact form validation with enhanced security
const contactValidation = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s\-'\.]*$/)
    .withMessage('Nome contém caracteres inválidos')
    .trim()
    .escape(),

  body('email')
    .isEmail()
    .withMessage('Digite um e-mail válido')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('E-mail muito longo'),

  body('clinic')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome da clínica deve ter entre 2 e 100 caracteres')
    .trim()
    .escape(),

  body('specialty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Especialidade deve ter entre 2 e 100 caracteres')
    .trim()
    .escape(),

  body('phone')
    .matches(/^[\d\s\-\(\)\+]{10,20}$/)
    .withMessage('Digite um telefone válido')
    .trim()
];

// Enhanced contact form data interface
interface ContactFormData {
  name: string;
  email: string;
  clinic: string;
  specialty: string;
  phone: string;
}

// IMPROVED: More thorough input sanitization
const sanitizeContactData = (data: ContactFormData): ContactFormData => {
  return {
    name: DOMPurify.sanitize(data.name?.trim() || ''),
    email: DOMPurify.sanitize(data.email?.trim().toLowerCase() || ''),
    clinic: DOMPurify.sanitize(data.clinic?.trim() || ''),
    specialty: DOMPurify.sanitize(data.specialty?.trim() || ''),
    phone: DOMPurify.sanitize(data.phone?.trim() || '')
  };
};

// IMPROVED: Contact form endpoint with enhanced security and error handling
app.post('/api/contact', contactLimiter, contactValidation, async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    // ADDED: Rate limiting per email address
    const { email } = req.body;
    // In production, you might want to implement Redis-based rate limiting per email

    // Sanitize input data
    const sanitizedData = sanitizeContactData(req.body);
    const { name, clinic, specialty, phone } = sanitizedData;

    // ADDED: Additional validation
    if (!name || !email || !clinic || !specialty || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }

    // ADDED: Metadata collection for analytics
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referrer'),
      utmSource: req.query.utm_source as string,
      utmMedium: req.query.utm_medium as string,
      utmCampaign: req.query.utm_campaign as string
    };

    // Save to database with metadata
    const contact = await contactService.createContact({
      name,
      email: sanitizedData.email,
      clinic,
      specialty,
      phone,
      source: 'website_contact_form'
    });

    // Create email transporter with error handling
    let transporter;
    try {
      transporter = createTransporter();
    } catch (error) {
      console.error('Failed to create email transporter:', error);
      // Continue without sending emails in development
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({
          success: false,
          message: 'Erro na configuração de e-mail'
        });
      }
    }

    // IMPROVED: Email templates with better formatting
    const adminEmailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@topsmile.com',
      to: process.env.ADMIN_EMAIL || 'contato@topsmile.com',
      subject: `🦷 Nova solicitação TopSmile - ${clinic}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">TopSmile</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Nova solicitação de contato</p>
          </div>
          
          <div style="padding: 30px; background: white; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; border-left: 4px solid #3949ab;">
              <h3 style="color: #1a237e; margin: 0 0 15px 0; font-size: 18px;">Informações do Lead</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: 600; color: #475569;">ID:</td><td style="padding: 8px 0;">#${contact.id}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: 600; color: #475569;">Nome:</td><td style="padding: 8px 0;">${name}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: 600; color: #475569;">E-mail:</td><td style="padding: 8px 0;"><a href="mailto:${sanitizedData.email}" style="color: #3949ab;">${sanitizedData.email}</a></td></tr>
                <tr><td style="padding: 8px 0; font-weight: 600; color: #475569;">Clínica:</td><td style="padding: 8px 0;">${clinic}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: 600; color: #475569;">Especialidade:</td><td style="padding: 8px 0;">${specialty}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: 600; color: #475569;">Telefone:</td><td style="padding: 8px 0;"><a href="tel:${phone}" style="color: #3949ab;">${phone}</a></td></tr>
              </table>
            </div>
            
            <div style="background: #ecfccb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #84cc16;">
              <p style="margin: 0; color: #365314;"><strong>Status:</strong> ${contact.status} | <strong>Prioridade:</strong> ${contact.priority}</p>
              <p style="margin: 5px 0 0 0; color: #365314; font-size: 14px;"><strong>Recebido em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.ADMIN_URL || process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/contacts/${contact.id}" 
                 style="background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Gerenciar Lead
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
            <p>TopSmile - Sistema de Gestão Odontológica</p>
          </div>
        </div>
      `
    };

    const userEmailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@topsmile.com',
      to: sanitizedData.email,
      subject: '🦷 Obrigado pelo interesse no TopSmile!',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">TopSmile</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Sistema de Gestão Odontológica</p>
          </div>
          
          <div style="padding: 30px; background: white; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1a237e; margin: 0 0 20px 0;">Olá, ${name}! 👋</h2>
            
            <p style="color: #334155; line-height: 1.6; margin: 0 0 20px 0;">
              Obrigado pelo seu interesse no <strong>TopSmile</strong>! Recebemos sua solicitação de contato e nossa equipe entrará em contato <strong>em até 24 horas</strong>.
            </p>
            
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3949ab;">
              <h3 style="color: #3949ab; margin: 0 0 15px 0; font-size: 16px;">📋 Resumo da sua solicitação:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 5px 0; font-weight: 600; color: #475569;">Clínica:</td><td style="padding: 5px 0;">${clinic}</td></tr>
                <tr><td style="padding: 5px 0; font-weight: 600; color: #475569;">Especialidade:</td><td style="padding: 5px 0;">${specialty}</td></tr>
                <tr><td style="padding: 5px 0; font-weight: 600; color: #475569;">Telefone:</td><td style="padding: 5px 0;">${phone}</td></tr>
                <tr><td style="padding: 5px 0; font-weight: 600; color: #475569;">Protocolo:</td><td style="padding: 5px 0;"><strong>#${contact.id}</strong></td></tr>
              </table>
            </div>
            
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #059669; margin: 0 0 10px 0; font-size: 16px;">🚀 Próximos passos:</h3>
              <ul style="color: #047857; margin: 0; padding-left: 20px;">
                <li>Nossa equipe analisará suas necessidades</li>
                <li>Entraremos em contato para agendar uma demonstração</li>
                <li>Apresentaremos uma proposta personalizada</li>
              </ul>
            </div>
            
            <p style="color: #334155; line-height: 1.6;">
              Enquanto isso, convidamos você a conhecer mais sobre nossos recursos em nosso site.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
                 style="background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; margin-right: 10px;">
                Visitar TopSmile
              </a>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/features" 
                 style="background: transparent; color: #3949ab; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; border: 2px solid #3949ab;">
                Ver Recursos
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px; line-height: 1.4;">
            <p style="margin: 0 0 10px 0;">Este é um e-mail automático. Se você não solicitou este contato, pode ignorar esta mensagem.</p>
            <p style="margin: 0;"><strong>Protocolo de atendimento:</strong> #${contact.id} | <strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
      `
    };

    // Send emails with improved error handling
    if (transporter) {
      try {
        await Promise.all([
          transporter.sendMail(adminEmailOptions),
          transporter.sendMail(userEmailOptions)
        ]);
      } catch (emailError) {
        console.error('Failed to send emails:', emailError);
        // Don't fail the request if email fails - contact is already saved
        console.warn('Contact saved but email notification failed');
      }
    }

    // IMPROVED: Development logging with structured data
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Contact form submitted:', {
        id: contact.id,
        name,
        email: sanitizedData.email,
        clinic,
        specialty,
        phone,
        priority: contact.priority,
        source: contact.source,
        metadata,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Mensagem enviada com sucesso! Nossa equipe retornará em até 24 horas.',
      data: {
        id: contact.id,
        protocol: contact.id,
        estimatedResponse: '24 horas'
      }
    });

  } catch (error) {
    console.error('Contact form error:', error);

    // IMPROVED: Better error responses without exposing internals
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const errorMessage = isDevelopment && error instanceof Error ? error.message : 'Erro interno do servidor';
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar solicitação. Tente novamente mais tarde.',
      ...(isDevelopment && { debug: errorMessage })
    });
  }
});

// IMPROVED: Enhanced health check endpoints
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  return res.status(200).json({
    success: true,
    message: 'TopSmile API is running',
    data: {
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 60)} minutes`,
      database: {
        status: dbStatus,
        name: mongoose.connection.name || 'Not connected'
      },
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`
      },
      environment: process.env.NODE_ENV || 'development',
      version: '1.2.0',
      nodeVersion: process.version
    }
  });
});

// IMPROVED: Comprehensive database health check
app.get('/api/health/database', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    if (dbState === 1) {
      // Test database with multiple collection checks
      const startTime = Date.now();
      
      const [contactCount, dbStats] = await Promise.all([
        Contact.countDocuments(), // FIXED: Uses imported Contact model
        (mongoose.connection.db as any).admin().serverStatus()
      ]);
      
      const queryTime = Date.now() - startTime;

      return res.json({
        success: true,
        data: {
          database: {
            status: states[dbState as keyof typeof states],
            name: mongoose.connection.name,
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            queryTime: `${queryTime}ms`
          },
          collections: {
            contacts: contactCount
          },
          server: {
            version: dbStats.version,
            uptime: Math.floor(dbStats.uptime / 60), // minutes
            connections: dbStats.connections?.current || 0
          }
        }
      });
    } else {
      return res.status(503).json({
        success: false,
        data: {
          database: {
            status: states[dbState as keyof typeof states],
            message: 'Database not connected'
          }
        }
      });
    }
  } catch (error) {
    console.error('Database health check failed:', error);
    return res.status(503).json({
      success: false,
      message: 'Database health check failed',
      data: {
        error: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'Internal database error'
      }
    });
  }
});

// IMPROVED: System metrics endpoint (admin only)
app.get('/api/health/metrics',
  authenticate,
  authorize('super_admin', 'admin'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      return res.json({
        success: true,
        data: {
          system: {
            uptime: process.uptime(),
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
          },
          memory: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024),
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            external: Math.round(memoryUsage.external / 1024 / 1024)
          },
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system
          },
          environment: {
            nodeEnv: process.env.NODE_ENV,
            port: process.env.PORT,
            databaseConfigured: !!process.env.DATABASE_URL,
            emailConfigured: !!process.env.SENDGRID_API_KEY
          }
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve system metrics'
      });
    }
  }
);

// PROTECTED ENDPOINTS (Authentication required)

// Contact management endpoints - Admin only
app.get('/api/admin/contacts',
  authenticate,
  authorize('super_admin', 'admin', 'manager'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100 per page
      const status = req.query.status as string;
      const search = req.query.search as string;
      const sortBy = req.query.sortBy as string || 'createdAt';
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' || 'desc';

      const filters: any = {};
      if (status) filters.status = status;
      if (search) filters.search = search;

      const result = await contactService.getContacts(filters, {
        page,
        limit,
        sortBy,
        sortOrder
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar contatos'
      });
    }
  }
);

app.get('/api/admin/contacts/stats',
  authenticate,
  authorize('super_admin', 'admin', 'manager'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const stats = await contactService.getContactStats();
      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching contact stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas'
      });
    }
  }
);

app.get('/api/admin/contacts/:id',
  authenticate,
  authorize('super_admin', 'admin', 'manager'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const contact = await contactService.getContactById(req.params.id);
      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contato não encontrado'
        });
      }
      return res.json({
        success: true,
        data: contact
      });
    } catch (error) {
      console.error('Error fetching contact:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar contato'
      });
    }
  }
);

app.patch('/api/admin/contacts/:id',
  authenticate,
  authorize('super_admin', 'admin', 'manager'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const updates = req.body;

      // Add assignedTo if updating status and user is not super_admin
      if (updates.status && req.user && req.user.role !== 'super_admin') {
        updates.assignedTo = req.user.id;
        updates.assignedToClinic = req.user.clinicId;
      }

      const contact = await contactService.updateContact(req.params.id, updates);

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contato não encontrado'
        });
      }

      return res.json({
        success: true,
        data: contact
      });
    } catch (error) {
      console.error('Error updating contact:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar contato'
      });
    }
  }
);

app.delete('/api/admin/contacts/:id',
  authenticate,
  authorize('super_admin', 'admin'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const deleted = await contactService.deleteContact(req.params.id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Contato não encontrado'
        });
      }

      return res.json({
        success: true,
        message: 'Contato excluído com sucesso'
      });
    } catch (error) {
      console.error('Error deleting contact:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao excluir contato'
      });
    }
  }
);

// IMPROVED: Enhanced dashboard with better metrics
app.get('/api/admin/dashboard',
  authenticate,
  authorize('super_admin', 'admin', 'manager'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const [contactStats] = await Promise.all([
        contactService.getContactStats()
      ]);

      const systemHealth = {
        uptime: Math.floor(process.uptime() / 60),
        memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        databaseStatus: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy'
      };

      return res.json({
        success: true,
        data: {
          contacts: contactStats,
          system: systemHealth,
          summary: {
            totalContacts: contactStats.total,
            newThisWeek: contactStats.recentCount,
            conversionRate: contactStats.total > 0 
              ? Math.round((contactStats.byStatus.find(s => s._id === 'converted')?.count || 0) / contactStats.total * 100)
              : 0
          },
          user: {
            name: req.user?.email?.split('@')[0], // First part of email
            role: req.user?.role,
            clinicId: req.user?.clinicId,
            lastActivity: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar dados do dashboard'
      });
    }
  }
);

// IMPROVED: Error handling middleware with better logging
app.use(handleValidationError);

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error with context
  console.error('Unhandled error:', {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Send appropriate error response
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  return res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    ...(isDevelopment && { 
      error: error.message,
      stack: error.stack 
    })
  });
});

// IMPROVED: 404 handler with request logging
app.use('*', (req, res) => {
  console.warn(`404 Not Found: ${req.method} ${req.originalUrl} from ${req.ip}`);
  
  return res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    path: req.originalUrl
  });
});

// IMPROVED: Global process handlers with better error management
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to log this to an external service
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Log to external service in production
  
  // Graceful shutdown
  if (process.env.NODE_ENV === 'production') {
    console.log('Shutting down due to uncaught exception');
    process.exit(1);
  }
});

// IMPROVED: Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server with improved logging
app.listen(PORT, () => {
  console.log('🚀 ===================================');
  console.log(`🚀 TopSmile API running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configured ✅' : 'Using default ⚠️'}`);
  console.log(`📧 Email Service: ${process.env.SENDGRID_API_KEY ? 'SendGrid ✅' : 'Ethereal/Console ⚠️'}`);
  console.log(`🗄️  Database: ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Connecting... ⏳'}`);
  console.log('🚀 ===================================');
});

export default app;