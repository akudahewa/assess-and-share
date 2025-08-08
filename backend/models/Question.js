import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionnaireId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Questionnaire',
    required: [true, 'Questionnaire ID is required']
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category ID is required']
  },
  text: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: [500, 'Question text cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['multiple_choice', 'text', 'rating'],
    default: 'multiple_choice'
  },
  options: {
    type: [{
      value: {
        type: String,
        required: true
      },
      label: {
        type: String,
        required: true
      },
      score: {
        type: Number,
        default: 0
      }
    }],
    validate: {
      validator: function(options) {
        if (this.type === 'multiple_choice' && (!options || options.length < 2)) {
          return false;
        }
        return true;
      },
      message: 'Multiple choice questions must have at least 2 options'
    }
  },
  orderNumber: {
    type: Number,
    required: [true, 'Order number is required'],
    min: [1, 'Order number must be at least 1']
  },
  isRequired: {
    type: Boolean,
    default: true
  },
  settings: {
    allowMultipleAnswers: {
      type: Boolean,
      default: false
    },
    minRating: {
      type: Number,
      default: 1
    },
    maxRating: {
      type: Number,
      default: 5
    },
    ratingLabels: {
      type: [String],
      default: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']
    }
  },
  metadata: {
    averageScore: {
      type: Number,
      default: 0
    },
    responseCount: {
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
questionSchema.index({ questionnaireId: 1, orderNumber: 1 });
questionSchema.index({ categoryId: 1 });
questionSchema.index({ type: 1 });
questionSchema.index({ questionnaireId: 1, categoryId: 1 });

// Compound unique index to ensure unique order within questionnaire
questionSchema.index({ questionnaireId: 1, orderNumber: 1 }, { unique: true });

// Pre-save middleware
questionSchema.pre('save', async function(next) {
  // Validate order number uniqueness within questionnaire
  if (this.isModified('orderNumber') || this.isNew) {
    const existingQuestion = await this.constructor.findOne({
      questionnaireId: this.questionnaireId,
      orderNumber: this.orderNumber,
      _id: { $ne: this._id }
    });
    
    if (existingQuestion) {
      throw new Error('Order number already exists in this questionnaire');
    }
  }
  
  // Validate rating settings
  if (this.type === 'rating') {
    if (this.settings.minRating >= this.settings.maxRating) {
      throw new Error('Min rating must be less than max rating');
    }
    
    const expectedLabels = this.settings.maxRating - this.settings.minRating + 1;
    if (this.settings.ratingLabels.length !== expectedLabels) {
      throw new Error(`Rating labels count must match rating range (${expectedLabels} labels needed)`);
    }
  }
  
  next();
});

// Static method to find questions by questionnaire
questionSchema.statics.findByQuestionnaire = function(questionnaireId) {
  return this.find({ questionnaireId })
    .populate('categoryId', 'name description')
    .sort({ orderNumber: 1 });
};

// Static method to find questions by category
questionSchema.statics.findByCategory = function(categoryId) {
  return this.find({ categoryId }).sort({ orderNumber: 1 });
};

// Static method to get next order number for a questionnaire
questionSchema.statics.getNextOrderNumber = async function(questionnaireId) {
  const lastQuestion = await this.findOne({ questionnaireId })
    .sort({ orderNumber: -1 })
    .select('orderNumber');
  
  return lastQuestion ? lastQuestion.orderNumber + 1 : 1;
};

// Instance method to reorder questions
questionSchema.statics.reorderQuestions = async function(questionnaireId, questionOrders) {
  const bulkOps = questionOrders.map(({ questionId, orderNumber }) => ({
    updateOne: {
      filter: { _id: questionId, questionnaireId },
      update: { orderNumber }
    }
  }));
  
  return this.bulkWrite(bulkOps);
};

// Instance method to update metadata
questionSchema.methods.updateMetadata = async function() {
  // This would typically be called after processing responses
  // Implementation would depend on how responses are stored and processed
  return this.save();
};

const Question = mongoose.model('Question', questionSchema);

export default Question; 