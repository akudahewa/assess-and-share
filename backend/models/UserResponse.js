import mongoose from 'mongoose';

const userResponseSchema = new mongoose.Schema({
  questionnaireId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Questionnaire',
    required: [true, 'Questionnaire ID is required']
  },
  userName: {
    type: String,
    trim: true,
    maxlength: [100, 'User name cannot exceed 100 characters']
  },
  userEmail: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || v === '';
      },
      message: 'Please provide a valid email address'
    }
  },
  responses: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: [true, 'Responses are required']
  },
  scores: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'completed'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
userResponseSchema.index({ questionnaireId: 1, completedAt: -1 });
userResponseSchema.index({ userEmail: 1 });
userResponseSchema.index({ status: 1 });

// Static method to find responses by questionnaire
userResponseSchema.statics.findByQuestionnaire = function(questionnaireId) {
  return this.find({ questionnaireId })
    .populate('questionnaireId', 'title')
    .sort({ completedAt: -1 });
};

// Static method to find responses by user email
userResponseSchema.statics.findByUserEmail = function(userEmail) {
  return this.find({ userEmail })
    .populate('questionnaireId', 'title description')
    .sort({ completedAt: -1 });
};

const UserResponse = mongoose.model('UserResponse', userResponseSchema);

export default UserResponse; 