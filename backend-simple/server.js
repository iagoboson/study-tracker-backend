const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { initializeDB, users: userDB, studySessions: sessionDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize database on startup
initializeDB();

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Study Tracker API - Simple Version with Database',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Study Tracker API is running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Helper function to hash passwords
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Helper function to generate simple tokens
const generateToken = (userId) => {
  return crypto.randomBytes(32).toString('hex');
};

// Helper function to verify token
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }

  const allUsers = await userDB.getAll();
  const user = allUsers.find(u => u.token === token);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }

  req.user = user;
  next();
};

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await userDB.getByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    const newUser = {
      name,
      email,
      password: hashPassword(password),
      token: generateToken()
    };

    const createdUser = await userDB.create(newUser);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email
        },
        token: createdUser.token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const user = await userDB.getByEmail(email);
    if (!user || user.password !== hashPassword(password)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate new token
    const updatedUser = await userDB.update(user.id, { token: generateToken() });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email
        },
        token: updatedUser.token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.get('/api/auth/me', verifyToken, (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      }
    }
  });
});

// Password recovery endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório'
      });
    }

    const user = await userDB.getByEmail(email);
    if (!user) {
      // Por segurança, sempre retornamos sucesso mesmo se o usuário não existir
      return res.json({
        success: true,
        message: 'Se o email existir em nossa base, você receberá instruções de recuperação.'
      });
    }

    // Por enquanto, apenas simular o envio de email
    // Em produção, aqui você enviaria um email real com um token de recuperação
    console.log(`Password recovery requested for user: ${user.email} (${user.name})`);
    console.log(`Recovery would be sent to: ${email}`);
    
    // Simular delay de envio de email
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.json({
      success: true,
      message: 'Instruções de recuperação de senha foram enviadas para seu email!'
    });

    // TODO: Implementar envio real de email com token de recuperação
    // - Gerar token temporário
    // - Salvar token com timestamp de expiração 
    // - Enviar email com link de recuperação
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Study Sessions endpoints
app.get('/api/study-sessions', verifyToken, async (req, res) => {
  try {
    const userSessions = await sessionDB.getByUserId(req.user.id);
    
    console.log(`User ${req.user.id} (${req.user.email}) requesting sessions. Found ${userSessions.length} sessions.`);
    
    res.json({
      success: true,
      data: userSessions
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/study-sessions', verifyToken, async (req, res) => {
  try {
    const { date, duration, notes } = req.body;
    
    if (!date || !duration) {
      return res.status(400).json({
        success: false,
        error: 'Date and duration are required'
      });
    }

    const newSession = {
      userId: req.user.id,
      date,
      duration: parseInt(duration),
      notes: notes || ''
    };

    const createdSession = await sessionDB.create(newSession);

    res.status(201).json({
      success: true,
      data: createdSession
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.put('/api/study-sessions/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, duration, notes } = req.body;

    const session = await sessionDB.getById(id);
    if (!session || session.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        error: 'Study session not found'
      });
    }

    const updates = {};
    if (date) updates.date = date;
    if (duration) updates.duration = parseInt(duration);
    if (notes !== undefined) updates.notes = notes;

    const updatedSession = await sessionDB.update(id, updates);

    res.json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.delete('/api/study-sessions/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await sessionDB.getById(id);
    if (!session || session.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        error: 'Study session not found'
      });
    }

    const deletedSession = await sessionDB.delete(id);

    res.json({
      success: true,
      data: deletedSession
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.get('/api/study-sessions/date/:date', verifyToken, async (req, res) => {
  try {
    const { date } = req.params;
    
    const sessionsForDate = await sessionDB.getByDate(req.user.id, date);
    
    res.json({
      success: true,
      data: sessionsForDate
    });
  } catch (error) {
    console.error('Get sessions by date error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.get('/api/study-sessions/stats', verifyToken, async (req, res) => {
  try {
    const userSessions = await sessionDB.getByUserId(req.user.id);
    const totalSessions = userSessions.length;
    const totalDuration = userSessions.reduce((sum, session) => sum + session.duration, 0);
    const averageDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;

    res.json({
      success: true,
      data: {
        totalSessions,
        totalDuration,
        averageDuration
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Study Tracker API (simple) with database running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Root endpoint: http://localhost:${PORT}/`);
  console.log(`📊 Study sessions: http://localhost:${PORT}/api/study-sessions`);
  console.log(`💾 Database file: data.json`);
});

module.exports = app;
