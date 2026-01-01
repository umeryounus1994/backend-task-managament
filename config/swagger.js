const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Note Taking API',
      version: '1.0.0',
      description: 'A comprehensive Note Taking API with versioning, concurrency handling, full-text search, and caching',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
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
            id: {
              type: 'integer'
            },
            email: {
              type: 'string',
              format: 'email'
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
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            password: {
              type: 'string',
              minLength: 6,
              example: 'password123'
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
              example: 'user@example.com'
            },
            password: {
              type: 'string',
              example: 'password123'
            }
          }
        },
        RefreshRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            }
          }
        },
        RegisterResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            message: {
              type: 'string'
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            message: {
              type: 'string'
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User'
                },
                accessToken: {
                  type: 'string'
                },
                refreshToken: {
                  type: 'string'
                }
              }
            }
          }
        },
        AuthResponseData: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User'
            },
            accessToken: {
              type: 'string'
            },
            refreshToken: {
              type: 'string'
            }
          }
        },
        TokenResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            message: {
              type: 'string'
            },
            data: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string'
                },
                refreshToken: {
                  type: 'string'
                }
              }
            }
          }
        },
        TokenResponseData: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string'
            },
            refreshToken: {
              type: 'string'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Validation failed'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  },
                  value: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        Note: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            userId: {
              type: 'integer'
            },
            title: {
              type: 'string'
            },
            content: {
              type: 'string'
            },
            version: {
              type: 'integer'
            },
            isDeleted: {
              type: 'boolean'
            },
            deletedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true
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
        CreateNoteRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title: {
              type: 'string',
              example: 'My First Note'
            },
            content: {
              type: 'string',
              example: 'This is the content of my note'
            }
          }
        },
        UpdateNoteRequest: {
          type: 'object',
          required: ['version'],
          properties: {
            title: {
              type: 'string',
              example: 'Updated Note Title'
            },
            content: {
              type: 'string',
              example: 'Updated content'
            },
            version: {
              type: 'integer',
              description: 'Current version number for optimistic locking',
              example: 1
            }
          }
        },
        NoteShare: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            noteId: {
              type: 'integer'
            },
            sharedWithUserId: {
              type: 'integer'
            },
            permission: {
              type: 'string',
              enum: ['read', 'edit']
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
        ShareNoteRequest: {
          type: 'object',
          required: ['sharedWithUserId', 'permission'],
          properties: {
            sharedWithUserId: {
              type: 'integer',
              example: 2
            },
            permission: {
              type: 'string',
              enum: ['read', 'edit'],
              example: 'read'
            }
          }
        },
        UpdateShareRequest: {
          type: 'object',
          required: ['permission'],
          properties: {
            permission: {
              type: 'string',
              enum: ['read', 'edit'],
              example: 'edit'
            }
          }
        },
        NoteAttachment: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            noteId: {
              type: 'integer'
            },
            fileType: {
              type: 'string',
              enum: ['image', 'video', 'pdf', 'other']
            },
            fileName: {
              type: 'string'
            },
            filePath: {
              type: 'string'
            },
            fileSize: {
              type: 'integer'
            },
            mimeType: {
              type: 'string'
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
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad Request - Invalid input or validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError'
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized - Authentication required or invalid token',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Authentication required. Please provide a valid token.'
              }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden - Access denied',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Access denied'
              }
            }
          }
        },
        NotFound: {
          description: 'Not Found - Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Resource not found'
              }
            }
          }
        },
        Conflict: {
          description: 'Conflict - Resource conflict',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Resource already exists'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'An unexpected error occurred'
              }
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './server.js', './controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

const swaggerSetup = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }'
  }));
  
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

module.exports = swaggerSetup;

