import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: "Let's Chat API",
      version: '1.0.0',
      description: 'A self-hosted, API-based, mobile-friendly chat application',
      contact: {
        name: "Let's Chat Team",
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier',
            },
            username: {
              type: 'string',
              description: 'Unique username',
            },
            displayName: {
              type: 'string',
              nullable: true,
              description: 'Optional display name',
            },
            avatarUrl: {
              type: 'string',
              nullable: true,
              description: 'Avatar image URL',
            },
            status: {
              type: 'string',
              enum: ['online', 'offline', 'away', 'busy'],
              description: 'User availability status',
            },
            lastSeen: {
              type: 'string',
              format: 'date-time',
              description: 'Last activity timestamp',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Request success status',
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User',
                },
                token: {
                  type: 'string',
                  description: 'JWT authentication token',
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            conversationId: {
              type: 'string',
              format: 'uuid',
            },
            senderId: {
              type: 'string',
              format: 'uuid',
            },
            content: {
              type: 'string',
            },
            contentType: {
              type: 'string',
              enum: ['text', 'image', 'file', 'system'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Connection: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            requesterId: {
              type: 'string',
              format: 'uuid',
            },
            addresseeId: {
              type: 'string',
              format: 'uuid',
            },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'declined', 'blocked'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        File: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            fileName: {
              type: 'string',
            },
            filePath: {
              type: 'string',
            },
            fileSize: {
              type: 'integer',
            },
            mimeType: {
              type: 'string',
            },
            uploadedBy: {
              type: 'string',
              format: 'uuid',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

export { specs };
