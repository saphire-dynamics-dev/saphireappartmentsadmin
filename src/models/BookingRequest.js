import mongoose from 'mongoose';

const bookingRequestSchema = new mongoose.Schema({
  // Property Information
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Apartment',
    required: true
  },
  propertyTitle: {
    type: String,
    required: true
  },
  propertyLocation: {
    type: String,
    required: true
  },
  
  // Guest Information
  guestDetails: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    nin: {
      type: String,
      trim: true,
      maxlength: 11
    },
    ninImage: {
      url: {
        type: String,
        trim: true
      },
      publicId: {
        type: String,
        trim: true
      }
    }
  },

  // Emergency Contact Information
  emergencyContact: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    relationship: {
      type: String,
      required: true,
      trim: true
    }
  },

  // Booking Details
  bookingDetails: {
    checkInDate: {
      type: Date,
      required: true
    },
    checkOutDate: {
      type: Date,
      required: true
    },
    numberOfGuests: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    numberOfNights: {
      type: Number,
      required: true,
      min: 1
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    baseAmount: {
      type: Number,
      min: 0
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    discountCode: {
      type: String,
      trim: true,
      uppercase: true
    }
  },
  
  // Request Status
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Converted'],
    default: 'Pending'
  },
  
  // Admin Notes
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Response Details
  responseDate: {
    type: Date
  },
  respondedBy: {
    type: String,
    trim: true
  },
  
  // Special Requests
  specialRequests: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Source tracking
  source: {
    type: String,
    enum: ['Website', 'Phone', 'Email', 'WhatsApp', 'Walk-in'],
    default: 'Website'
  },
  
  // Conversion tracking
  convertedToTenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant'
  },
  
  // Discount Code Tracking
  discountCodeUsed: {
    type: Boolean,
    default: false
  },
  discountCodeDetails: {
    code: {
      type: String,
      trim: true,
      uppercase: true
    },
    description: {
      type: String,
      trim: true
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed']
    },
    discountValue: {
      type: Number,
      min: 0
    },
    discountAmount: {
      type: Number,
      min: 0
    },
    originalAmount: {
      type: Number,
      min: 0
    },
    finalAmount: {
      type: Number,
      min: 0
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  },

  // Communication logs
  communications: [{
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['Email', 'Phone', 'WhatsApp', 'SMS', 'Note'],
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    sentBy: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true
});

// Virtual for guest full name
bookingRequestSchema.virtual('guestFullName').get(function() {
  return `${this.guestDetails.firstName} ${this.guestDetails.lastName}`;
});

// Virtual for booking duration
bookingRequestSchema.virtual('bookingDuration').get(function() {
  if (this.bookingDetails.checkInDate && this.bookingDetails.checkOutDate) {
    const diffTime = this.bookingDetails.checkOutDate - this.bookingDetails.checkInDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for days until check-in
bookingRequestSchema.virtual('daysUntilCheckIn').get(function() {
  if (this.bookingDetails.checkInDate) {
    const diffTime = this.bookingDetails.checkInDate - new Date();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for discount savings
bookingRequestSchema.virtual('totalSavings').get(function() {
  if (this.discountCodeUsed && this.discountCodeDetails) {
    return this.discountCodeDetails.discountAmount || 0;
  }
  return 0;
});

// Virtual for discount percentage (if applicable)
bookingRequestSchema.virtual('discountPercentage').get(function() {
  if (this.discountCodeUsed && this.discountCodeDetails && this.discountCodeDetails.discountType === 'percentage') {
    return this.discountCodeDetails.discountValue;
  }
  return 0;
});

// Static method to get pending requests count
bookingRequestSchema.statics.getPendingCount = async function() {
  return await this.countDocuments({ status: 'Pending' });
};

// Static method to get requests by status
bookingRequestSchema.statics.getByStatus = async function(status, limit = 50) {
  return await this.find({ status })
    .populate('property', 'title location images')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get recent requests
bookingRequestSchema.statics.getRecent = async function(days = 7, limit = 20) {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);
  
  return await this.find({ 
    createdAt: { $gte: dateFrom } 
  })
    .populate('property', 'title location images')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get discount code usage statistics
bookingRequestSchema.statics.getDiscountStats = async function(timeframe = {}) {
  const pipeline = [];
  
  // Add time filter if provided
  if (timeframe.from || timeframe.to) {
    const matchConditions = {};
    if (timeframe.from) matchConditions.createdAt = { $gte: new Date(timeframe.from) };
    if (timeframe.to) matchConditions.createdAt = { ...matchConditions.createdAt, $lte: new Date(timeframe.to) };
    pipeline.push({ $match: matchConditions });
  }

  pipeline.push({
    $group: {
      _id: null,
      totalBookings: { $sum: 1 },
      bookingsWithDiscount: { $sum: { $cond: ['$discountCodeUsed', 1, 0] } },
      totalSavings: { $sum: { $cond: ['$discountCodeUsed', '$discountCodeDetails.discountAmount', 0] } },
      avgDiscountAmount: { $avg: { $cond: ['$discountCodeUsed', '$discountCodeDetails.discountAmount', null] } }
    }
  });

  const stats = await this.aggregate(pipeline);
  return stats.length > 0 ? stats[0] : {
    totalBookings: 0,
    bookingsWithDiscount: 0,
    totalSavings: 0,
    avgDiscountAmount: 0
  };
};

// Static method to get most used discount codes
bookingRequestSchema.statics.getTopDiscountCodes = async function(limit = 10, timeframe = {}) {
  const pipeline = [
    { $match: { discountCodeUsed: true } }
  ];

  // Add time filter if provided
  if (timeframe.from || timeframe.to) {
    const matchConditions = {};
    if (timeframe.from) matchConditions.createdAt = { $gte: new Date(timeframe.from) };
    if (timeframe.to) matchConditions.createdAt = { ...matchConditions.createdAt, $lte: new Date(timeframe.to) };
    pipeline.push({ $match: matchConditions });
  }

  pipeline.push(
    {
      $group: {
        _id: '$discountCodeDetails.code',
        usageCount: { $sum: 1 },
        totalSavings: { $sum: '$discountCodeDetails.discountAmount' },
        avgSavings: { $avg: '$discountCodeDetails.discountAmount' },
        discountType: { $first: '$discountCodeDetails.discountType' },
        discountValue: { $first: '$discountCodeDetails.discountValue' }
      }
    },
    { $sort: { usageCount: -1 } },
    { $limit: limit }
  );

  return await this.aggregate(pipeline);
};

// Method to add communication log
bookingRequestSchema.methods.addCommunication = function(type, message, sentBy = 'System') {
  this.communications.push({
    type,
    message,
    sentBy,
    date: new Date()
  });
  // Don't save here - let the caller handle saving
  return this;
};

// Method to update status
bookingRequestSchema.methods.updateStatus = async function(newStatus, adminNotes = '', respondedBy = '') {
  // Use a simple lock mechanism instead of checking $__.saving
  if (this._isUpdating) {
    // Wait a short time and try again
    await new Promise(resolve => setTimeout(resolve, 100));
    if (this._isUpdating) {
      throw new Error('Document is currently being updated. Please try again.');
    }
  }

  try {
    this._isUpdating = true;
    
    this.status = newStatus;
    this.responseDate = new Date();
    if (adminNotes) this.adminNotes = adminNotes;
    if (respondedBy) this.respondedBy = respondedBy;
    
    // Add communication log without saving
    this.addCommunication('Note', `Status changed to ${newStatus}. ${adminNotes}`, respondedBy);
    
    // Save once with all changes
    const result = await this.save();
    return result;
  } finally {
    this._isUpdating = false;
  }
};

// Method to convert booking request to tenant
bookingRequestSchema.methods.convertToTenant = async function(tenantData = {}) {
  const Tenant = require('./Tenant').default;
  
  // Check if already converted
  if (this.convertedToTenant) {
    return await Tenant.findById(this.convertedToTenant);
  }

  // Create tenant record
  const tenant = new Tenant({
    firstName: this.guestDetails.firstName,
    lastName: this.guestDetails.lastName,
    email: this.guestDetails.email,
    phone: this.guestDetails.phone,
    apartment: this.property,
    stayDetails: {
      checkInDate: this.bookingDetails.checkInDate,
      checkOutDate: this.bookingDetails.checkOutDate,
      numberOfGuests: this.bookingDetails.numberOfGuests,
      numberOfNights: this.bookingDetails.numberOfNights,
      totalAmount: this.bookingDetails.totalAmount,
      pricePerNight: this.bookingDetails.pricePerNight
    },
    paymentDetails: {
      paymentMethod: 'Online Payment',
      paymentStatus: 'Paid',
      amountPaid: this.bookingDetails.totalAmount,
      paymentDate: new Date()
    },
    status: 'Confirmed',
    emergencyContact: tenantData.emergencyContact || {
      name: 'Emergency Contact',
      phone: this.guestDetails.phone,
      relationship: 'Self'
    },
    ...tenantData
  });

  await tenant.save();

  // Update booking request
  this.convertedToTenant = tenant._id;
  this.status = 'Converted';
  await this.save();

  return tenant;
};

// Pre-save middleware to calculate number of nights
bookingRequestSchema.pre('save', function(next) {
  if (this.bookingDetails.checkInDate && this.bookingDetails.checkOutDate) {
    const diffTime = this.bookingDetails.checkOutDate - this.bookingDetails.checkInDate;
    this.bookingDetails.numberOfNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  next();
});

// Index for better query performance
bookingRequestSchema.index({ status: 1, createdAt: -1 });
bookingRequestSchema.index({ property: 1, 'bookingDetails.checkInDate': 1 });
bookingRequestSchema.index({ 'guestDetails.email': 1 });
bookingRequestSchema.index({ discountCodeUsed: 1, createdAt: -1 });
bookingRequestSchema.index({ 'discountCodeDetails.code': 1 });

export default mongoose.models.BookingRequest || mongoose.model('BookingRequest', bookingRequestSchema);
