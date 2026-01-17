const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const app = express();

const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger');   // or './swagger.js' depending on location

// Middleware
app.use(cors({
  origin: [
    'https://pre-test-assignment.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json());

// In-memory storage
const users = [];
const todos = [];

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'PFTsE+FsLeg03jgzsM7yQCZt1JuGMZPqZgpGk80tlOA=';
const JWT_EXPIRE = '24h';


// Middleware: Auth

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Routes: Root
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Todo List API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login'
      },
      todos: {
        getAll: 'GET /api/todos',
        getOne: 'GET /api/todos/:id',
        create: 'POST /api/todos',
        update: 'PUT /api/todos/:id',
        delete: 'DELETE /api/todos/:id'
      }
    },
    documentation: 'https://github.com/yourusername/todo-api-backend'
  });
});


// Routes: Authentication

// Register
app.post(
  '/api/auth/register',
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { username, email, password } = req.body;

      const userExists = users.find(u => u.email === email || u.username === username);
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'User already exists'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = {
        id: users.length + 1,
        username,
        email,
        password: hashedPassword,
        createdAt: new Date()
      };

      users.push(user);

      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRE }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          },
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);

// Login
app.post(
  '/api/auth/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      const user = users.find(u => u.email === email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRE }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          },
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);


// Routes: Todos

// Get all todos
app.get('/api/todos', authMiddleware, (req, res) => {
  try {
    const userTodos = todos.filter(todo => todo.userId === req.user.id);
    res.json({
      success: true,
      count: userTodos.length,
      data: userTodos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get single todo
app.get('/api/todos/:id', authMiddleware, (req, res) => {
  try {
    const todo = todos.find(
      t => t.id === parseInt(req.params.id) && t.userId === req.user.id
    );

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    res.json({
      success: true,
      data: todo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Create todo
app.post(
  '/api/todos',
  [
    authMiddleware,
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('completed').optional().isBoolean().withMessage('Completed must be a boolean')
  ],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { title, description, completed } = req.body;

      const todo = {
        id: todos.length + 1,
        userId: req.user.id,
        title,
        description: description || '',
        completed: completed || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      todos.push(todo);

      res.status(201).json({
        success: true,
        message: 'Todo created successfully',
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);

// Update todo
app.put(
  '/api/todos/:id',
  [
    authMiddleware,
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim(),
    body('completed').optional().isBoolean().withMessage('Completed must be a boolean')
  ],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const todoIndex = todos.findIndex(
        t => t.id === parseInt(req.params.id) && t.userId === req.user.id
      );

      if (todoIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }

      const { title, description, completed } = req.body;

      if (title !== undefined) todos[todoIndex].title = title;
      if (description !== undefined) todos[todoIndex].description = description;
      if (completed !== undefined) todos[todoIndex].completed = completed;
      todos[todoIndex].updatedAt = new Date();

      res.json({
        success: true,
        message: 'Todo updated successfully',
        data: todos[todoIndex]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);

// Delete todo
app.delete('/api/todos/:id', authMiddleware, (req, res) => {
  try {
    const todoIndex = todos.findIndex(
      t => t.id === parseInt(req.params.id) && t.userId === req.user.id
    );

    if (todoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    todos.splice(todoIndex, 1);

    res.json({
      success: true,
      message: 'Todo deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// SwaggerAPI stuff
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,                   
  customCss: '.swagger-ui .topbar { background-color: #1a1a2e; }', 
  customSiteTitle: 'Todo API Docs',
}));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Export for Vercel
module.exports = app;

// local development
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`   Also try: http://127.0.0.1:${PORT}`);
  });
}