'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, CreditCard, Calendar, User, Building, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function TransactionDetailsModal({ 
  isOpen, 
  onClose, 
  transactionId 
}) {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && transactionId) {
      fetchTransactionDetails();
    }
  }, [isOpen, transactionId]);

  const fetchTransactionDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/transactions/${transactionId}`);
      const data = await response.json();
      
      if (data.success) {
        setTransaction(data.data);
      }
    } catch (error) {
      console.error('Error fetching transaction details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount / 100);
  };

  const getStatusColor = (status) => {
    const colors = {
      'success': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800',
      'abandoned': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'failed':
      case 'cancelled':
      case 'abandoned':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatType = (type) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatPaymentMethod = (method) => {
    if (!method) return 'N/A';
    return method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
            Transaction Details
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading transaction details...</p>
            </div>
          ) : transaction ? (
            <div className="p-6 space-y-6">
              {/* Transaction Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Transaction Status</h3>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(transaction.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.status)}`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reference</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{transaction.reference}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <p className="mt-1 text-lg font-semibold text-purple-600">{formatCurrency(transaction.amount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <p className="mt-1 text-sm text-gray-900">{formatType(transaction.type)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <p className="mt-1 text-sm text-gray-900">{formatPaymentMethod(transaction.paymentMethod)}</p>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                  <User className="h-5 w-5 mr-2 text-purple-600" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {transaction.customer.firstName} {transaction.customer.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{transaction.customer.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{transaction.customer.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Transaction Dates */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                  <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                  Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {format(new Date(transaction.createdAt), 'MMMM dd, yyyy HH:mm:ss')}
                    </p>
                  </div>
                  {transaction.paidAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Paid At</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {format(new Date(transaction.paidAt), 'MMMM dd, yyyy HH:mm:ss')}
                      </p>
                    </div>
                  )}
                  {transaction.updatedAt !== transaction.createdAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {format(new Date(transaction.updatedAt), 'MMMM dd, yyyy HH:mm:ss')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Related Property Information */}
              {transaction.metadata && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                    <Building className="h-5 w-5 mr-2 text-purple-600" />
                    Property Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {transaction.metadata.propertyTitle && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Property</label>
                        <p className="mt-1 text-sm text-gray-900">{transaction.metadata.propertyTitle}</p>
                      </div>
                    )}
                    {transaction.metadata.checkInDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Check-in Date</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {format(new Date(transaction.metadata.checkInDate), 'MMMM dd, yyyy')}
                        </p>
                      </div>
                    )}
                    {transaction.metadata.checkOutDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Check-out Date</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {format(new Date(transaction.metadata.checkOutDate), 'MMMM dd, yyyy')}
                        </p>
                      </div>
                    )}
                    {transaction.metadata.numberOfNights && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Duration</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {transaction.metadata.numberOfNights} nights
                        </p>
                      </div>
                    )}
                    {transaction.metadata.numberOfGuests && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Guests</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {transaction.metadata.numberOfGuests} guests
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fee Information */}
              {transaction.fees && (transaction.fees.paystackFee > 0 || transaction.fees.applicationFee > 0) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                    <DollarSign className="h-5 w-5 mr-2 text-purple-600" />
                    Fee Breakdown
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Transaction Amount</label>
                      <p className="mt-1 text-sm text-gray-900">{formatCurrency(transaction.amount)}</p>
                    </div>
                    {transaction.fees.paystackFee > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Processing Fee</label>
                        <p className="mt-1 text-sm text-gray-900">{formatCurrency(transaction.fees.paystackFee)}</p>
                      </div>
                    )}
                    {transaction.fees.applicationFee > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Application Fee</label>
                        <p className="mt-1 text-sm text-gray-900">{formatCurrency(transaction.fees.applicationFee)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Gateway Response */}
              {transaction.gatewayResponse && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Gateway Response</h3>
                  <p className="text-sm text-gray-600">{transaction.gatewayResponse}</p>
                </div>
              )}

              {/* Admin Updates */}
              {transaction.metadata?.adminUpdates && transaction.metadata.adminUpdates.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Update History</h3>
                  <div className="space-y-3">
                    {transaction.metadata.adminUpdates.map((update, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            Status changed from {update.oldStatus} to {update.newStatus}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(update.date), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{update.notes}</span>
                          <span className="text-xs text-gray-500">by {update.updatedBy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Refund Information */}
              {transaction.refund?.refunded && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h3 className="text-lg font-medium text-red-900 mb-2">Refund Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-red-800">Amount Refunded:</span>
                      <p className="text-red-700">{formatCurrency(transaction.refund.refundAmount)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-red-800">Refund Date:</span>
                      <p className="text-red-700">
                        {format(new Date(transaction.refund.refundDate), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                    {transaction.refund.refundReason && (
                      <div className="md:col-span-2">
                        <span className="font-medium text-red-800">Reason:</span>
                        <p className="text-red-700">{transaction.refund.refundReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Failed to load transaction details
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
