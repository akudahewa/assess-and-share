import mongoose from 'mongoose';

const scoringRuleSchema = new mongoose.Schema({
  questionnaireId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Questionnaire',
    required: [true, 'Questionnaire ID is required']
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  minPercentage: {
    type: Number,
    required: [true, 'Minimum percentage is required'],
    min: [0, 'Minimum percentage must be at least 0'],
    max: [100, 'Minimum percentage cannot exceed 100']
  },
  maxPercentage: {
    type: Number,
    required: [true, 'Maximum percentage is required'],
    min: [0, 'Maximum percentage must be at least 0'],
    max: [100, 'Maximum percentage cannot exceed 100']
  },
  levelName: {
    type: String,
    required: [true, 'Level name is required'],
    trim: true,
    maxlength: [50, 'Level name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  color: {
    type: String,
    default: '#3B82F6',
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Color must be a valid hex color code'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
scoringRuleSchema.index({ questionnaireId: 1, minPercentage: 1 });
scoringRuleSchema.index({ categoryId: 1 });
scoringRuleSchema.index({ questionnaireId: 1, categoryId: 1 });

// Compound unique index to prevent overlapping ranges
scoringRuleSchema.index(
  { questionnaireId: 1, categoryId: 1, minPercentage: 1, maxPercentage: 1 },
  { unique: true }
);

// Pre-save middleware
scoringRuleSchema.pre('save', function(next) {
  // Validate percentage range
  if (this.minPercentage >= this.maxPercentage) {
    throw new Error('Minimum percentage must be less than maximum percentage');
  }

  // Build category matching condition:
  // - If categoryId is set, only compare with same categoryId
  // - If categoryId is null/undefined, only compare with rules where categoryId is null or not set
  const categoryMatch = (this.categoryId != null)
    ? { categoryId: this.categoryId }
    : { $or: [{ categoryId: null }, { categoryId: { $exists: false } }] };

  // Overlap conditions (range intersection)
  const overlapConditions = [
    {
      minPercentage: { $lte: this.minPercentage },
      maxPercentage: { $gte: this.minPercentage }
    },
    {
      minPercentage: { $lte: this.maxPercentage },
      maxPercentage: { $gte: this.maxPercentage }
    },
    {
      minPercentage: { $gte: this.minPercentage },
      maxPercentage: { $lte: this.maxPercentage }
    }
  ];

  const query = {
    questionnaireId: this.questionnaireId,
    _id: { $ne: this._id },
    $and: [categoryMatch, { $or: overlapConditions }]
  };

  this.constructor.findOne(query)
    .then(existingRule => {
      if (existingRule) {
        throw new Error('Scoring rule ranges cannot overlap');
      }
      next();
    })
    .catch(next);
});

// Ensure overlap validation also runs on findOneAndUpdate
scoringRuleSchema.pre('findOneAndUpdate', async function(next) {
  try {
    const update = this.getUpdate() || {};
    const current = await this.model.findOne(this.getQuery());
    if (!current) return next();

    const questionnaireId = update.questionnaireId ?? current.questionnaireId;
    const categoryId = update.categoryId ?? current.categoryId;
    const minPercentage = update.minPercentage ?? current.minPercentage;
    const maxPercentage = update.maxPercentage ?? current.maxPercentage;

    if (minPercentage >= maxPercentage) {
      throw new Error('Minimum percentage must be less than maximum percentage');
    }

    const categoryMatch = (categoryId != null)
      ? { categoryId }
      : { $or: [{ categoryId: null }, { categoryId: { $exists: false } }] };

    const overlapConditions = [
      { minPercentage: { $lte: minPercentage }, maxPercentage: { $gte: minPercentage } },
      { minPercentage: { $lte: maxPercentage }, maxPercentage: { $gte: maxPercentage } },
      { minPercentage: { $gte: minPercentage }, maxPercentage: { $lte: maxPercentage } }
    ];

    const query = {
      questionnaireId,
      _id: { $ne: current._id },
      $and: [categoryMatch, { $or: overlapConditions }]
    };

    const existingRule = await this.model.findOne(query);
    if (existingRule) {
      throw new Error('Scoring rule ranges cannot overlap');
    }

    next();
  } catch (err) {
    next(err);
  }
});

// Static method to find rules by questionnaire
scoringRuleSchema.statics.findByQuestionnaire = function(questionnaireId) {
  return this.find({ questionnaireId })
    .populate('categoryId', 'name')
    .sort({ minPercentage: 1 });
};

// Static method to find rules by category
scoringRuleSchema.statics.findByCategory = function(categoryId) {
  return this.find({ categoryId }).sort({ minPercentage: 1 });
};

// Static method to get level for a percentage
scoringRuleSchema.statics.getLevelForPercentage = async function(questionnaireId, categoryId, percentage) {
  const rule = await this.findOne({
    questionnaireId,
    categoryId,
    minPercentage: { $lte: percentage },
    maxPercentage: { $gte: percentage }
  });
  
  return rule ? rule.levelName : 'Unknown';
};

// Instance method to check if percentage falls within range
scoringRuleSchema.methods.isInRange = function(percentage) {
  return percentage >= this.minPercentage && percentage <= this.maxPercentage;
};

const ScoringRule = mongoose.model('ScoringRule', scoringRuleSchema);

export default ScoringRule; 