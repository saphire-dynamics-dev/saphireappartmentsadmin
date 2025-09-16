'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, User, Calendar, DollarSign, MapPin, Phone, Mail, MessageSquare, UserPlus } from 'lucide-react';
import CustomDropdown from '@/components/ui/CustomDropdown';

export default function BookingRequestDetailsModal({ 
  isOpen, 
  onClose, 
  bookingRequestId, 
  onStatusUpdate,
  onConvertToTenant 
}) {
  const [bookingRequest, setBookingRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConversionForm, setShowConversionForm] = useState(false);
  const [conversionData, setConversionData] = useState({
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    nin: '',
    paymentDetails: {
      paymentMethod: 'Bank Transfer',
      paymentStatus: 'Pending',
      amountPaid: 0
    },
    adminNotes: ''
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  const idTypeOptions = [
    { value: 'National ID', label: 'National ID' },
    { value: 'Passport', label: 'Passport' },
    { value: 'Driver\'s License', label: 'Driver\'s License' },
    { value: 'Voter\'s Card', label: 'Voter\'s Card' }
  ];

  const paymentMethodOptions = [
    { value: 'Cash', label: 'Cash' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Credit Card', label: 'Credit Card' },
    { value: 'Online Payment', label: 'Online Payment' }
  ];

  const paymentStatusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Partial', label: 'Partial Payment' },
    { value: 'Paid', label: 'Fully Paid' }
  ];

  useEffect(() => {
    if (isOpen && bookingRequestId) {
      fetchBookingRequestDetails();
    }
  }, [isOpen, bookingRequestId]);

  const fetchBookingRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/booking-requests/${bookingRequestId}`);
      const data = await response.json();
      
      if (data.success) {
        setBookingRequest(data.data);
        // Initialize security deposit with booking total amount
        setConversionData(prev => ({
          ...prev,
          securityDeposit: data.data.bookingDetails.totalAmount
        }));
      }
    } catch (error) {
      console.error('Error fetching booking request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus, notes = '') => {
    try {
      const updateData = { 
        status: newStatus,
        adminNotes: notes
      };
      
      // Add rejection reason if rejecting
      if (newStatus === 'Rejected' && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
      
      const response = await fetch(`/api/booking-requests/${bookingRequestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      if (data.success) {
        setBookingRequest(data.data);
        onStatusUpdate?.(data.data);
        setShowRejectionForm(false);
        setRejectionReason('');
        
        // Show success message
        if (newStatus === 'Approved') {
          alert('Booking request approved! An email notification has been sent to the guest.');
        } else if (newStatus === 'Rejected') {
          alert('Booking request rejected. An email notification has been sent to the guest.');
        }
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const handleConvertToTenant = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/booking-requests/${bookingRequestId}/convert-to-tenant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversionData)
      });

      const data = await response.json();
      if (data.success) {
        alert('Booking request successfully converted to tenant!');
        await handleStatusUpdate('Converted');
        onConvertToTenant?.(data.data);
        setShowConversionForm(false);
        onClose();
      } else {
        alert(data.error || 'Failed to convert to tenant');
      }
    } catch (error) {
      console.error('Error converting to tenant:', error);
      alert('Error converting to tenant');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Converted': 'bg-blue-100 text-blue-800',
      'Cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm min-h-screen overflow-y-auto bg-opacity-50 flex items-center justify-center z-50 p-4 pt-30">
      <div className="bg-white rounded-lg max-w-4xl w-full  flex flex-col">
        {/* Header - Fixed */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            Booking Request Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading details...</p>
            </div>
          ) : bookingRequest ? (
            <div className="p-6 space-y-6">
              {/* Status and Actions */}
              <div className="flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bookingRequest.status)}`}>
                  {bookingRequest.status}
                </span>
                <div className="flex gap-2">
                  {bookingRequest.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate('Approved')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setShowRejectionForm(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {bookingRequest.status === 'Approved' && (
                    <button
                      onClick={() => setShowConversionForm(true)}
                      className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Convert to Tenant
                    </button>
                  )}
                </div>
              </div>

              {/* Rejection Form */}
              {showRejectionForm && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Booking Request</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for Rejection (Optional)
                      </label>
                      <textarea
                        placeholder="Please provide a reason for rejection that will be shared with the guest..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-400"
                        rows="3"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleStatusUpdate('Rejected', rejectionReason)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        onClick={() => {
                          setShowRejectionForm(false);
                          setRejectionReason('');
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Guest Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                  <User className="h-5 w-5 mr-2 text-purple-600" />
                  Guest Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {bookingRequest.guestDetails.firstName} {bookingRequest.guestDetails.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {bookingRequest.guestDetails.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {bookingRequest.guestDetails.phone}
                    </p>
                  </div>
                  {bookingRequest.guestDetails.nin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">National Identification Number (NIN)</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">
                        {bookingRequest.guestDetails.nin}
                      </p>
                    </div>
                  )}
                </div>

                {/* NIN Image Display */}
                {bookingRequest.guestDetails.ninImage?.url && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NIN Document
                    </label>
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <img
                        src={bookingRequest.guestDetails.ninImage.url}
                        alt="NIN Document"
                        className="max-w-full h-auto max-h-64 rounded-lg shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(bookingRequest.guestDetails.ninImage.url, '_blank')}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Click image to view full size
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Property Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                  <MapPin className="h-5 w-5 mr-2 text-purple-600" />
                  Property Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Property</label>
                    <p className="mt-1 text-sm text-gray-900">{bookingRequest.propertyTitle}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="mt-1 text-sm text-gray-900">{bookingRequest.propertyLocation}</p>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                  <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                  Booking Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Check-in Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {format(new Date(bookingRequest.bookingDetails.checkInDate), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Check-out Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {format(new Date(bookingRequest.bookingDetails.checkOutDate), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {bookingRequest.bookingDetails.numberOfNights} nights
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Number of Guests</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {bookingRequest.bookingDetails.numberOfGuests} guests
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price per Night</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatCurrency(bookingRequest.bookingDetails.pricePerNight)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatCurrency(bookingRequest.bookingDetails.totalAmount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {bookingRequest.specialRequests && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                    <MessageSquare className="h-5 w-5 mr-2 text-purple-600" />
                    Special Requests
                  </h3>
                  <p className="text-sm text-gray-900">{bookingRequest.specialRequests}</p>
                </div>
              )}

              {/* Admin Notes */}
              {bookingRequest.adminNotes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Notes</h3>
                  <p className="text-sm text-gray-900">{bookingRequest.adminNotes}</p>
                </div>
              )}

              {/* Conversion Form */}
              {showConversionForm && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Convert to Tenant</h3>
                  <div className="space-y-4">
                    {/* Emergency Contact */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Emergency Contact</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="text"
                          placeholder="Contact Name"
                          value={conversionData.emergencyContact.name}
                          onChange={(e) => setConversionData(prev => ({
                            ...prev,
                            emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Relationship"
                          value={conversionData.emergencyContact.relationship}
                          onChange={(e) => setConversionData(prev => ({
                            ...prev,
                            emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                          required
                        />
                        <input
                          type="tel"
                          placeholder="Contact Phone"
                          value={conversionData.emergencyContact.phone}
                          onChange={(e) => setConversionData(prev => ({
                            ...prev,
                            emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                          required
                        />
                      </div>
                    </div>

                    {/* Identification */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Identification</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <input
                          type="text"
                          placeholder="National Identification Number (NIN)"
                          value={conversionData.nin}
                          onChange={(e) => setConversionData(prev => ({
                            ...prev,
                            nin: e.target.value
                          }))}
                          className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                          maxLength="11"
                          required
                        />
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Payment Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <CustomDropdown
                            options={paymentMethodOptions}
                            value={conversionData.paymentDetails.paymentMethod}
                            onChange={(value) => setConversionData(prev => ({
                              ...prev,
                              paymentDetails: { ...prev.paymentDetails, paymentMethod: value }
                            }))}
                            placeholder="Payment Method"
                          />
                        </div>
                        <div>
                          <CustomDropdown
                            options={paymentStatusOptions}
                            value={conversionData.paymentDetails.paymentStatus}
                            onChange={(value) => setConversionData(prev => ({
                              ...prev,
                              paymentDetails: { ...prev.paymentDetails, paymentStatus: value }
                            }))}
                            placeholder="Payment Status"
                          />
                        </div>
                        <input
                          type="number"
                          placeholder="Amount Paid"
                          value={conversionData.paymentDetails.amountPaid}
                          onChange={(e) => setConversionData(prev => ({
                            ...prev,
                            paymentDetails: { ...prev.paymentDetails, amountPaid: parseFloat(e.target.value) || 0 }
                          }))}
                          className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Admin Notes */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Admin Notes</h4>
                      <textarea
                        placeholder="Additional notes for tenant conversion..."
                        value={conversionData.adminNotes}
                        onChange={(e) => setConversionData(prev => ({
                          ...prev,
                          adminNotes: e.target.value
                        }))}
                        className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                        rows="3"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleConvertToTenant}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
                      >
                        {loading ? 'Converting...' : 'Create Tenant'}
                      </button>
                      <button
                        onClick={() => setShowConversionForm(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Request Info */}
              <div className="text-xs text-gray-500 border-t pt-4">
                <p>Request created: {format(new Date(bookingRequest.createdAt), 'MMMM dd, yyyy HH:mm')}</p>
                {bookingRequest.responseDate && (
                  <p>Last updated: {format(new Date(bookingRequest.responseDate), 'MMMM dd, yyyy HH:mm')}</p>
                )}
                <p>Source: {bookingRequest.source || 'Website'}</p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Failed to load booking request details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
