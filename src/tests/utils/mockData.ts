import { faker } from '@faker-js/faker';

// Mock User Data
export const generateMockUser = (overrides = {}) => ({
  _id: faker.database.mongodbObjectId(),
  name: faker.name.fullName(),
  email: faker.internet.email(),
  role: faker.helpers.arrayElement(['admin', 'manager', 'dentist', 'assistant']),
  clinic: faker.database.mongodbObjectId(),
  isActive: faker.datatype.boolean(),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides
});

// Mock Patient Data
export const generateMockPatient = (overrides = {}) => {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();

  return {
    _id: faker.database.mongodbObjectId(),
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email: faker.internet.email(firstName, lastName),
    phone: faker.phone.number(),
    dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }).toISOString().split('T')[0],
    gender: faker.helpers.arrayElement(['male', 'female', 'other', 'prefer_not_to_say']),
    cpf: faker.helpers.replaceSymbols('###.###.###-##'),
    address: {
      street: faker.address.street(),
      number: faker.address.buildingNumber(),
      neighborhood: faker.address.city(),
      city: faker.address.city(),
      state: faker.address.stateAbbr(),
      zipCode: faker.address.zipCode('#####-###')
    },
    emergencyContact: {
      name: faker.name.fullName(),
      phone: faker.phone.number(),
      relationship: faker.helpers.arrayElement(['spouse', 'parent', 'sibling', 'child', 'friend'])
    },
    medicalHistory: {
      allergies: faker.helpers.arrayElements(['Penicilina', 'Látex', 'Anestésico local', 'Nenhuma'], { min: 0, max: 2 }),
      medications: faker.helpers.arrayElements(['Aspirina', 'Ibuprofeno', 'Paracetamol', 'Nenhum'], { min: 0, max: 2 }),
      conditions: faker.helpers.arrayElements(['Diabetes', 'Hipertensão', 'Cardiopatia', 'Nenhuma'], { min: 0, max: 2 }),
      notes: faker.lorem.sentence()
    },
    clinic: faker.database.mongodbObjectId(),
    isActive: faker.datatype.boolean({ probability: 0.9 }),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides
  };
};

// Mock Provider Data
export const generateMockProvider = (overrides = {}) => ({
  _id: faker.database.mongodbObjectId(),
  name: `Dr. ${faker.name.fullName()}`,
  email: faker.internet.email(),
  phone: faker.phone.number(),
  specialties: faker.helpers.arrayElements([
    'general_dentistry',
    'orthodontics',
    'oral_surgery',
    'periodontics',
    'endodontics',
    'prosthodontics',
    'pediatric_dentistry',
    'oral_pathology',
    'dental_hygiene'
  ], { min: 1, max: 3 }),
  license: `CRO-${faker.datatype.number({ min: 10000, max: 99999 })}`,
  clinic: faker.database.mongodbObjectId(),
  workingHours: {
    monday: { start: '08:00', end: '17:00', isWorking: true },
    tuesday: { start: '08:00', end: '17:00', isWorking: true },
    wednesday: { start: '08:00', end: '17:00', isWorking: true },
    thursday: { start: '08:00', end: '17:00', isWorking: true },
    friday: { start: '08:00', end: '17:00', isWorking: true },
    saturday: { start: '08:00', end: '12:00', isWorking: faker.datatype.boolean() },
    sunday: { start: '08:00', end: '12:00', isWorking: false }
  },
  timeZone: 'America/Sao_Paulo',
  bufferTimeBefore: faker.helpers.arrayElement([0, 15, 30]),
  bufferTimeAfter: faker.helpers.arrayElement([0, 15, 30]),
  appointmentTypes: [faker.database.mongodbObjectId()],
  isActive: faker.datatype.boolean({ probability: 0.95 }),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides
});

// Mock Appointment Data
export const generateMockAppointment = (overrides = {}) => {
  const scheduledStart = faker.date.future();
  const scheduledEnd = new Date(scheduledStart.getTime() + 60 * 60 * 1000); // 1 hour later

  return {
    _id: faker.database.mongodbObjectId(),
    patient: faker.database.mongodbObjectId(),
    provider: faker.database.mongodbObjectId(),
    appointmentType: faker.database.mongodbObjectId(),
    scheduledStart: scheduledStart.toISOString(),
    scheduledEnd: scheduledEnd.toISOString(),
    actualStart: faker.datatype.boolean() ? scheduledStart.toISOString() : undefined,
    actualEnd: faker.datatype.boolean() ? scheduledEnd.toISOString() : undefined,
    status: faker.helpers.arrayElement(['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']),
    priority: faker.helpers.arrayElement(['routine', 'urgent', 'emergency']),
    notes: faker.lorem.sentence(),
    clinic: faker.database.mongodbObjectId(),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides
  };
};

// Mock Appointment Type Data
export const generateMockAppointmentType = (overrides = {}) => ({
  _id: faker.database.mongodbObjectId(),
  name: faker.helpers.arrayElement([
    'Consulta Geral',
    'Limpeza',
    'Tratamento de Canal',
    'Extração',
    'Ortodontia',
    'Implante',
    'Clareamento',
    'Prótese'
  ]),
  description: faker.lorem.sentence(),
  duration: faker.helpers.arrayElement([30, 45, 60, 90, 120]),
  price: faker.number.int({ min: 50, max: 500 }),
  color: faker.color.rgb(),
  category: faker.helpers.arrayElement(['consulta', 'tratamento', 'cirurgia', 'preventivo']),
  isActive: faker.datatype.boolean({ probability: 0.9 }),
  clinic: faker.database.mongodbObjectId(),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides
});

// Mock Contact Data
export const generateMockContact = (overrides = {}) => ({
  _id: faker.database.mongodbObjectId(),
  name: faker.name.fullName(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
  clinic: faker.company.name() + ' Odontologia',
  specialty: faker.helpers.arrayElement([
    'Ortodontia',
    'Implantodontia',
    'Endodontia',
    'Periodontia',
    'Cirurgia Oral',
    'Odontopediatria',
    'Prótese Dentária',
    'Clareamento'
  ]),
  status: faker.helpers.arrayElement(['new', 'contacted', 'qualified', 'converted', 'lost']),
  source: faker.helpers.arrayElement(['website', 'phone', 'referral', 'social_media', 'advertisement']),
  notes: faker.lorem.paragraph(),
  assignedTo: faker.datatype.boolean() ? faker.database.mongodbObjectId() : undefined,
  followUpDate: faker.datatype.boolean() ? faker.date.future().toISOString() : undefined,
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides
});

// Mock Clinic Data
export const generateMockClinic = (overrides = {}) => ({
  _id: faker.database.mongodbObjectId(),
  name: `${faker.company.name()} Odontologia`,
  email: faker.internet.email(),
  phone: faker.phone.number(),
  address: {
    street: faker.address.street(),
    number: faker.address.buildingNumber(),
    neighborhood: faker.address.city(),
    city: faker.address.city(),
    state: faker.address.stateAbbr(),
    zipCode: faker.address.zipCode('#####-###'),
    country: 'Brasil'
  },
  isActive: faker.datatype.boolean({ probability: 0.95 }),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides
});

// Mock Dashboard Stats
export const generateMockDashboardStats = (overrides = {}) => ({
  totalPatients: faker.datatype.number({ min: 100, max: 5000 }),
  todayAppointments: faker.datatype.number({ min: 0, max: 50 }),
  monthlyRevenue: faker.datatype.number({ min: 10000, max: 100000 }),
  satisfaction: faker.datatype.float({ min: 3.0, max: 5.0, precision: 0.1 }),
  trends: {
    patients: faker.datatype.number({ min: -20, max: 30 }),
    appointments: faker.datatype.number({ min: -15, max: 25 }),
    revenue: faker.datatype.number({ min: -10, max: 40 }),
    satisfaction: faker.datatype.number({ min: -5, max: 10 })
  },
  ...overrides
});

// Mock Form Template Data
export const generateMockFormTemplate = (overrides = {}) => ({
  _id: faker.database.mongodbObjectId(),
  title: faker.helpers.arrayElement([
    'Anamnese Inicial',
    'Avaliação Ortodôntica',
    'Histórico Médico',
    'Consentimento de Tratamento',
    'Avaliação de Dor'
  ]),
  questions: Array.from({ length: faker.datatype.number({ min: 3, max: 10 }) }, () => ({
    id: faker.datatype.uuid(),
    label: faker.lorem.sentence().replace('.', '?'),
    type: faker.helpers.arrayElement(['text', 'textarea', 'select', 'radio', 'checkbox', 'date']),
    required: faker.datatype.boolean(),
    options: faker.datatype.boolean() ?
      Array.from({ length: faker.datatype.number({ min: 2, max: 5 }) }, () => ({
        value: faker.lorem.word(),
        label: faker.lorem.words(2)
      })) : undefined
  })),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides
});

// Mock Form Response Data
export const generateMockFormResponse = (templateId?: string, patientId?: string, overrides = {}) => ({
  _id: faker.database.mongodbObjectId(),
  templateId: templateId || faker.database.mongodbObjectId(),
  patientId: patientId || faker.database.mongodbObjectId(),
  answers: {
    'question1': faker.lorem.sentence(),
    'question2': faker.helpers.arrayElement(['Sim', 'Não']),
    'question3': faker.date.past().toISOString().split('T')[0],
    'question4': faker.lorem.paragraph()
  },
  submittedAt: faker.date.recent().toISOString(),
  ...overrides
});

// Mock API Response
export const generateMockApiResponse = <T>(data: T, success = true, message?: string) => ({
  success,
  data,
  message: message || (success ? 'Operação realizada com sucesso' : 'Erro na operação')
});

// Mock Error Response
export const generateMockErrorResponse = (message?: string, status = 400) => ({
  success: false,
  data: null,
  message: message || 'Erro interno do servidor',
  status
});

// Mock Paginated Response
export const generateMockPaginatedResponse = <T>(items: T[], page = 1, limit = 10) => {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    success: true,
    data: {
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  };
};

// Utility function to generate multiple items
export const generateMultiple = <T>(generator: (overrides?: any) => T, count: number, overrides = {}) => {
  return Array.from({ length: count }, () => generator(overrides));
};

// Realistic Brazilian data generators
export const generateBrazilianPhone = () => faker.helpers.replaceSymbols('(##) #####-####');
export const generateBrazilianCPF = () => faker.helpers.replaceSymbols('###.###.###-##');
export const generateBrazilianZipCode = () => faker.address.zipCode('#####-###');
export const generateBrazilianState = () => faker.helpers.arrayElement([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]);

// Common test scenarios
export const createTestScenarios = {
  // Authentication scenarios
  validLogin: () => ({
    email: 'admin@topsmile.com',
    password: 'SecurePass123!'
  }),
  
  invalidLogin: () => ({
    email: 'invalid@example.com',
    password: 'wrongpassword'
  }),

  // Patient scenarios
  newPatient: () => generateMockPatient({
    _id: undefined,
    createdAt: undefined,
    updatedAt: undefined
  }),

  existingPatient: () => generateMockPatient(),

  // Appointment scenarios
  upcomingAppointment: () => generateMockAppointment({
    scheduledStart: faker.date.future().toISOString(),
    status: 'scheduled'
  }),

  pastAppointment: () => generateMockAppointment({
    scheduledStart: faker.date.past().toISOString(),
    status: 'completed'
  }),

  // Contact scenarios
  newContact: () => generateMockContact({
    status: 'new',
    assignedTo: undefined
  }),

  qualifiedContact: () => generateMockContact({
    status: 'qualified',
    assignedTo: faker.database.mongodbObjectId()
  })
};
