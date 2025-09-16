'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Calendar, User, Wrench, AlertTriangle } from 'lucide-react';
import CustomDropdown from '@/components/ui/CustomDropdown';

export default function CreateMaintenanceRequestModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [apartments, setApartments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [formData, setFormData] = useState({
    apartment: '',
    apartmentTitle: '',
    apartmentLocation: '',
    requester: {
      type: 'Admin',
      tenant: '',
      name: '',
      phone: '',
      email: ''
    },
    issueCategory: '',
    priority: 'Medium',
    title: '',
    description: '',
    images: [],
    accessDetails: {
      preferredDate: '',
      preferredTime: 'Anytime',
      keyLocation: '',
      specialInstructions: '',
      contactForAccess: true
    },
    estimatedCost: ''
  });

  const categoryOptions = [
    { value: 'Plumbing', label: 'Plumbing' },
    { value: 'Electrical', label: 'Electrical' },
    { value: 'HVAC', label: 'HVAC' },
    { value: 'Appliances', label: 'Appliances' },
    { value: 'Cleaning', label: 'Cleaning' },
    { value: 'Repairs', label: 'Repairs' },
    { value: 'Painting', label: 'Painting' },
    { value: 'Pest Control', label: 'Pest Control' },
    { value: 'Security', label: 'Security' },
    { value: 'Other', label: 'Other' }
  ];

  const priorityOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Emergency', label: 'Emergency' }
  ];

  const requesterTypeOptions = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Tenant', label: 'Tenant' },
    { value: 'Property Manager', label: 'Property Manager' }
  ];

  const timeOptions = [
    { value: 'Morning (8AM-12PM)', label: 'Morning (8AM-12PM)' },
    { value: 'Afternoon (12PM-5PM)', label: 'Afternoon (12PM-5PM)' },
    { value: 'Evening (5PM-8PM)', label: 'Evening (5PM-8PM)' },
    { value: 'Anytime', label: 'Anytime' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchApartments();
      fetchTenants();
    }
  }, [isOpen]);

  const fetchApartments = async () => {
    try {
      const response = await fetch('/api/apartments?limit=100');
      const data = await response.json();
      if (data.success) {
        setApartments(data.data);
      }
    } catch (error) {
      console.error('Error fetching apartments:', error);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/tenants?limit=100');
      const data = await response.json();
      if (data.success) {
        setTenants(data.data);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleApartmentChange = (apartmentId) => {
    const selectedApartment = apartments.find(apt => apt._id === apartmentId);
    if (selectedApartment) {
      setFormData(prev => ({
        ...prev,
        apartment: apartmentId,
        apartmentTitle: selectedApartment.title,
        apartmentLocation: selectedApartment.location
      }));
    }
  };

  const handleTenantChange = (tenantId) => {
    const selectedTenant = tenants.find(tenant => tenant._id === tenantId);
    if (selectedTenant) {
      setFormData(prev => ({
        ...prev,
        requester: {
          ...prev.requester,
          tenant: tenantId,
          name: `${selectedTenant.firstName} ${selectedTenant.lastName}`,
          phone: selectedTenant.phone,
          email: selectedTenant.email
        }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/maintenance-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.(data.data);
        onClose();
        resetForm();
      } else {
        alert(data.error || 'Failed to create maintenance request');
      }
    } catch (error) {
      console.error('Error creating maintenance request:', error);
      alert('Error creating maintenance request');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      apartment: '',
      apartmentTitle: '',
      apartmentLocation: '',
      requester: {
        type: 'Admin',
        tenant: '',
        name: '',
        phone: '',
        email: ''
      },
      issueCategory: '',
      priority: 'Medium',
      title: '',
      description: '',
      images: [],
      accessDetails: {
        preferredDate: '',
        preferredTime: 'Anytime',
        keyLocation: '',
        specialInstructions: '',
        contactForAccess: true
      },
      estimatedCost: ''
    });
  };

  const apartmentOptions = apartments.map(apt => ({
    value: apt._id,
    label: `${apt.title} - ${apt.location}`
  }));

  const tenantOptions = tenants.map(tenant => ({
    value: tenant._id,
    label: `${tenant.firstName} ${tenant.lastName} - ${tenant.email}`
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Wrench className="h-5 w-5 mr-2 text-purple-600" />
            Create Maintenance Request
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Apartment Selection */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-purple-600" />
                Property Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Apartment *
                  </label>
                  <CustomDropdown
                    options={apartmentOptions}
                    value={formData.apartment}
                    onChange={handleApartmentChange}
                    placeholder="Select an apartment"
                  />
                </div>
              </div>
            </div>

            {/* Requester Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Requester Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requester Type *
                  </label>
                  <CustomDropdown
                    options={requesterTypeOptions}
                    value={formData.requester.type}
                    onChange={(value) => handleInputChange('requester.type', value)}
                    placeholder="Select requester type"
                  />
                </div>
                
                {formData.requester.type === 'Tenant' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Tenant
                    </label>
                    <CustomDropdown
                      options={tenantOptions}
                      value={formData.requester.tenant}
                      onChange={handleTenantChange}
                      placeholder="Select a tenant"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={formData.requester.name}
                  onChange={(e) => handleInputChange('requester.name', e.target.value)}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={formData.requester.phone}
                  onChange={(e) => handleInputChange('requester.phone', e.target.value)}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.requester.email}
                  onChange={(e) => handleInputChange('requester.email', e.target.value)}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                />
              </div>
            </div>

            {/* Issue Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-purple-600" />
                Issue Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <CustomDropdown
                    options={categoryOptions}
                    value={formData.issueCategory}
                    onChange={(value) => handleInputChange('issueCategory', value)}
                    placeholder="Select issue category"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <CustomDropdown
                    options={priorityOptions}
                    value={formData.priority}
                    onChange={(value) => handleInputChange('priority', value)}
                    placeholder="Select priority"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Title *
                </label>
                <input
                  type="text"
                  placeholder="Brief description of the issue"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                  required
                  maxLength="200"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  placeholder="Provide detailed description of the issue..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                  rows="4"
                  required
                  maxLength="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Cost (₦)
                </label>
                <input
                  type="number"
                  placeholder="Optional estimated cost"
                  value={formData.estimatedCost}
                  onChange={(e) => handleInputChange('estimatedCost', e.target.value)}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                  min="0"
                />
              </div>
            </div>

            {/* Access Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                Access Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={formData.accessDetails.preferredDate}
                    onChange={(e) => handleInputChange('accessDetails.preferredDate', e.target.value)}
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time
                  </label>
                  <CustomDropdown
                    options={timeOptions}
                    value={formData.accessDetails.preferredTime}
                    onChange={(value) => handleInputChange('accessDetails.preferredTime', value)}
                    placeholder="Select preferred time"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Location / Access Instructions
                </label>
                <input
                  type="text"
                  placeholder="Where to find keys or how to access the property"
                  value={formData.accessDetails.keyLocation}
                  onChange={(e) => handleInputChange('accessDetails.keyLocation', e.target.value)}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <textarea
                  placeholder="Any special instructions for the technician"
                  value={formData.accessDetails.specialInstructions}
                  onChange={(e) => handleInputChange('accessDetails.specialInstructions', e.target.value)}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                  rows="3"
                  maxLength="500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="contactForAccess"
                  checked={formData.accessDetails.contactForAccess}
                  onChange={(e) => handleInputChange('accessDetails.contactForAccess', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="contactForAccess" className="ml-2 text-sm text-gray-700">
                  Contact requester before accessing the property
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
              >
                {loading ? 'Creating...' : 'Create Maintenance Request'}
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
