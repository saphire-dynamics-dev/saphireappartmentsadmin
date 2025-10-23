'use client';

import { useState, useEffect } from 'react';
import { X, CreditCard } from 'lucide-react';
import CustomDropdown from '@/components/ui/CustomDropdown';

export default function UpdateTransactionStatusModal({ 
  isOpen, 
  onClose, 
  transaction, 
  onSuccess 
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    paymentMethod: '',
    paidAt: '',
    adminNotes: ''
  });

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'success', label: 'Successful' },
    { value: 'failed', label: 'Failed' },
    { value: 'abandoned', label: 'Abandoned' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const paymentMethodOptions = [
    { value: 'card', label: 'Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'ussd', label: 'USSD' },
    { value: 'qr', label: 'QR Code' },
    { value: 'mobile_money', label: 'Mobile Money' }
  ];

  useEffect(() => {
    if (isOpen && transaction) {
      setFormData({
        status: transaction.status || 'pending',
        paymentMethod: transaction.paymentMethod || '',
        paidAt: transaction.paidAt ? new Date(transaction.paidAt).toISOString().slice(0, 16) : '',
        adminNotes: ''
      });
    }
  }, [isOpen, transaction]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        status: formData.status,
        paymentMethod: formData.paymentMethod,
        adminNotes: formData.adminNotes
      };

      // Add paidAt if status is success and date is provided
      if (formData.status === 'success' && formData.paidAt) {
        updateData.paidAt = new Date(formData.paidAt);
      } else if (formData.status === 'success' && !formData.paidAt) {
        updateData.paidAt = new Date(); // Set current time if not provided
      }

      const response = await fetch(`/api/transactions/${transaction._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.(data.data);
        onClose();
        alert('Transaction status updated successfully');
      } else {
        alert(data.error || 'Failed to update transaction status');
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Error updating transaction status');
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

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
            Update Transaction Status
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Transaction Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Reference:</span>
                <p className="text-gray-900 font-mono">{transaction.reference}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Customer:</span>
                <p className="text-gray-900">
                  {transaction.customer.firstName} {transaction.customer.lastName}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Amount:</span>
                <p className="text-gray-900 font-semibold">{formatCurrency(transaction.amount)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Current Status:</span>
                <p className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                  transaction.status === 'success' ? 'bg-green-100 text-green-800' :
                  transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  transaction.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                </p>
              </div>
            </div>
          </div>

          {/* Update Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <CustomDropdown
                  options={statusOptions}
                  value={formData.status}
                  onChange={(value) => handleInputChange('status', value)}
                  placeholder="Select status"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <CustomDropdown
                  options={paymentMethodOptions}
                  value={formData.paymentMethod}
                  onChange={(value) => handleInputChange('paymentMethod', value)}
                  placeholder="Select payment method"
                />
              </div>
            </div>

            {formData.status === 'success' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.paidAt}
                  onChange={(e) => handleInputChange('paidAt', e.target.value)}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes
              </label>
              <textarea
                value={formData.adminNotes}
                onChange={(e) => handleInputChange('adminNotes', e.target.value)}
                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="3"
                placeholder="Add any notes about this status update..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
              >
                {loading ? 'Updating...' : 'Update Status'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
