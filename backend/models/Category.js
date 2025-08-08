import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  iconUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v) || v === '';
      },
      message: 'Icon URL must be a valid HTTP/HTTPS URL'
    }
  },
  questionnaireId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Questionnaire'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
categorySchema.index({ name: 1 });
categorySchema.index({ questionnaireId: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ order: 1 });

// Pre-save middleware to ensure unique names
categorySchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    const existingCategory = await this.constructor.findOne({ 
      name: this.name, 
      _id: { $ne: this._id } 
    });
    if (existingCategory) {
      throw new Error('Category name already exists');
    }
  }
  next();
});

// Static method to find active categories
categorySchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ order: 1 });
};

// Static method to find categories by questionnaire
categorySchema.statics.findByQuestionnaire = function(questionnaireId) {
  return this.find({ questionnaireId, isActive: true }).sort({ order: 1 });
};

// Instance method to deactivate category
categorySchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Instance method to activate category
categorySchema.methods.activate = function() {
  this.isActive = true;
  return this.save();
};

const Category = mongoose.model('Category', categorySchema);

export default Category; 