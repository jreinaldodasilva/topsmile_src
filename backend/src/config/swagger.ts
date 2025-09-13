import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TopSmile API',
      version: '1.0.0',
      description: 'API para sistema de gestão odontológica TopSmile',
      contact: {
        name: 'TopSmile Support',
        email: 'support@topsmile.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.topsmile.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único do usuário'
            },
            name: {
              type: 'string',
              description: 'Nome completo do usuário'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'E-mail do usuário'
            },
            role: {
              type: 'string',
              enum: ['admin', 'dentist', 'assistant'],
              description: 'Função do usuário no sistema'
            },
            clinic: {
              $ref: '#/components/schemas/Clinic'
            },
            isActive: {
              type: 'boolean',
              description: 'Status ativo do usuário'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de atualização'
            }
          }
        },
        Clinic: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único da clínica'
            },
            name: {
              type: 'string',
              description: 'Nome da clínica'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'E-mail da clínica'
            },
            phone: {
              type: 'string',
              description: 'Telefone da clínica'
            },
            address: {
              type: 'object',
              properties: {
                street: {
                  type: 'string',
                  description: 'Rua'
                },
                number: {
                  type: 'string',
                  description: 'Número'
                },
                neighborhood: {
                  type: 'string',
                  description: 'Bairro'
                },
                city: {
                  type: 'string',
                  description: 'Cidade'
                },
                state: {
                  type: 'string',
                  description: 'Estado'
                },
                zipCode: {
                  type: 'string',
                  description: 'CEP'
                }
              }
            },
            subscription: {
              type: 'object',
              properties: {
                plan: {
                  type: 'string',
                  enum: ['basic', 'premium', 'enterprise'],
                  description: 'Plano de assinatura'
                },
                status: {
                  type: 'string',
                  enum: ['active', 'inactive', 'suspended'],
                  description: 'Status da assinatura'
                },
                startDate: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Data de início'
                },
                endDate: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Data de término'
                }
              }
            },
            settings: {
              type: 'object',
              properties: {
                timezone: {
                  type: 'string',
                  description: 'Fuso horário'
                },
                workingHours: {
                  type: 'object',
                  description: 'Horário de funcionamento'
                },
                appointmentDuration: {
                  type: 'number',
                  description: 'Duração padrão das consultas (minutos)'
                },
                allowOnlineBooking: {
                  type: 'boolean',
                  description: 'Permitir agendamento online'
                }
              }
            }
          }
        },
        Contact: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único do contato'
            },
            name: {
              type: 'string',
              description: 'Nome do contato'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'E-mail do contato'
            },
            clinic: {
              type: 'string',
              description: 'Clínica do contato'
            },
            specialty: {
              type: 'string',
              description: 'Especialidade'
            },
            phone: {
              type: 'string',
              description: 'Telefone'
            },
            source: {
              type: 'string',
              enum: ['website_contact_form', 'phone', 'referral', 'social_media'],
              description: 'Fonte do contato'
            },
            status: {
              type: 'string',
              enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed', 'lost', 'deleted'],
              description: 'Status do contato'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: 'Prioridade do contato'
            },
            assignedTo: {
              type: 'string',
              description: 'ID do usuário responsável'
            },
            notes: {
              type: 'string',
              description: 'Observações'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de atualização'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Status da operação'
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User'
                },
                accessToken: {
                  type: 'string',
                  description: 'Token de acesso JWT'
                },
                refreshToken: {
                  type: 'string',
                  description: 'Token de refresh'
                },
                expiresIn: {
                  type: 'string',
                  description: 'Tempo de expiração do token'
                }
              }
            },
            message: {
              type: 'string',
              description: 'Mensagem de resposta'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Mensagem de erro'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    description: 'Campo com erro'
                  },
                  message: {
                    type: 'string',
                    description: 'Mensagem de erro do campo'
                  }
                }
              }
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
              description: 'Nome completo do usuário'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'E-mail do usuário'
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'Senha (mínimo 8 caracteres, deve conter maiúscula, minúscula, número e símbolo)'
            },
            clinic: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Nome da clínica'
                },
                phone: {
                  type: 'string',
                  description: 'Telefone da clínica'
                },
                address: {
                  type: 'object',
                  properties: {
                    street: {
                      type: 'string',
                      description: 'Rua'
                    },
                    number: {
                      type: 'string',
                      description: 'Número'
                    },
                    neighborhood: {
                      type: 'string',
                      description: 'Bairro'
                    },
                    city: {
                      type: 'string',
                      description: 'Cidade'
                    },
                    state: {
                      type: 'string',
                      description: 'Estado'
                    },
                    zipCode: {
                      type: 'string',
                      description: 'CEP'
                    }
                  }
                }
              }
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'E-mail do usuário'
            },
            password: {
              type: 'string',
              description: 'Senha do usuário'
            }
          }
        },
        Patient: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único do paciente'
            },
            name: {
              type: 'string',
              description: 'Nome completo do paciente'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'E-mail do paciente'
            },
            phone: {
              type: 'string',
              description: 'Telefone do paciente'
            },
            birthDate: {
              type: 'string',
              format: 'date',
              description: 'Data de nascimento'
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other'],
              description: 'Gênero'
            },
            cpf: {
              type: 'string',
              description: 'CPF'
            },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                number: { type: 'string' },
                complement: { type: 'string' },
                neighborhood: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zipCode: { type: 'string' }
              }
            },
            clinic: {
              type: 'string',
              description: 'ID da clínica'
            },
            emergencyContact: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phone: { type: 'string' },
                relationship: { type: 'string' }
              }
            },
            medicalHistory: {
              type: 'object',
              properties: {
                allergies: {
                  type: 'array',
                  items: { type: 'string' }
                },
                medications: {
                  type: 'array',
                  items: { type: 'string' }
                },
                conditions: {
                  type: 'array',
                  items: { type: 'string' }
                },
                notes: { type: 'string' }
              }
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive']
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Provider: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único do prestador'
            },
            clinic: {
              type: 'string',
              description: 'ID da clínica'
            },
            user: {
              type: 'string',
              description: 'ID do usuário vinculado'
            },
            name: {
              type: 'string',
              description: 'Nome completo do prestador'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'E-mail do prestador'
            },
            phone: {
              type: 'string',
              description: 'Telefone do prestador'
            },
            specialties: {
              type: 'array',
              items: {
                type: 'string',
                enum: [
                  'general_dentistry',
                  'orthodontics',
                  'oral_surgery',
                  'periodontics',
                  'endodontics',
                  'prosthodontics',
                  'pediatric_dentistry',
                  'oral_pathology',
                  'dental_hygiene'
                ]
              }
            },
            licenseNumber: {
              type: 'string',
              description: 'Número da licença'
            },
            isActive: {
              type: 'boolean',
              description: 'Status ativo'
            },
            workingHours: {
              type: 'object',
              properties: {
                monday: {
                  type: 'object',
                  properties: {
                    start: { type: 'string' },
                    end: { type: 'string' },
                    isWorking: { type: 'boolean' }
                  }
                },
                tuesday: {
                  type: 'object',
                  properties: {
                    start: { type: 'string' },
                    end: { type: 'string' },
                    isWorking: { type: 'boolean' }
                  }
                },
                wednesday: {
                  type: 'object',
                  properties: {
                    start: { type: 'string' },
                    end: { type: 'string' },
                    isWorking: { type: 'boolean' }
                  }
                },
                thursday: {
                  type: 'object',
                  properties: {
                    start: { type: 'string' },
                    end: { type: 'string' },
                    isWorking: { type: 'boolean' }
                  }
                },
                friday: {
                  type: 'object',
                  properties: {
                    start: { type: 'string' },
                    end: { type: 'string' },
                    isWorking: { type: 'boolean' }
                  }
                },
                saturday: {
                  type: 'object',
                  properties: {
                    start: { type: 'string' },
                    end: { type: 'string' },
                    isWorking: { type: 'boolean' }
                  }
                },
                sunday: {
                  type: 'object',
                  properties: {
                    start: { type: 'string' },
                    end: { type: 'string' },
                    isWorking: { type: 'boolean' }
                  }
                }
              }
            },
            timeZone: {
              type: 'string'
            },
            bufferTimeBefore: {
              type: 'number'
            },
            bufferTimeAfter: {
              type: 'number'
            },
            appointmentTypes: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        CalendarEvent: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único do evento'
            },
            title: {
              type: 'string',
              description: 'Título do evento'
            },
            start: {
              type: 'string',
              format: 'date-time',
              description: 'Data e hora de início'
            },
            end: {
              type: 'string',
              format: 'date-time',
              description: 'Data e hora de fim'
            },
            patientId: {
              type: 'string',
              description: 'ID do paciente (opcional)'
            },
            providerId: {
              type: 'string',
              description: 'ID do prestador (opcional)'
            },
            appointmentTypeId: {
              type: 'string',
              description: 'ID do tipo de agendamento (opcional)'
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'],
              description: 'Status do evento'
            },
            notes: {
              type: 'string',
              description: 'Observações do evento'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de atualização'
            }
          }
        },
        CreateCalendarEventRequest: {
          type: 'object',
          required: ['title', 'start', 'end'],
          properties: {
            title: {
              type: 'string',
              description: 'Título do evento'
            },
            start: {
              type: 'string',
              format: 'date-time',
              description: 'Data e hora de início'
            },
            end: {
              type: 'string',
              format: 'date-time',
              description: 'Data e hora de fim'
            },
            patientId: {
              type: 'string',
              description: 'ID do paciente'
            },
            providerId: {
              type: 'string',
              description: 'ID do prestador'
            },
            appointmentTypeId: {
              type: 'string',
              description: 'ID do tipo de agendamento'
            },
            notes: {
              type: 'string',
              description: 'Observações'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts']
};

export const swaggerSpec = swaggerJSDoc(options);
