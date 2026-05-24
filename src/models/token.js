import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  token: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['passwordReset'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // Automatically deletes from Mongo after 1 hour (3600 seconds)
  },
});

export default mongoose.model('Token', tokenSchema);
