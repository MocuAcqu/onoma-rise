const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  
  viewedChapters: [{ type: String }], 
  likedChapters: [{ type: String }],  
  visitedAbout: { type: Boolean, default: false }, 
  usedTonnetz: { type: Boolean, default: false },  
  quizRecords: [{
    topicId: String,      
    attempts: { type: Number, default: 0 }, 
    passed: { type: Boolean, default: false } 
  }]
});

module.exports = mongoose.model('User', UserSchema);