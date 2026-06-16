const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userName: { type: String, required: true, unique: true },
  userPassword: { type: String, required: true },
  userImage: { type: String, default: 'default.png' }
});

module.exports = mongoose.model('User', userSchema);