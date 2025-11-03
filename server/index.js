const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transaction');
const aiRoutes = require('./routes/ai');
const receiptRoutes = require('./routes/receipt');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/receipt', receiptRoutes);

// Simple route for the root
app.get('/', (req, res) => {
  res.send('Welcome to the PulseAI API!');
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB!');
    app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
  });