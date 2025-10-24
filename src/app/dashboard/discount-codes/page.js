"use client";
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Search, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function DiscountCodesPage() {
  const [discountCodes, setDiscountCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    maxDiscountAmount: '',
    minOrderAmount: '0',
    expiryDate: '',
    expiryTime: '',
    maxUsageCount: 1,
    isActive: true
  });

  useEffect(() => {
    fetchDiscountCodes();
  }, []);

  const fetchDiscountCodes = async () => {
    try {
      const response = await fetch('/api/discount-codes');
      const data = await response.json();
      
      // Ensure data is always an array
      if (Array.isArray(data)) {
        setDiscountCodes(data);
      } else {
        console.error('API returned non-array data:', data);
        setDiscountCodes([]);
      }
    } catch (error) {
      console.error('Error fetching discount codes:', error);
      setDiscountCodes([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate random 6-character alphanumeric code
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Auto-generate code when creating new discount code
  useEffect(() => {
    if (showCreateModal && !editingCode) {
      setFormData(prev => ({
        ...prev,
        code: generateCode()
      }));
    }
  }, [showCreateModal, editingCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingCode 
        ? `/api/discount-codes/${editingCode._id}` 
        : '/api/discount-codes';
      const method = editingCode ? 'PUT' : 'POST';
      
      // Combine date and time for expiry
      const expiryDateTime = new Date(`${formData.expiryDate}T${formData.expiryTime}`);
      
      const submitData = {
        ...formData,
        expiryDate: expiryDateTime.toISOString()
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        fetchDiscountCodes();
        resetForm();
        setShowCreateModal(false);
        setEditingCode(null);
      }
    } catch (error) {
      console.error('Error saving discount code:', error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this discount code?')) {
      try {
        await fetch(`/api/discount-codes/${id}`, {
          method: 'DELETE',
        });
        fetchDiscountCodes();
      } catch (error) {
        console.error('Error deleting discount code:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      maxDiscountAmount: '',
      minOrderAmount: '0',
      expiryDate: '',
      expiryTime: '',
      maxUsageCount: 1,
      isActive: true
    });
  };

  const handleEdit = (code) => {
    setEditingCode(code);
    const expiryDate = new Date(code.expiryDate);
    setFormData({
      code: code.code,
      description: code.description,
      discountType: code.discountType,
      discountValue: code.discountValue.toString(),
      maxDiscountAmount: code.maxDiscountAmount ? code.maxDiscountAmount.toString() : '',
      minOrderAmount: code.minOrderAmount ? code.minOrderAmount.toString() : '0',
      expiryDate: expiryDate.toISOString().split('T')[0],
      expiryTime: expiryDate.toTimeString().slice(0, 5),
      maxUsageCount: code.maxUsageCount,
      isActive: code.isActive
    });
    setShowCreateModal(true);
  };

  const filteredCodes = Array.isArray(discountCodes) ? discountCodes.filter(code =>
    code.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const getStatusBadge = (code) => {
    const isExpired = new Date() > new Date(code.expiryDate);
    const isFullyUsed = code.currentUsageCount >= code.maxUsageCount;
    
    if (!code.isActive) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Inactive</span>;
    }
    if (isExpired) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Expired</span>;
    }
    if (isFullyUsed) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Used Up</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <DashboardLayout>
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Discount Codes</h1>
        <button
          onClick={() => {
            resetForm();
            setEditingCode(null);
            setShowCreateModal(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Code
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search discount codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-96"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCodes.length > 0 ? filteredCodes.map((code) => (
              <tr key={code._id}>
                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-medium text-gray-900">
                  {code.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {code.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {code.discountType === 'percentage' 
                    ? `${code.discountValue}%` 
                    : `$${code.discountValue}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {code.currentUsageCount || 0} / {code.maxUsageCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(code.expiryDate).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(code)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(code)}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(code._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No discount codes found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-black">
              {editingCode ? 'Edit Discount Code' : 'Create Discount Code'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                    required
                    maxLength="6"
                    minLength="6"
                  />
                  {!editingCode && (
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, code: generateCode()})}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600"
                      title="Generate new code"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Time</label>
                  <input
                    type="time"
                    value={formData.expiryTime}
                    onChange={(e) => setFormData({...formData, expiryTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Usage Count</label>
                <input
                  type="number"
                  value={formData.maxUsageCount}
                  onChange={(e) => setFormData({...formData, maxUsageCount: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  required
                  min="1"
                />
              </div>

              {formData.discountType === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount Amount (Optional)</label>
                  <input
                    type="number"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({...formData, maxDiscountAmount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                    min="0"
                    step="0.01"
                    placeholder="No limit"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Days</label>
                <input
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({...formData, minOrderAmount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  min="0"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                >
                  {editingCode ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingCode(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
