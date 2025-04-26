const express = require('express');
const path = require('path');

const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dataRoutes = require('./routes/dataRoutes'); // Make sure this path is correct

const app = express();
const PORT = 3000;

// MongoDB connection string (make sure it’s correct for your setup)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });



const mongoURI = 'mongodb+srv://chinadarj:v7OW23GtxR4dignZ@cluster0.fzlceka.mongodb.net/budget?retryWrites=true&w=majority';

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');  // Disable caching
    next();
  });
  

// Connect to MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB connection successful!');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Register routes (Ensure this is correctly registering your route)
app.use('/api', dataRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
