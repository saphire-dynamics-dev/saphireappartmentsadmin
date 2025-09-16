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

export default mongoose.models.Apartment || mongoose.model('Apartment', apartmentSchema);
