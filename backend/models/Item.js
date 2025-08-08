import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['electronics', 'clothing', 'books', 'home', 'sports', 'other']
  },
  inStock: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  imageUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v) || v === '';
      },
      message: 'Image URL must be a valid HTTP/HTTPS URL'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
itemSchema.index({ name: 'text', description: 'text' });
itemSchema.index({ category: 1 });
itemSchema.index({ inStock: 1 });

// Virtual for formatted price
itemSchema.virtual('formattedPrice').get(function() {
  return `$${this.price.toFixed(2)}`;
});

// Pre-save middleware
itemSchema.pre('save', function(next) {
  // Convert name to title case
  if (this.name) {
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1).toLowerCase();
  }
  next();
});

// Static method to find items by category
itemSchema.statics.findByCategory = function(category) {
  return this.find({ category: category.toLowerCase() });
};

// Static method to find items in stock
itemSchema.statics.findInStock = function() {
  return this.find({ inStock: true });
};

// Instance method to toggle stock status
itemSchema.methods.toggleStock = function() {
  this.inStock = !this.inStock;
  return this.save();
};

const Item = mongoose.model('Item', itemSchema);

export default Item; 