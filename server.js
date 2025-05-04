const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dataRoutes = require('./routes/dataRoutes'); // Make sure this path is correct
const removedMedicinesRoute = require('./routes/removedMedicines'); // Import new route
const JWT_SECRET = 'your_secret_key';


const app = express();
const PORT = 3000;
app.use(express.json());

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = new User({ username, password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    res.status(400).json({ error: 'User registration failed!' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'Account is inactive. Contact admin.' });
  }

  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};


app.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'This is a protected route' });
});




// MongoDB connection string (make sure it’s correct for your setup)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.get('/removed-medicines', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'removedMedicines.html'));
  });


const mongoURI = 'mongodb+srv://nadeem:fBPgykqU6nU0sh50@cluster0.fzlceka.mongodb.net/budget?retryWrites=true&w=majority';
    

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');  // Disable caching
    next();
  });
  


  mongoose.connect(mongoURI)
      .then(() => {
          console.log('MongoDB connection successful!');
      })
      .catch((err) => {
          console.error('MongoDB connection error:', err);
      });

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Register routes (Ensure this is correctly registering your route)
app.use('/api', dataRoutes);
app.use('/api/removed-medicines', removedMedicinesRoute); // Add new route


// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

