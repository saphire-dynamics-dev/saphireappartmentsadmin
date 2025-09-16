import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
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
  },
  apartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Apartment',
    required: true
  },
  stayDetails: {
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
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0
    }
  },
  paymentDetails: {
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Credit Card', 'Online Payment'],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Partial', 'Refunded'],
      default: 'Pending'
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0
    },
    paymentDate: {
      type: Date
    },
    transactionReference: {
      type: String,
      trim: true
    }
  },
  status: {
    type: String,
    enum: ['Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled', 'No-Show'],
    default: 'Confirmed'
  },
  specialRequests: {
    type: String,
    trim: true,
    maxlength: 500
  },
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
  }
}, {
  timestamps: true
});

// Virtual for full name
tenantSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for stay duration
tenantSchema.virtual('stayDuration').get(function() {
  if (this.stayDetails.checkInDate && this.stayDetails.checkOutDate) {
    const diffTime = this.stayDetails.checkOutDate - this.stayDetails.checkInDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for payment balance
tenantSchema.virtual('paymentBalance').get(function() {
  return this.stayDetails.totalAmount - this.paymentDetails.amountPaid;
});

// Static method to get unavailable dates for an apartment
tenantSchema.statics.getUnavailableDates = async function(apartmentId, excludeBookingId = null) {
  const query = {
    apartment: apartmentId,
    status: { $in: ['Confirmed', 'Checked-In'] }
  };
  
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  
  const bookings = await this.find(query)
    .select('stayDetails.checkInDate stayDetails.checkOutDate')
    .sort({ 'stayDetails.checkInDate': 1 });
  
  const unavailableDates = [];
  const unavailableRanges = [];
  
  bookings.forEach(booking => {
    const checkIn = new Date(booking.stayDetails.checkInDate);
    const checkOut = new Date(booking.stayDetails.checkOutDate);
    
    unavailableRanges.push({
      start: checkIn.toISOString().split('T')[0],
      end: checkOut.toISOString().split('T')[0]
    });
    
    // Generate dates from check-in up to (but NOT including) check-out date
    const currentDate = new Date(checkIn);
    while (currentDate < checkOut) { // Changed from <= to <
      unavailableDates.push(new Date(currentDate).toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });
  
  return {
    dates: [...new Set(unavailableDates)], // Remove duplicates
    ranges: unavailableRanges
  };
};

// Static method to check if dates conflict with existing bookings
tenantSchema.statics.checkDateConflict = async function(apartmentId, checkInDate, checkOutDate, excludeBookingId = null) {
  const query = {
    apartment: apartmentId,
    $or: [
      {
        // New booking starts before existing booking ends AND new booking ends after existing booking starts
        'stayDetails.checkInDate': {
          $lt: new Date(checkOutDate) // Changed from $lte to $lt
        },
        'stayDetails.checkOutDate': {
          $gt: new Date(checkInDate) // Changed from $gte to $gt
        }
      }
    ],
    status: { $in: ['Confirmed', 'Checked-In'] }
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBooking = await this.findOne(query)
    .select('stayDetails.checkInDate stayDetails.checkOutDate firstName lastName');

  return conflictingBooking;
};

// Pre-save middleware to calculate number of nights
tenantSchema.pre('save', function(next) {
  if (this.stayDetails.checkInDate && this.stayDetails.checkOutDate) {
    const diffTime = this.stayDetails.checkOutDate - this.stayDetails.checkInDate;
    this.stayDetails.numberOfNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  next();
});

export default mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);
