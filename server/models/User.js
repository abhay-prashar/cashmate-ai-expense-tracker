const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  
  cachedInsights: {
    type: String,
    default: '' 
  },
  insightsLastGenerated: {
    type: Date,
    default: null
  }

}, {
  timestamps: true 
});

const User = mongoose.model('User', userSchema);
module.exports = User;

