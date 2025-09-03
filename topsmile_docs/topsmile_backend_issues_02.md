# TopSmile Backend Code Review - Part 2: Model & Service Issues

## 📊 Model Layer Issues

### 1. **Appointment Model Inconsistencies**

**In `Appointment.ts`:**
```typescript
// Line 24 - Missing validation
scheduledEnd: {
  type: Date,
  required: [true, 'Data/hora de término é obrigatória']
  // ❌ Missing validation that scheduledEnd > scheduledStart
},
```

**Add custom validation:**
```typescript
// Add this validation
AppointmentSchema.pre('save', function() {
  if (this.scheduledEnd <= this.scheduledStart) {
    throw new Error('Data de término deve ser posterior ao início');
  }
});
```

### 2. **Provider Model Issues**

**In `Provider.ts`:**
```typescript
// Missing validation for working hours
workingHours: {
  monday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
  // ❌ No validation that start < end time
  // ❌ No validation for time format
}
```

**Fix:**
```typescript
// Add validation function
const validateTimeFormat = (time: string) => {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

const validateWorkingHours = function(hours: any) {
  if (hours.isWorking && (!hours.start || !hours.end)) {
    return false;
  }
  if (hours.start && hours.end) {
    return validateTimeFormat(hours.start) && 
           validateTimeFormat(hours.end) && 
           hours.start < hours.end;
  }
  return true;
};

// Apply to each day
monday: { 
  start: { type: String, validate: validateTimeFormat },
  end: { type: String, validate: validateTimeFormat },
  isWorking: { type: Boolean, default: true }
}
```

### 3. **User Model Security Issue**

**In `User.ts`:**
```typescript
// Weak password hashing
const salt = await bcrypt.genSalt(12);
this.password = await bcrypt.hash(this.password, salt);
// ✅ Actually this is fine - 12 rounds is good
```

**But missing:**
```typescript
// Add password strength validation
UserSchema.pre('validate', function() {
  if (this.isNew || this.isModified('password')) {
    // Check password strength
    const password = this.password;
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      this.invalidate('password', 'Password must contain uppercase, lowercase, and number');
    }
  }
});
```

## 🔄 Service Layer Issues

### 1. **Scheduling Service Time Zone Problems**

**In `schedulingService.ts`:**
```typescript
// Incorrect timezone handling
private parseTimeToDate(date: Date, timeString: string, timeZone: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const targetDate = new Date(date);
  targetDate.setHours(hours, minutes, 0, 0);
  
  // ❌ This doesn't properly handle timezone conversion
  const dateInTimeZoneString = formatInTimeZone(targetDate, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");
  return parseISO(dateInTimeZoneString);
}
```

**Correct implementation:**
```typescript
private parseTimeToDate(date: Date, timeString: string, timeZone: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const dateStr = format(date, 'yyyy-MM-dd');
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  const localDateTime = `${dateStr}T${timeStr}`;
  
  // Convert from provider's timezone to UTC
  return zonedTimeToUtc(localDateTime, timeZone);
}
```

### 2. **Contact Service Missing Validation**

**In `contactService.ts`:**
```typescript
// Race condition potential
const existingContact = await Contact.findOne({ email: data.email });
if (existingContact) {
  // ❌ Another contact could be created between check and update
  existingContact.name = data.name;
  // ...
  return await existingContact.save();
}
```

**Fix with findOneAndUpdate:**
```typescript
// Use atomic operation
const updatedContact = await Contact.findOneAndUpdate(
  { email: data.email },
  {
    $set: {
      name: data.name,
      clinic: data.clinic,
      specialty: data.specialty,
      phone: data.phone,
      status: 'new',
      source: data.source || 'website_contact_form'
    }
  },
  { 
    new: true, 
    upsert: true, 
    runValidators: true,
    setDefaultsOnInsert: true
  }
);
return updatedContact;
```

### 3. **Auth Service Token Issues**

**In `authService.ts`:**
```typescript
// Line 143-151 - Potential token collision
private generateRefreshTokenString(): string {
  return crypto.randomBytes(48).toString('hex');
  // ❌ No collision checking - very rare but possible
}
```

**Add collision checking:**
```typescript
private async generateRefreshTokenString(): Promise<string> {
  let token: string;
  let attempts = 0;
  const MAX_ATTEMPTS = 5;
  
  do {
    token = crypto.randomBytes(48).toString('hex');
    const existing = await RefreshToken.findOne({ token });
    if (!existing) return token;
    
    attempts++;
    if (attempts >= MAX_ATTEMPTS) {
      throw new Error('Unable to generate unique refresh token');
    }
  } while (true);
}
```

## 🛡️ Security Issues

### 1. **SQL Injection via NoSQL**

**In multiple services:**
```typescript
// Potential NoSQL injection
const query: FilterQuery<IContact> = {};
if (filters.search) {
  query.$or = [
    { name: { $regex: filters.search, $options: 'i' } },
    // ❌ No escaping of regex special characters
  ];
}
```

**Fix:**
```typescript
if (filters.search) {
  const escapedSearch = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  query.$or = [
    { name: { $regex: escapedSearch, $options: 'i' } },
    { email: { $regex: escapedSearch, $options: 'i' } },
    // ...
  ];
}
```

### 2. **Rate Limiting Issues**

**In `app.ts`:**
```typescript
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  // ❌ No skip function for trusted IPs
  // ❌ No different limits for authenticated users
});
```

**Improvement:**
```typescript
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: (req) => {
    // Skip rate limiting for trusted IPs
    const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
    return trustedIPs.includes(req.ip);
  },
  keyGenerator: (req) => {
    // Use authenticated user ID if available, otherwise IP
    return req.user?.id || req.ip;
  }
});
```