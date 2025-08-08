const fs = require('fs-extra');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

// Initialize database with default structure
const initializeDB = async () => {
  try {
    const exists = await fs.pathExists(DB_FILE);
    if (!exists) {
      const defaultData = {
        users: [],
        studySessions: []
      };
      await fs.writeJson(DB_FILE, defaultData, { spaces: 2 });
      console.log('📁 Database initialized');
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
};

// Read all data from database
const readDB = async () => {
  try {
    const data = await fs.readJson(DB_FILE);
    return data;
  } catch (error) {
    console.error('❌ Error reading database:', error);
    return { users: [], studySessions: [] };
  }
};

// Write data to database
const writeDB = async (data) => {
  try {
    await fs.writeJson(DB_FILE, data, { spaces: 2 });
  } catch (error) {
    console.error('❌ Error writing to database:', error);
    throw error;
  }
};

// User operations
const users = {
  // Get all users
  getAll: async () => {
    const data = await readDB();
    return data.users;
  },

  // Get user by ID
  getById: async (id) => {
    const data = await readDB();
    return data.users.find(user => user.id === id);
  },

  // Get user by email
  getByEmail: async (email) => {
    const data = await readDB();
    return data.users.find(user => user.email === email);
  },

  // Create new user
  create: async (userData) => {
    const data = await readDB();
    const newUser = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    data.users.push(newUser);
    await writeDB(data);
    return newUser;
  },

  // Update user
  update: async (id, updates) => {
    const data = await readDB();
    const userIndex = data.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    data.users[userIndex] = {
      ...data.users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await writeDB(data);
    return data.users[userIndex];
  }
};

// Study session operations
const studySessions = {
  // Get all sessions for a user
  getByUserId: async (userId) => {
    const data = await readDB();
    return data.studySessions.filter(session => session.userId === userId);
  },

  // Get session by ID
  getById: async (id) => {
    const data = await readDB();
    return data.studySessions.find(session => session.id === id);
  },

  // Create new session
  create: async (sessionData) => {
    const data = await readDB();
    const newSession = {
      ...sessionData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    data.studySessions.push(newSession);
    await writeDB(data);
    return newSession;
  },

  // Update session
  update: async (id, updates) => {
    const data = await readDB();
    const sessionIndex = data.studySessions.findIndex(session => session.id === id);
    if (sessionIndex === -1) return null;
    
    data.studySessions[sessionIndex] = {
      ...data.studySessions[sessionIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await writeDB(data);
    return data.studySessions[sessionIndex];
  },

  // Delete session
  delete: async (id) => {
    const data = await readDB();
    const sessionIndex = data.studySessions.findIndex(session => session.id === id);
    if (sessionIndex === -1) return null;
    
    const deletedSession = data.studySessions.splice(sessionIndex, 1)[0];
    await writeDB(data);
    return deletedSession;
  },

  // Get sessions by date for a user
  getByDate: async (userId, date) => {
    const data = await readDB();
    return data.studySessions.filter(session => 
      session.userId === userId && session.date === date
    );
  }
};

module.exports = {
  initializeDB,
  users,
  studySessions
};
