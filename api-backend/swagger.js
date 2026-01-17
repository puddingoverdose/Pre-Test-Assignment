const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Todo List API',
      version: '1.0.0',
      description: 'A simple Todo API with JWT authentication (Pre-test Assignment)',
      contact: {
        name: 'Ridho Mulia',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      { 
        url: 'https://pre-test-assignment-lefz.vercel.app',
        description: 'Production server' 
      } 
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme. Example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./index.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;