# TopSmile Backend Code Review - Part 3: Routes & Error Handling

## 🛣️ Route Handler Issues

### 1. **Appointment Routes Problems**

**In `appointments.ts`:**
```typescript
// Line 14 - Missing clinic access validation
router.get("/providers/:providerId/availability", async (req: AuthenticatedRequest, res) => {
  // ❌ No check if providerId belongs to user's clinic
  const slots = await schedulingService.getAvailableSlots({
    clinicId: req.user!.clinicId!,
    providerId,
    // ...
  });
});
```

**Fix:**
```typescript
router.get("/providers/:providerId/availability", 
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      // Validate provider belongs to user's clinic
      const provider = await Provider.findOne({
        _id: req.params.providerId,
        clinic: req.user!.clinicId
      });
      
      if (!provider) {
        return res.status(404).json({
          success: false,
          message: 'Profissional não encontrado'
        });
      }
      
      // Continue with availability check...
    } catch (error) {
      // Error handling...
    }
  }
);
```

### 2. **Inconsistent Response Formats**

**Multiple routes have inconsistent response structures:**

```typescript
// Some routes return:
return res.json({ success: true, data: result });

// Others return:
return res.json({ success: true, appointments: result });

// Others return:
return res.json({ message: "success", data: result });
```

**Standardize with middleware:**
```typescript
// Create response middleware
export const formatResponse = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(data: any) {
    if (!data.success && !data.error) {
      data = {
        success: true,
        data,
        timestamp: new Date().toISOString()
      };
    }
    return originalJson.call(this, data);
  };
  
  next();
};
```

### 3. **Missing Input Validation**

**In `appointments.ts`:**
```typescript
// Line 35-41 - Missing date validation
const targetDate = new Date(date as string);
if (isNaN(targetDate.getTime())) {
  return res.status(400).json({ 
    success: false,
    error: "Invalid date format" 
  });
}
// ❌ No check if date is in the past
// ❌ No check if date is too far in future
```

**Add comprehensive validation:**
```typescript
const targetDate = new Date(date as string);
if (isNaN(targetDate.getTime())) {
  return res.status(400).json({ 
    success: false,
    error: "Formato de data inválido" 
  });
}

const today = new Date();
const maxFutureDate = new Date();
maxFutureDate.setMonth(maxFutureDate.getMonth() + 6);

if (targetDate < today) {
  return res.status(400).json({ 
    success: false,
    error: "Não é possível agendar para datas passadas" 
  });
}

if (targetDate > maxFutureDate) {
  return res.status(400).json({ 
    success: false,
    error: "Não é possível agendar com mais de 6 meses de antecedência" 
  });
}
```

## ⚠️ Error Handling Issues

### 1. **Inconsistent Error Messages**

**Mixed languages in error messages:**
```typescript
// English in some places:
error: "date and appointmentTypeId are required"

// Portuguese in others:
message: 'Data/hora de início inválida'
```

**Standardize to Portuguese throughout:**
```typescript
// Create error constants
export const ERROR_MESSAGES = {
  REQUIRED_FIELDS: 'Campos obrigatórios não informados',
  INVALID_DATE: 'Formato de data inválido',
  PROVIDER_NOT_FOUND: 'Profissional não encontrado',
  // ...
} as const;
```

### 2. **Error Information Leakage**

**In `app.ts`:**
```typescript
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error);
  
  return res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
    // ❌ Still might leak sensitive info in development
  });
});
```

**Safer approach:**
```typescript
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  // Log full error for debugging
  console.error('Unhandled error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Generic error response
  return res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    requestId: req.headers['x-request-id'] || 'unknown'
  });
});
```

### 3. **Missing Async Error Catching**

**Multiple route handlers missing proper async error handling:**
```typescript
router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    // ... code
  } catch (err: any) {
    console.error("Error fetching appointments:", err);
    return res.status(500).json({
      success: false,
      error: err.message // ❌ Exposes internal error messages
    });
  }
});
```

**Create async wrapper:**
```typescript
const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Use it:
router.get("/", asyncHandler(async (req: AuthenticatedRequest, res) => {
  const appointments = await schedulingService.getAppointments(/*...*/);
  return res.json({ success: true, data: appointments });
}));
```

## 🔒 Authentication Issues

### 1. **JWT Secret Validation Problem**

**In `authService.ts`:**
```typescript
if (!this.JWT_SECRET || this.JWT_SECRET === 'your-secret-key') {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET is not configured...');
    process.exit(1);
  } else {
    console.warn('Warning: JWT_SECRET not set...');
    this.JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
    // ❌ Still uses insecure fallback in development
  }
}
```

**Better approach:**
```typescript
if (!this.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET is not configured');
    process.exit(1);
  } else {
    // Generate a secure random secret for development
    this.JWT_SECRET = crypto.randomBytes(64).toString('hex');
    console.warn('Generated secure JWT_SECRET for development');
  }
} else if (this.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}
```

### 2. **Missing CSRF Protection**

**No CSRF protection implemented:**
```typescript
// Add CSRF middleware
import csrf from 'csurf';

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Apply to state-changing routes
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return csrfProtection(req, res, next);
  }
  next();
});
```

### 3. **Refresh Token Security Issues**

**In `RefreshToken.ts`:**
```typescript
// Missing indexes for performance
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ userId: 1, isRevoked: 1 });
// ❌ Missing index on token field for fast lookups
```

**Add missing index:**
```typescript
RefreshTokenSchema.index({ token: 1 }, { unique: true });
RefreshTokenSchema.index({ userId: 1, expiresAt: 1 }); // Compound for cleanup queries
```