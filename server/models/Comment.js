const mongoose = require('mongoose');
const commentSchema = new mongoose.Schema({
  commentOfPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  commentedUserId: Number,
  commentText: String,
  commentTime: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Comment', commentSchema);