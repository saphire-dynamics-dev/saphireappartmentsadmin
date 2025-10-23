import mongoose from 'mongoose';

const apartmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: String,
    required: true
  },
  bedrooms: {
    type: Number,
    required: true,
    min: 0
  },
  bathrooms: {
    type: Number,
    required: true,
    min: 0
  },
  area: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Shortlet', 'Rental', 'Sale']
  },
  description: {
    type: String,
    required: true
  },
  features: [{
    type: String
  }],
  images: [{
    type: String
  }],
  amenities: [{
    type: String
  }],
  rules: [{
    type: String
  }],
  contact: {
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    whatsapp: {
      type: String,
      required: true
    }
  },
  // Bank Account Details
  bankDetails: {
    bankName: {
      type: String,
      required: true, // Restored to true after migration
      trim: true
    },
    accountNumber: {
      type: String,
      required: true, // Restored to true after migration
      trim: true,
      validate: {
        validator: function(v) {
          return /^\d{10}$/.test(v); // Nigerian bank account numbers are 10 digits
        },
        message: 'Account number must be exactly 10 digits'
      }
    },
    accountName: {
      type: String,
      required: true, // Restored to true after migration
      trim: true
    }
  },
  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Maintenance'],
    default: 'Available'
  },
  currentTenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null
  }
}, {
  timestamps: true
});

// Virtual for formatted bank details display
apartmentSchema.virtual('formattedBankDetails').get(function() {
  if (!this.bankDetails) return '';
  return `${this.bankDetails.bankName} - ${this.bankDetails.accountNumber} (${this.bankDetails.accountName})`;
});

// Static method to get apartments by bank
apartmentSchema.statics.getByBank = async function(bankName) {
  return await this.find({ 'bankDetails.bankName': bankName })
    .sort({ 'bankDetails.accountName': 1 });
};

// Method to update bank details
apartmentSchema.methods.updateBankDetails = function(bankName, accountNumber, accountName) {
  this.bankDetails = {
    bankName: bankName.trim(),
    accountNumber: accountNumber.trim(),
    accountName: accountName.trim()
  };
  return this.save();
};

export default mongoose.models.Apartment || mongoose.model('Apartment', apartmentSchema);
