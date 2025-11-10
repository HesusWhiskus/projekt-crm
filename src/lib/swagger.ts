import swaggerJsdoc, { Options } from 'swagger-jsdoc'

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Internal CRM API',
      version: '0.4.2-beta',
      description: 'API dla systemu CRM do zarządzania relacjami z agencjami ubezpieczeniowymi. Wszystkie endpointy wymagają autoryzacji poprzez NextAuth.js.',
      contact: {
        name: 'Internal CRM Team',
      },
    },
    servers: [
      {
        url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        description: 'Server URL',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token autoryzacyjny z NextAuth.js. Użyj sesji cookie lub tokenu Bearer w nagłówku Authorization.',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'next-auth.session-token',
          description: 'Sesja cookie z NextAuth.js (dla aplikacji webowej)',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Komunikat błędu',
            },
          },
          required: ['error'],
        },
        Client: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'CUID identyfikator klienta',
              example: 'cmhnww4wl0001sghcpfrzy507',
            },
            firstName: {
              type: 'string',
              maxLength: 50,
            },
            lastName: {
              type: 'string',
              maxLength: 50,
            },
            agencyName: {
              type: 'string',
              nullable: true,
              maxLength: 150,
            },
            email: {
              type: 'string',
              format: 'email',
              nullable: true,
              maxLength: 255,
            },
            phone: {
              type: 'string',
              nullable: true,
              maxLength: 30,
            },
            website: {
              type: 'string',
              format: 'uri',
              nullable: true,
              maxLength: 2048,
            },
            address: {
              type: 'string',
              nullable: true,
              maxLength: 500,
            },
            source: {
              type: 'string',
              nullable: true,
              maxLength: 100,
            },
            status: {
              type: 'string',
              enum: ['NEW_LEAD', 'IN_CONTACT', 'DEMO_SENT', 'NEGOTIATION', 'ACTIVE_CLIENT', 'LOST'],
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH'],
              nullable: true,
            },
            assignedTo: {
              type: 'string',
              nullable: true,
              description: 'CUID użytkownika przypisanego',
            },
            lastContactAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            nextFollowUpAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['id', 'firstName', 'lastName', 'status', 'createdAt', 'updatedAt'],
        },
        Contact: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'CUID identyfikator kontaktu',
            },
            type: {
              type: 'string',
              enum: ['PHONE_CALL', 'MEETING', 'EMAIL', 'LINKEDIN_MESSAGE', 'OTHER'],
              nullable: true,
            },
            date: {
              type: 'string',
              format: 'date-time',
            },
            notes: {
              type: 'string',
            },
            isNote: {
              type: 'boolean',
              description: 'Flaga rozróżniająca notatki od kontaktów',
            },
            clientId: {
              type: 'string',
            },
            userId: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['id', 'date', 'notes', 'isNote', 'clientId', 'userId', 'createdAt', 'updatedAt'],
        },
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'CUID identyfikator zadania',
            },
            title: {
              type: 'string',
              maxLength: 150,
            },
            description: {
              type: 'string',
              nullable: true,
              maxLength: 5000,
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
            },
            assignedTo: {
              type: 'string',
              nullable: true,
            },
            clientId: {
              type: 'string',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['id', 'title', 'status', 'createdAt', 'updatedAt'],
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        cookieAuth: [],
      },
    ],
    tags: [
      { name: 'Clients', description: 'Zarządzanie klientami' },
      { name: 'Contacts', description: 'Zarządzanie kontaktami i notatkami' },
      { name: 'Tasks', description: 'Zarządzanie zadaniami' },
      { name: 'Admin', description: 'Operacje administracyjne (wymaga roli ADMIN)' },
      { name: 'Users', description: 'Zarządzanie użytkownikami i preferencjami' },
      { name: 'Auth', description: 'Autoryzacja i rejestracja' },
      { name: 'Calendar', description: 'Synchronizacja z Google Calendar' },
    ],
  },
  apis: [
    './src/presentation/api/**/*.ts',
    './src/app/api/**/*.ts',
  ],
}

export const swaggerSpec = swaggerJsdoc(options)

