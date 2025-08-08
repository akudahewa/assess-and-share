import mongoose from 'mongoose';

const questionnaireSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Questionnaire title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String, // User ID or email
    required: [true, 'Creator information is required']
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    validate: {
      validator: function(v) {
        return mongoose.Types.ObjectId.isValid(v);
      },
      message: 'Invalid category ID'
    }
  }],
  settings: {
    allowAnonymous: {
      type: Boolean,
      default: false
    },
    requireEmail: {
      type: Boolean,
      default: true
    },
    showResults: {
      type: Boolean,
      default: true
    },
    maxAttempts: {
      type: Number,
      default: 1,
      min: [1, 'Max attempts must be at least 1']
    }
  },
  metadata: {
    estimatedTime: {
      type: Number, // in minutes
      default: 10
    },
    totalQuestions: {
      type: Number,
      default: 0
    },
    categories: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
questionnaireSchema.index({ title: 'text', description: 'text' });
questionnaireSchema.index({ isActive: 1 });
questionnaireSchema.index({ createdBy: 1 });
questionnaireSchema.index({ createdAt: -1 });

// Virtual for response count
questionnaireSchema.virtual('responseCount', {
  ref: 'UserResponse',
  localField: '_id',
  foreignField: 'questionnaireId',
  count: true
});

// Pre-save middleware
questionnaireSchema.pre('save', function(next) {
  // Update metadata when questionnaire is modified
  if (this.isModified('title')) {
    this.title = this.title.charAt(0).toUpperCase() + this.title.slice(1);
  }
  next();
});

// Static method to find active questionnaires
questionnaireSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ createdAt: -1 });
};

// Static method to find questionnaires by creator
questionnaireSchema.statics.findByCreator = function(createdBy) {
  return this.find({ createdBy }).sort({ createdAt: -1 });
};

// Instance method to activate questionnaire
questionnaireSchema.methods.activate = async function() {
  // First deactivate all questionnaires except this one
  const result = await this.constructor.updateMany(
    { _id: { $ne: this._id } }, 
    { isActive: false }
  );
  
  console.log(`Deactivated ${result.modifiedCount} questionnaires`);
  
  // Then activate this questionnaire
  this.isActive = true;
  return this.save();
};

// Instance method to deactivate questionnaire
questionnaireSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Instance method to update metadata
questionnaireSchema.methods.updateMetadata = async function() {
  const Question = mongoose.model('Question');
  
  const questionCount = await Question.countDocuments({ questionnaireId: this._id });
  const categoryCount = this.categories ? this.categories.length : 0;
  
  this.metadata.totalQuestions = questionCount;
  this.metadata.categories = categoryCount;
  
  return this.save();
};

const Questionnaire = mongoose.model('Questionnaire', questionnaireSchema);

export default Questionnaire; 