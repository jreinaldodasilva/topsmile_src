# TopSmile Backend Code Review - Part 4: Performance & Best Practices

## 🚀 Performance Issues

### 1. **N+1 Query Problems**

**In `schedulingService.ts`:**
```typescript
// Line 314-320 - Potential N+1 queries
async getAppointments(clinicId: string, startDate: Date, endDate: Date, providerId?: string, status?: string) {
  return await Appointment.find(query)
    .populate('patient', 'name phone email')        // 1 query per appointment
    .populate('provider', 'name specialties')       // 1 query per appointment  
    .populate('appointmentType', 'name duration color category') // 1 query per appointment
    .sort({ scheduledStart: 1 });
}
```

**Use aggregation for better performance:**
```typescript
async getAppointments(clinicId: string, startDate: Date, endDate: Date, providerId?: string, status?: string) {
  const pipeline: any[] = [
    { $match: query },
    {
      $lookup: {
        from: 'patients',
        localField: 'patient',
        foreignField: '_id',
        as: 'patientInfo',
        pipeline: [{ $project: { name: 1, phone: 1, email: 1 } }]
      }
    },
    {
      $lookup: {
        from: 'providers',
        localField: 'provider', 
        foreignField: '_id',
        as: 'providerInfo',
        pipeline: [{ $project: { name: 1, specialties: 1 } }]
      }
    },
    {
      $lookup: {
        from: 'appointmenttypes',
        localField: 'appointmentType',
        foreignField: '_id', 
        as: 'typeInfo',
        pipeline: [{ $project: { name: 1, duration: 1, color: 1, category: 1 } }]
      }
    },
    { $sort: { scheduledStart: 1 } }
  ];

  return await Appointment.aggregate(pipeline);
}
```

### 2. **Missing Database Indexes**

**Several models are missing critical indexes:**

```typescript
// Patient.ts - Add compound indexes
PatientSchema.index({ clinic: 1, status: 1 });
PatientSchema.index({ clinic: 1, name: 1 }); // For name searches
PatientSchema.index({ clinic: 1, phone: 1 }); // For phone lookups

// Provider.ts - Add more specific indexes  
ProviderSchema.index({ clinic: 1, specialties: 1 }); // For specialty filtering
ProviderSchema.index({ clinic: 1, appointmentTypes: 1 }); // For service filtering

// AppointmentType.ts - Add search index
AppointmentTypeSchema.index({ clinic: 1, name: 1 }); // For name searches
AppointmentTypeSchema.index({ clinic: 1, category: 1, isActive: 1 }); // For filtering
```

### 3. **Inefficient Availability Checking**

**In `availabilityService.ts`:**
```typescript
// Lines 185-194 - Gets all appointments for entire day
const existingAppointments = await Appointment.find({
  provider: providerId,
  scheduledStart: {
    $gte: startOfDay(date),
    $lt: endOfDay(date) // ❌ Too broad, gets unnecessary data
  },
  status: { $nin: ['cancelled', 'no_show'] }
}).sort({ scheduledStart: 1 });
```

**Optimize with time range:**
```typescript
// Only get appointments that could conflict with working hours
const workStart = this.parseTimeToDate(date, workingHours.start, provider.timeZone);
const workEnd = this.parseTimeToDate(date, workingHours.end, provider.timeZone);

const existingAppointments = await Appointment.find({
  provider: providerId,
  $or: [
    // Appointments that start during work hours
    {
      scheduledStart: { $gte: workStart, $lt: workEnd }
    },
    // Appointments that end during work hours  
    {
      scheduledEnd: { $gt: workStart, $lte: workEnd }
    },
    // Appointments that span the entire work day
    {
      scheduledStart: { $lte: workStart },
      scheduledEnd: { $gte: workEnd }
    }
  ],
  status: { $nin: ['cancelled', 'no_show'] }
}, {
  scheduledStart: 1,
  scheduledEnd: 1
}).sort({ scheduledStart: 1 }).lean(); // Use lean() for better performance
```

### 4. **Memory-Intensive Date Operations**

**In `schedulingService.ts`:**
```typescript
// Line 131-148 - Creates too many date objects in loop
let currentTime = startTime;
while (currentTime < endTime) {
  const slotEnd = addMinutes(currentTime, treatmentDuration); // ❌ New Date object each iteration
  // ...
  currentTime = addMinutes(currentTime, slotInterval); // ❌ New Date object each iteration
}
```

**Optimize with timestamps:**
```typescript
let currentTimeMs = startTime.getTime();
const endTimeMs = endTime.getTime();
const treatmentDurationMs = treatmentDuration * 60 * 1000;
const slotIntervalMs = slotInterval * 60 * 1000;

while (currentTimeMs < endTimeMs) {
  const slotEndMs = currentTimeMs + treatmentDurationMs;
  
  if (slotEndMs > endTimeMs) break;
  
  const currentTime = new Date(currentTimeMs);
  const slotEnd = new Date(slotEndMs);
  
  // ... conflict checking logic
  
  currentTimeMs += slotIntervalMs;
}
```

## 🏗️ Architecture Issues

### 1. **Missing Service Layer Abstraction**

**Direct model access in routes:**
```typescript
// In appointments.ts
const appointment = await Appointment.findById(req.params.id)
  .populate('patient', 'name phone email')
  .populate('provider', 'name specialties');
// ❌ Business logic in route handler
```

**Create service layer:**
```typescript
// appointmentService.ts
export class AppointmentService {
  async getAppointmentById(id: string, clinicId: string): Promise<IAppointment | null> {
    const appointment = await Appointment.findOne({ 
      _id: id, 
      clinic: clinicId 
    })
      .populate('patient', 'name phone email')
      .populate('provider', 'name specialties')
      .populate('appointmentType', 'name duration color category')
      .lean();
    
    return appointment;
  }
}

// In route:
const appointment = await appointmentService.getAppointmentById(req.params.id, req.user!.clinicId!);
```

### 2. **Missing Data Validation Layer**

**Create centralized validation:**
```typescript
// validators/appointmentValidators.ts
export const createAppointmentValidator = [
  body('patientId')
    .isMongoId()
    .withMessage('ID do paciente inválido')
    .custom(async (value, { req }) => {
      const patient = await Patient.findOne({ 
        _id: value, 
        clinic: req.user.clinicId 
      });
      if (!patient) {
        throw new Error('Paciente não encontrado');
      }
    }),
  
  body('providerId')
    .isMongoId()
    .withMessage('ID do profissional inválido')
    .custom(async (value, { req }) => {
      const provider = await Provider.findOne({ 
        _id: value, 
        clinic: req.user.clinicId,
        isActive: true
      });
      if (!provider) {
        throw new Error('Profissional não encontrado ou inativo');
      }
    }),
  
  // ... more validators
];
```

### 3. **Missing Event System**

**No event handling for important actions:**
```typescript
// events/appointmentEvents.ts
import { EventEmitter } from 'events';

export class AppointmentEventEmitter extends EventEmitter {}
export const appointmentEvents = new AppointmentEventEmitter();

// In schedulingService.ts
async createAppointment(data: CreateAppointmentData): Promise<IAppointment> {
  const appointment = new Appointment({...});
  const savedAppointment = await appointment.save();
  
  // Emit event for notifications, logging, etc.
  appointmentEvents.emit('appointment.created', {
    appointment: savedAppointment,
    user: data.createdBy
  });
  
  return savedAppointment;
}

// Event listeners
appointmentEvents.on('appointment.created', async (data) => {
  // Send confirmation email
  // Update calendar systems
  // Log activity
});

appointmentEvents.on('appointment.cancelled', async (data) => {
  // Send cancellation email
  // Free up resources
  // Update metrics
});
```

## 📝 Code Quality Issues

### 1. **Inconsistent Error Handling Patterns**

**Mixed error handling approaches:**
```typescript
// Some services throw errors:
throw new Error('Tipo de agendamento não encontrado');

// Others return null:
return await Contact.findById(id).populate('assignedTo', 'name email');

// Routes handle differently:
if (!appointment) {
  return res.status(404).json({
    success: false,
    message: 'Agendamento não encontrado'
  });
}
```

**Standardize with custom errors:**
```typescript
// errors/AppError.ts
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} não encontrado`, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

// Usage:
if (!appointment) {
  throw new NotFoundError('Agendamento');
}
```

### 2. **Missing Type Definitions**

**Many interfaces are incomplete:**
```typescript
// In authService.ts
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  clinicId?: string;
  // ❌ Missing iat, exp, iss, aud from JWT
}
```

**Complete type definitions:**
```typescript
export interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
  clinicId?: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

// Create strict request types
export interface CreateAppointmentRequest extends AuthenticatedRequest {
  body: {
    patientId: string;
    providerId: string;
    appointmentTypeId: string;
    scheduledStart: string; // ISO string
    notes?: string;
    priority?: 'routine' | 'urgent' | 'emergency';
  };
}
```

### 3. **Missing Documentation**

**Functions lack proper JSDoc:**
```typescript
/**
 * Creates a new appointment with availability checking
 * @param data - Appointment creation data
 * @returns Promise resolving to created appointment
 * @throws {ValidationError} When appointment data is invalid
 * @throws {NotFoundError} When provider or patient not found
 * @throws {ConflictError} When time slot is not available
 * @example
 * ```typescript
 * const appointment = await schedulingService.createAppointment({
 *   clinicId: 'clinic123',
 *   patientId: 'patient123',
 *   providerId: 'provider123',
 *   appointmentTypeId: 'type123',
 *   scheduledStart: new Date('2024-01-15T10:00:00Z'),
 *   createdBy: 'user123'
 * });
 * ```
 */
async createAppointment(data: CreateAppointmentData): Promise<IAppointment> {
  // Implementation...
}
```

## 🧪 Testing Issues

### 1. **Missing Test Structure**

**No test files found. Need comprehensive test suite:**

```typescript
// tests/services/schedulingService.test.ts
describe('SchedulingService', () => {
  describe('createAppointment', () => {
    it('should create appointment when slot is available', async () => {
      // Test implementation
    });

    it('should throw ConflictError when slot is occupied', async () => {
      // Test implementation
    });

    it('should validate provider belongs to clinic', async () => {
      // Test implementation
    });
  });

  describe('getAvailableSlots', () => {
    it('should return available slots within working hours', async () => {
      // Test implementation
    });

    it('should exclude conflicting appointments', async () => {
      // Test implementation
    });

    it('should handle timezone conversions correctly', async () => {
      // Test implementation
    });
  });
});
```

### 2. **Missing Integration Tests**

```typescript
// tests/integration/appointments.test.ts
describe('Appointments API', () => {
  beforeEach(async () => {
    await setupTestDatabase();
    await createTestUser();
    await createTestClinic();
  });

  describe('POST /api/appointments/book', () => {
    it('should book appointment successfully', async () => {
      const response = await request(app)
        .post('/api/appointments/book')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          patientId: testPatient.id,
          providerId: testProvider.id,
          appointmentTypeId: testType.id,
          scheduledStart: '2024-01-15T10:00:00Z'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });
});
```

## 🔧 Configuration & DevOps Issues

### 1. **Missing Health Checks**

**Basic health check exists but incomplete:**
```typescript
// Add comprehensive health checks
app.get('/api/health/detailed', async (req, res) => {
  const checks = {
    database: await checkDatabaseHealth(),
    memory: checkMemoryUsage(),
    redis: await checkRedisHealth(), // If using Redis
    external: await checkExternalServices(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };

  const isHealthy = Object.values(checks).every(check => 
    typeof check === 'object' ? check.status === 'ok' : true
  );

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'error',
    checks
  });
});
```

### 2. **Missing Request Logging**

```typescript
// Add structured logging middleware
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    ...(process.env.NODE_ENV !== 'production' 
      ? [new winston.transports.Console()] 
      : [])
  ]
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });
  });
  
  next();
});
```

### 3. **Missing Environment Validation**

```typescript
// config/envValidation.ts
import Joi from 'joi';

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  ACCESS_TOKEN_EXPIRES: Joi.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_DAYS: Joi.number().default(7),
  FRONTEND_URL: Joi.string().uri().required(),
  SENDGRID_API_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required()
  }),
  ADMIN_EMAIL: Joi.string().email().required(),
  FROM_EMAIL: Joi.string().email().required()
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default envVars;
```

## 📊 Summary of Critical Issues to Fix First

### Priority 1 (Security & Data Integrity):
1. Fix authentication information disclosure
2. Add database transactions for critical operations
3. Implement proper timezone handling
4. Add input sanitization for regex queries
5. Fix refresh token collision handling

### Priority 2 (Performance):
1. Add missing database indexes
2. Fix N+1 query problems
3. Optimize availability checking queries
4. Implement query result caching

### Priority 3 (Code Quality):
1. Standardize error handling
2. Add comprehensive type definitions  
3. Create proper service layer abstraction
4. Add JSDoc documentation
5. Implement comprehensive test suite

### Priority 4 (Monitoring & Ops):
1. Add structured logging
2. Implement detailed health checks
3. Add environment validation
4. Create performance monitoring