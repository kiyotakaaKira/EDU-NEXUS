const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['Student', 'Subject Teacher', 'Mentor', 'HOD', 'Principal', 'Chairman'] },
  name: { type: String, required: true },
  department: { type: String, required: true },
  studentId: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
