# Patient Management Implementation

## Overview

This document describes the implementation of the Patient Management functionality for the TopSmile project, including CRUD operations, medical history management, and search functionality.

## Files Created/Modified

### 1. Patient Service (`backend/src/services/patientService.ts`)

The patient service provides comprehensive business logic for patient management:

#### Key Features:
- **CRUD Operations**: Create, read, update, delete patients
- **Search & Filtering**: Advanced search with pagination and sorting
- **Medical History Management**: Dedicated methods for managing patient medical records
- **Data Validation**: Comprehensive validation for patient data
- **Clinic Isolation**: Ensures patients are isolated by clinic
- **Statistics**: Patient statistics and analytics

#### Main Methods:
- `createPatient(data)` - Create a new patient
- `getPatientById(id, clinicId)` - Get patient by ID
- `updatePatient(id, clinicId, data)` - Update patient information
- `deletePatient(id, clinicId)` - Soft delete patient (sets status to inactive)
- `searchPatients(filters)` - Search patients with pagination and filters
- `updateMedicalHistory(id, clinicId, history)` - Update medical history
- `getPatientStats(clinicId)` - Get patient statistics
- `reactivatePatient(id, clinicId)` - Reactivate inactive patient

### 2. Patient Routes (`backend/src/routes/patients.ts`)

RESTful API endpoints for patient management:

#### Endpoints:

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/patients` | Create new patient | ✅ |
| GET | `/api/patients` | Search/list patients with pagination | ✅ |
| GET | `/api/patients/stats` | Get patient statistics | ✅ |
| GET | `/api/patients/:id` | Get specific patient | ✅ |
| PUT | `/api/patients/:id` | Update patient | ✅ |
| PATCH | `/api/patients/:id/medical-history` | Update medical history | ✅ |
| PATCH | `/api/patients/:id/reactivate` | Reactivate patient | ✅ |
| DELETE | `/api/patients/:id` | Delete patient (soft delete) | ✅ |

#### Request/Response Examples:

**Create Patient:**
```json
POST /api/patients
{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "(11) 99999-9999",
  "birthDate": "1990-01-15",
  "gender": "male",
  "cpf": "123.456.789-00",
  "address": {
    "street": "Rua das Flores",
    "number": "123",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567"
  },
  "emergencyContact": {
    "name": "Maria Silva",
    "phone": "(11) 88888-8888",
    "relationship": "Esposa"
  },
  "medicalHistory": {
    "allergies": ["Penicilina"],
    "medications": ["Losartana"],
    "conditions": ["Hipertensão"],
    "notes": "Paciente com histórico de hipertensão controlada"
  }
}
```

**Search Patients:**
```json
GET /api/patients?search=João&status=active&page=1&limit=20&sortBy=name&sortOrder=asc

Response:
{
  "success": true,
  "data": {
    "patients": [...],
    "total": 150,
    "page": 1,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 3. App Configuration (`backend/src/app.ts`)

Updated the main application file to include patient routes:
- Added import for patient routes
- Mounted patient routes at `/api/patients`

## Data Model

The patient model (already existed in `backend/src/models/Patient.ts`) includes:

### Patient Schema:
- **Basic Info**: name, email, phone, birthDate, gender, cpf
- **Address**: Complete address information
- **Clinic Association**: Links patient to specific clinic
- **Emergency Contact**: Emergency contact information
- **Medical History**: allergies, medications, conditions, notes
- **Status**: active/inactive for soft deletion
- **Timestamps**: createdAt, updatedAt

### Indexes:
- clinic (for clinic isolation)
- email (for search)
- phone (for search)
- status (for filtering)

## Security Features

### Authentication & Authorization:
- All endpoints require authentication
- Clinic isolation ensures users only see their clinic's patients
- Role-based access control through existing middleware

### Data Validation:
- Comprehensive input validation using express-validator
- Email format validation
- Phone number validation
- CPF format validation (Brazilian tax ID)
- Address field length limits
- Medical history data validation

### Data Sanitization:
- Input sanitization to prevent XSS attacks
- Proper error handling without exposing sensitive information

## Search & Filtering

### Search Capabilities:
- **Text Search**: Search across name, email, phone, CPF, medical conditions, and allergies
- **Status Filter**: Filter by active/inactive patients
- **Pagination**: Configurable page size with limits
- **Sorting**: Sort by name, email, phone, createdAt, updatedAt
- **Sort Order**: Ascending or descending

### Performance:
- Database indexes for efficient searching
- Pagination to handle large datasets
- Optimized queries with proper field selection

## Medical History Management

### Features:
- Dedicated endpoint for updating medical history
- Separate from general patient updates for better organization
- Supports:
  - Allergies (array of strings)
  - Current medications (array of strings)
  - Medical conditions (array of strings)
  - General notes (text field)

### Usage:
```json
PATCH /api/patients/:id/medical-history
{
  "allergies": ["Penicilina", "Aspirina"],
  "medications": ["Losartana 50mg", "Metformina 500mg"],
  "conditions": ["Hipertensão", "Diabetes Tipo 2"],
  "notes": "Paciente com bom controle das condições crônicas"
}
```

## Statistics & Analytics

### Patient Statistics Endpoint:
```json
GET /api/patients/stats

Response:
{
  "success": true,
  "data": {
    "total": 250,
    "active": 230,
    "inactive": 20,
    "recentlyAdded": 15,
    "withMedicalHistory": 180
  }
}
```

## Error Handling

### Comprehensive Error Responses:
- Validation errors with detailed field-level messages
- Proper HTTP status codes
- Consistent error response format
- Security-conscious error messages (no sensitive data exposure)

### Example Error Response:
```json
{
  "success": false,
  "message": "Dados inválidos",
  "errors": [
    {
      "field": "email",
      "message": "E-mail inválido"
    },
    {
      "field": "phone",
      "message": "Telefone deve ter entre 10 e 15 caracteres"
    }
  ]
}
```

## Testing

### Manual Testing:
You can test the API using tools like Postman or curl. Make sure to:

1. **Authenticate first** using the `/api/auth/login` endpoint
2. **Include the Bearer token** in all patient API requests
3. **Use a valid clinic ID** (from your authenticated user)

### Example Test Flow:
```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinic.com","password":"password"}'

# 2. Create Patient (use token from login response)
curl -X POST http://localhost:5000/api/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"Test Patient","phone":"11999999999"}'

# 3. Search Patients
curl -X GET "http://localhost:5000/api/patients?search=Test" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Future Enhancements

### Potential Improvements:
1. **File Uploads**: Support for patient photos and documents
2. **Appointment Integration**: Link patients with their appointments
3. **Treatment History**: Track treatments and procedures
4. **Insurance Information**: Manage insurance details
5. **Family Relationships**: Link family members
6. **Communication Preferences**: Email/SMS preferences
7. **Audit Trail**: Track all changes to patient records
8. **Export Functionality**: Export patient data to various formats
9. **Advanced Search**: More complex search filters and criteria
10. **Patient Portal**: Allow patients to update their own information

## Deployment Notes

### Environment Variables:
No additional environment variables are required for patient management. The functionality uses the existing database and authentication configuration.

### Database Migration:
The Patient model already exists, so no database migration is needed. The implementation works with the existing schema.

### Performance Considerations:
- Monitor database performance with large patient datasets
- Consider implementing caching for frequently accessed patient data
- Optimize search queries based on usage patterns

## Conclusion

The Patient Management implementation provides a complete, secure, and scalable solution for managing patient data in the TopSmile system. It follows best practices for API design, security, and data validation while providing comprehensive functionality for healthcare practice management.

The implementation is ready for production use and can be extended with additional features as needed.