import mongoose from 'mongoose';

const maintenanceRequestSchema = new mongoose.Schema({
  // Property Information
  apartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Apartment',
    required: true
  },
  apartmentTitle: {
    type: String,
    required: true
  },
  apartmentLocation: {
    type: String,
    required: true
  },
  
  // Requester Information
  requester: {
    type: {
      type: String,
      enum: ['Tenant', 'Admin', 'Property Manager'],
      required: true
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant'
    },
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
    email: {
      type: String,
      lowercase: true,
      trim: true
    }
  },
  
  // Request Details
  issueCategory: {
    type: String,
    enum: [
      'Plumbing',
      'Electrical',
      'HVAC',
      'Appliances',
      'Cleaning',
      'Repairs',
      'Painting',
      'Pest Control',
      'Security',
      'Other'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Emergency'],
    default: 'Medium'
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Images
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    description: {
      type: String,
      trim: true
    }
  }],
  
  // Access Information
  accessDetails: {
    preferredDate: {
      type: Date
    },
    preferredTime: {
      type: String,
      enum: ['Morning (8AM-12PM)', 'Afternoon (12PM-5PM)', 'Evening (5PM-8PM)', 'Anytime']
    },
    keyLocation: {
      type: String,
      trim: true
    },
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: 500
    },
    contactForAccess: {
      type: Boolean,
      default: true
    }
  },
  
  // Status Management
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled', 'On Hold'],
    default: 'Pending'
  },
  
  // Assignment
  assignedTo: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    company: {
      type: String,
      trim: true
    },
    specialization: {
      type: String,
      trim: true
    }
  },
  
  // Scheduling
  scheduledDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  
  // Cost Information
  estimatedCost: {
    type: Number,
    min: 0
  },
  actualCost: {
    type: Number,
    min: 0
  },
  
  // Admin Notes
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Resolution
  resolution: {
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    completionImages: [{
      url: {
        type: String,
        required: true
      },
      publicId: {
        type: String,
        required: true
      },
      description: {
        type: String,
        trim: true
      }
    }],
    completedBy: {
      type: String,
      trim: true
    },
    warranty: {
      period: {
        type: Number, // in months
        min: 0
      },
      details: {
        type: String,
        trim: true
      }
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
      enum: ['Email', 'Phone', 'WhatsApp', 'SMS', 'Note', 'Visit'],
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
    },
    recipient: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true
});

// Virtual for days since request
maintenanceRequestSchema.virtual('daysSinceRequest').get(function() {
  const diffTime = new Date() - this.createdAt;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for days until scheduled
maintenanceRequestSchema.virtual('daysUntilScheduled').get(function() {
  if (this.scheduledDate) {
    const diffTime = this.scheduledDate - new Date();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Virtual for total cost
maintenanceRequestSchema.virtual('totalCost').get(function() {
  return this.actualCost || this.estimatedCost || 0;
});

// Static method to get requests by status
maintenanceRequestSchema.statics.getByStatus = async function(status, limit = 50) {
  return await this.find({ status })
    .populate('apartment', 'title location')
    .populate('requester.tenant', 'firstName lastName email phone')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get urgent requests
maintenanceRequestSchema.statics.getUrgentRequests = async function() {
  return await this.find({ 
    priority: { $in: ['High', 'Emergency'] },
    status: { $nin: ['Completed', 'Cancelled'] }
  })
    .populate('apartment', 'title location')
    .populate('requester.tenant', 'firstName lastName email phone')
    .sort({ priority: -1, createdAt: -1 });
};

// Static method to get overdue requests
maintenanceRequestSchema.statics.getOverdueRequests = async function() {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  return await this.find({
    createdAt: { $lt: threeDaysAgo },
    status: { $nin: ['Completed', 'Cancelled'] }
  })
    .populate('apartment', 'title location')
    .populate('requester.tenant', 'firstName lastName email phone')
    .sort({ createdAt: 1 });
};

// Method to add communication log
maintenanceRequestSchema.methods.addCommunication = function(type, message, sentBy = 'System', recipient = '') {
  this.communications.push({
    type,
    message,
    sentBy,
    recipient
  });
  return this.save();
};

// Method to update status
maintenanceRequestSchema.methods.updateStatus = function(newStatus, notes = '', updatedBy = '') {
  const oldStatus = this.status;
  this.status = newStatus;
  
  if (notes) this.adminNotes = notes;
  
  // Set completion date if completed
  if (newStatus === 'Completed' && oldStatus !== 'Completed') {
    this.completedDate = new Date();
  }
  
  // Add communication log
  this.addCommunication('Note', `Status changed from ${oldStatus} to ${newStatus}. ${notes}`, updatedBy);
  
  return this.save();
};

// Method to assign technician
maintenanceRequestSchema.methods.assignTechnician = function(technicianInfo, scheduledDate = null, assignedBy = '') {
  this.assignedTo = technicianInfo;
  this.status = 'Assigned';
  if (scheduledDate) this.scheduledDate = scheduledDate;
  
  this.addCommunication(
    'Note', 
    `Assigned to ${technicianInfo.name} (${technicianInfo.company || 'Independent'})${scheduledDate ? ` for ${scheduledDate}` : ''}`, 
    assignedBy
  );
  
  return this.save();
};

// Index for better query performance
maintenanceRequestSchema.index({ status: 1, createdAt: -1 });
maintenanceRequestSchema.index({ apartment: 1, status: 1 });
maintenanceRequestSchema.index({ priority: 1, status: 1 });
maintenanceRequestSchema.index({ 'requester.tenant': 1 });

export default mongoose.models.MaintenanceRequest || mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
