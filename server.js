const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
require('dotenv').config();

// Import routes and models
const dataRoutes = require('./routes/dataRoutes');
const removedMedicinesRoute = require('./routes/removedMedicines');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your_secret_key';
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/your_database_name';

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connection successful!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Mount Routes
app.use('/api', authRoutes); // <-- Register/login routes
app.use('/api', dataRoutes); // <-- API routes
app.use('/api/removed-medicines', removedMedicinesRoute); // <-- Removed items routes

// Protected route example
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'This is a protected route' });
});

// Static page routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/removed-medicines', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'removedMedicines.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
