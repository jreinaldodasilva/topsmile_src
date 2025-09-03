# TopSmile Project 

## Architecture & Technology Stack

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based auth with role-based access control
- **Security**: Helmet, CORS, rate limiting, input sanitization
- **Email**: Nodemailer with SendGrid/Ethereal support
- **Validation**: Express-validator with DOMPurify sanitization
- **Environment**: Development/Production configuration support

### Frontend Architecture
- **Framework**: React 19 with TypeScript
- **Routing**: React Router DOM for navigation
- **State Management**: React Context API for authentication
- **Animations**: Framer Motion for smooth UI animations
- **Styling**: CSS Modules and custom CSS
- **HTTP Client**: Custom fetch-based HTTP service
- **Forms**: Controlled components with validation

### Project Structure Analysis

```
topsmile/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── database.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Contact.ts
│   │   │   ├── Clinic.ts
│   │   │   ├── Patient.ts
│   │   │   ├── Appointment.ts
│   │   │   └── FormTemplate.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── appointments.ts
│   │   │   ├── calendar.ts
│   │   │   └── forms.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   └── contactService.ts
│   │   └── app.ts
├── frontend/
│   ├── components/
│   │   ├── Admin/
│   │   │   ├── Dashboard/
│   │   │   └── Contacts/
│   │   ├── Auth/
│   │   │   └── ProtectedRoute/
│   │   ├── Header/
│   │   ├── Hero/
│   │   ├── Features/
│   │   ├── Pricing/
│   │   ├── ContactForm/
│   │   ├── Testimonials/
│   │   └── Footer/
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   └── useApiState.ts
│   ├── pages/
│   │   ├── Home/
│   │   ├── Admin/
│   │   ├── Login/
│   │   ├── Contact/
│   │   ├── Features/
│   │   ├── Pricing/
│   │   ├── Calendar/
│   │   └── FormRenderer/
│   ├── services/
│   │   ├── apiService.ts
│   │   └── http.ts
│   ├── types/
│   │   └── api.ts
│   └── App.tsx
└── public/
```
