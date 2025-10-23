import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  // Transaction Reference
  reference: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Paystack Details
  paystackReference: {
    type: String,
    trim: true
  },
  accessCode: {
    type: String,
    trim: true
  },
  
  // Amount Details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'NGN',
    enum: ['NGN', 'USD', 'GHS', 'ZAR']
  },
  
  // Customer Information
  customer: {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
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
    phone: {
      type: String,
      trim: true
    }
  },
  
  // Transaction Status
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'abandoned', 'cancelled'],
    default: 'pending'
  },
  
  // Payment Gateway Response
  gatewayResponse: {
    type: String,
    trim: true
  },
  paidAt: {
    type: Date
  },
  
  // Related Records
  bookingRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookingRequest'
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant'
  },
  
  // Transaction Type
  type: {
    type: String,
    enum: ['booking_payment', 'deposit', 'rent', 'fee', 'refund'],
    required: true
  },
  
  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'ussd', 'qr', 'mobile_money'],
    trim: true
  },
  
  // Authorization Details (for recurring payments)
  authorization: {
    authorizationCode: String,
    bin: String,
    last4: String,
    expMonth: String,
    expYear: String,
    channel: String,
    cardType: String,
    bank: String,
    countryCode: String,
    brand: String,
    reusable: Boolean
  },
  
  // Metadata
  metadata: {
    propertyId: String,
    propertyTitle: String,
    checkInDate: Date,
    checkOutDate: Date,
    numberOfNights: Number,
    numberOfGuests: Number,
    customFields: mongoose.Schema.Types.Mixed
  },
  
  // Fees
  fees: {
    paystackFee: {
      type: Number,
      default: 0
    },
    applicationFee: {
      type: Number,
      default: 0
    }
  },
  
  // Refund Information
  refund: {
    refunded: {
      type: Boolean,
      default: false
    },
    refundAmount: {
      type: Number,
      default: 0
    },
    refundDate: Date,
    refundReason: String
  },
  
  // IP and User Agent for security
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Virtual for customer full name
transactionSchema.virtual('customerFullName').get(function() {
  return `${this.customer.firstName} ${this.customer.lastName}`;
});

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: this.currency || 'NGN'
  }).format(this.amount / 100); // Paystack uses kobo
});

// Static method to generate unique reference
transactionSchema.statics.generateReference = function() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8);
  return `SA_${timestamp}_${random}`.toUpperCase();
};

// Static method to get transactions by status
transactionSchema.statics.getByStatus = async function(status, limit = 50) {
  return await this.find({ status })
    .populate('bookingRequest', 'propertyTitle guestDetails.firstName guestDetails.lastName')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get customer transactions
transactionSchema.statics.getCustomerTransactions = async function(email, limit = 20) {
  return await this.find({ 'customer.email': email })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to calculate total revenue
transactionSchema.statics.getTotalRevenue = async function(startDate, endDate) {
  const pipeline = [
    {
      $match: {
        status: 'success',
        paidAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalTransactions: { $sum: 1 }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || { totalRevenue: 0, totalTransactions: 0 };
};

// Static method to delete transactions by booking request
transactionSchema.statics.deleteByBookingRequest = async function(bookingRequestId) {
  try {
    const result = await this.deleteMany({ bookingRequest: bookingRequestId });
    return {
      success: true,
      deletedCount: result.deletedCount
    };
  } catch (error) {
    console.error('Error deleting transactions by booking request:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Static method to get transactions by booking request
transactionSchema.statics.getByBookingRequest = async function(bookingRequestId) {
  return await this.find({ bookingRequest: bookingRequestId })
    .sort({ createdAt: -1 });
};

// Method to mark as successful
transactionSchema.methods.markAsSuccessful = function(paystackData) {
  this.status = 'success';
  this.paidAt = new Date();
  this.gatewayResponse = paystackData.gateway_response;
  this.paymentMethod = paystackData.channel;
  
  if (paystackData.authorization) {
    this.authorization = {
      authorizationCode: paystackData.authorization.authorization_code,
      bin: paystackData.authorization.bin,
      last4: paystackData.authorization.last4,
      expMonth: paystackData.authorization.exp_month,
      expYear: paystackData.authorization.exp_year,
      channel: paystackData.authorization.channel,
      cardType: paystackData.authorization.card_type,
      bank: paystackData.authorization.bank,
      countryCode: paystackData.authorization.country_code,
      brand: paystackData.authorization.brand,
      reusable: paystackData.authorization.reusable
    };
  }
  
  if (paystackData.fees) {
    this.fees.paystackFee = paystackData.fees;
  }
  
  return this.save();
};

// Method to mark as failed
transactionSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.gatewayResponse = reason;
  return this.save();
};

// Indexes for better performance
transactionSchema.index({ reference: 1 });
transactionSchema.index({ paystackReference: 1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ 'customer.email': 1, createdAt: -1 });
transactionSchema.index({ bookingRequest: 1 });

export default mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
