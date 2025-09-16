import mongoose from 'mongoose';

const adminNotificationSchema = new mongoose.Schema({
  // Notification Content
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Notification Type
  type: {
    type: String,
    enum: [
      'booking_request',
      'payment_received',
      'maintenance_request',
      'tenant_checkin',
      'tenant_checkout',
      'booking_approved',
      'booking_rejected',
      'system_alert',
      'general'
    ],
    required: true
  },
  
  // Priority Level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Status
  isRead: {
    type: Boolean,
    default: false
  },
  
  // Related Records
  relatedRecords: {
    bookingRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookingRequest'
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant'
    },
    apartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Apartment'
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    maintenanceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceRequest'
    }
  },
  
  // Action Information
  actionUrl: {
    type: String,
    trim: true
  },
  actionText: {
    type: String,
    trim: true,
    maxlength: 50
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Auto-deletion
  expiresAt: {
    type: Date,
    default: function() {
      // Auto-delete after 30 days
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  },
  
  // Read timestamp
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Virtual for time ago
adminNotificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Static method to create notification
adminNotificationSchema.statics.createNotification = async function(notificationData) {
  try {
    const notification = new this(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Static method to get unread count
adminNotificationSchema.statics.getUnreadCount = async function() {
  return await this.countDocuments({ isRead: false });
};

// Static method to get recent notifications
adminNotificationSchema.statics.getRecent = async function(limit = 20) {
  return await this.find({})
    .populate('relatedRecords.bookingRequest', 'guestDetails propertyTitle')
    .populate('relatedRecords.tenant', 'firstName lastName')
    .populate('relatedRecords.apartment', 'title location')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to mark all as read
adminNotificationSchema.statics.markAllAsRead = async function() {
  return await this.updateMany(
    { isRead: false },
    { 
      isRead: true,
      readAt: new Date()
    }
  );
};

// Method to mark as read
adminNotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create booking request notification
adminNotificationSchema.statics.createBookingRequestNotification = async function(bookingRequest, type = 'booking_request') {
  const titles = {
    'booking_request': 'New Booking Request',
    'booking_approved': 'Booking Request Approved',
    'booking_rejected': 'Booking Request Rejected'
  };
  
  const messages = {
    'booking_request': `New booking request from ${bookingRequest.guestDetails.firstName} ${bookingRequest.guestDetails.lastName} for ${bookingRequest.propertyTitle}`,
    'booking_approved': `Booking request from ${bookingRequest.guestDetails.firstName} ${bookingRequest.guestDetails.lastName} has been approved`,
    'booking_rejected': `Booking request from ${bookingRequest.guestDetails.firstName} ${bookingRequest.guestDetails.lastName} has been rejected`
  };
  
  return await this.createNotification({
    title: titles[type],
    message: messages[type],
    type: type,
    priority: type === 'booking_request' ? 'high' : 'medium',
    relatedRecords: {
      bookingRequest: bookingRequest._id
    },
    actionUrl: `/dashboard/booking-requests`,
    actionText: 'View Request'
  });
};

// Static method to create payment notification
adminNotificationSchema.statics.createPaymentNotification = async function(transaction) {
  return await this.createNotification({
    title: 'Payment Received',
    message: `Payment of ₦${(transaction.amount / 100).toLocaleString()} received from ${transaction.customer.firstName} ${transaction.customer.lastName}`,
    type: 'payment_received',
    priority: 'medium',
    relatedRecords: {
      transaction: transaction._id
    },
    actionUrl: `/dashboard/payments`,
    actionText: 'View Payment'
  });
};

// Static method to create maintenance notification
adminNotificationSchema.statics.createMaintenanceNotification = async function(maintenanceRequest) {
  const priorityMap = {
    'Emergency': 'urgent',
    'High': 'high',
    'Medium': 'medium',
    'Low': 'low'
  };
  
  return await this.createNotification({
    title: 'New Maintenance Request',
    message: `${maintenanceRequest.priority} priority maintenance request: ${maintenanceRequest.title}`,
    type: 'maintenance_request',
    priority: priorityMap[maintenanceRequest.priority] || 'medium',
    relatedRecords: {
      maintenanceRequest: maintenanceRequest._id,
      apartment: maintenanceRequest.apartment
    },
    actionUrl: `/dashboard/maintenance`,
    actionText: 'View Request'
  });
};

// Static method to create tenant notification
adminNotificationSchema.statics.createTenantNotification = async function(tenant, type) {
  const titles = {
    'tenant_checkin': 'Tenant Check-in',
    'tenant_checkout': 'Tenant Check-out'
  };
  
  const messages = {
    'tenant_checkin': `${tenant.firstName} ${tenant.lastName} has checked in`,
    'tenant_checkout': `${tenant.firstName} ${tenant.lastName} has checked out`
  };
  
  return await this.createNotification({
    title: titles[type],
    message: messages[type],
    type: type,
    priority: 'medium',
    relatedRecords: {
      tenant: tenant._id,
      apartment: tenant.apartment
    },
    actionUrl: `/dashboard/tenants`,
    actionText: 'View Tenant'
  });
};

// Index for better performance
adminNotificationSchema.index({ isRead: 1, createdAt: -1 });
adminNotificationSchema.index({ type: 1, createdAt: -1 });
adminNotificationSchema.index({ priority: 1, isRead: 1 });
adminNotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.AdminNotification || mongoose.model('AdminNotification', adminNotificationSchema);
