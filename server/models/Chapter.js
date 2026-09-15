const mongoose = require('mongoose');

const ChapterSchema = new mongoose.Schema({
  chapterId: {
    type: String,
    required: true,
    unique: true, 
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [{
    type: String, 
  }]
});

module.exports = mongoose.model('Chapter', ChapterSchema);