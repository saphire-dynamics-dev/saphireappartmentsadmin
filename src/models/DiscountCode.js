import mongoose from 'mongoose';

const discountCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  maxDiscountAmount: {
    type: Number,
    default: null
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  expiryDate: {
    type: Date,
    required: true
  },
  maxUsageCount: {
    type: Number,
    default: 1
  },
  currentUsageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usedBy: [{
    userId: {
      type: String,
      required: true
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    orderId: {
      type: String
    }
  }],
  createdBy: {
    type: String,
    required: true,
    default: 'admin'
  }
}, {
  timestamps: true
});

discountCodeSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

discountCodeSchema.virtual('isFullyUsed').get(function() {
  return this.currentUsageCount >= this.maxUsageCount;
});

discountCodeSchema.virtual('isAvailable').get(function() {
  return this.isActive && !this.isExpired && !this.isFullyUsed;
});

discountCodeSchema.methods.useCode = function(userId, orderId) {
  if (!this.isAvailable) {
    throw new Error('Discount code is not available for use');
  }
  
  this.usedBy.push({
    userId,
    orderId
  });
  this.currentUsageCount += 1;
  
  return this.save();
};

const DiscountCode = mongoose.models.DiscountCode || mongoose.model('DiscountCode', discountCodeSchema);

export default DiscountCode;
