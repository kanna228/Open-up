const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',       // Ссылка на коллекцию Users
    required: true
  },
  title: {
    type: String,
    required: true
  },
  main_info: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  media: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Post', postSchema);
