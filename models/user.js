// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  surname: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  user_info: {          
    type: String,
    default: ''
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    default: 'user'
  }
});

module.exports = mongoose.model('User', userSchema);
