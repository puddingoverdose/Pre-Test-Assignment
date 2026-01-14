
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',                    // Current stable version (3.1 exists but 3.0 is still the safest choice)
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
        url: 'http://localhost:3000',   // change to your production URL later
        description: 'Development server',
      },
      { url: 'https://vercel.com/ridho-mulias-projects/pre-test-assignment', description: 'Production' } 
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme.',
        },
      },
    },
  },
  apis: ['./index.js'],   

};

const specs = swaggerJsdoc(options);

module.exports = specs;