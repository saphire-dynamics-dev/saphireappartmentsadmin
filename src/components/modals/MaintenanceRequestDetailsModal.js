'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, User, Calendar, MapPin, Phone, Mail, MessageSquare, Wrench, AlertTriangle, Edit } from 'lucide-react';
import CustomDropdown from '@/components/ui/CustomDropdown';

export default function MaintenanceRequestDetailsModal({ 
  isOpen, 
  onClose, 
  maintenanceRequestId, 
  onStatusUpdate 
}) {
  const [maintenanceRequest, setMaintenanceRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [statusUpdateData, setStatusUpdateData] = useState({
    status: '',
    adminNotes: '',
    assignedTo: {
      name: '',
      phone: '',
      email: '',
      company: '',
      specialization: ''
    },
    scheduledDate: '',
    estimatedCost: '',
    actualCost: ''
  });

  const statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Assigned', label: 'Assigned' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'On Hold', label: 'On Hold' }
  ];

  useEffect(() => {
    if (isOpen && maintenanceRequestId) {
      fetchMaintenanceRequestDetails();
    }
  }, [isOpen, maintenanceRequestId]);

  const fetchMaintenanceRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/maintenance-requests/${maintenanceRequestId}`);
      const data = await response.json();
      
      if (data.success) {
        setMaintenanceRequest(data.data);
        // Initialize status update data with current values
        setStatusUpdateData(prev => ({
          ...prev,
          status: data.data.status,
          adminNotes: data.data.adminNotes || '',
          assignedTo: data.data.assignedTo || prev.assignedTo,
          scheduledDate: data.data.scheduledDate ? format(new Date(data.data.scheduledDate), 'yyyy-MM-dd') : '',
          estimatedCost: data.data.estimatedCost || '',
          actualCost: data.data.actualCost || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching maintenance request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      setLoading(true);
      const updateData = {
        ...statusUpdateData,
        scheduledDate: statusUpdateData.scheduledDate ? new Date(statusUpdateData.scheduledDate) : null,
        estimatedCost: statusUpdateData.estimatedCost ? parseFloat(statusUpdateData.estimatedCost) : null,
        actualCost: statusUpdateData.actualCost ? parseFloat(statusUpdateData.actualCost) : null
      };

      const response = await fetch(`/api/maintenance-requests/${maintenanceRequestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      if (data.success) {
        setMaintenanceRequest(data.data);
        onStatusUpdate?.(data.data);
        setShowStatusUpdate(false);
        alert('Maintenance request updated successfully!');
      } else {
        alert(data.error || 'Failed to update maintenance request');
      }
    } catch (error) {
      console.error('Error updating maintenance request:', error);
      alert('Error updating maintenance request');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'bg-gray-100 text-gray-800',
      'Medium': 'bg-blue-100 text-blue-800',
      'High': 'bg-orange-100 text-orange-800',
      'Emergency': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Assigned': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-purple-100 text-purple-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-gray-100 text-gray-800',
      'On Hold': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Wrench className="h-5 w-5 mr-2 text-purple-600" />
            Maintenance Request Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading details...</p>
            </div>
          ) : maintenanceRequest ? (
            <div className="p-6 space-y-6">
              {/* Status and Actions */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(maintenanceRequest.status)}`}>
                    {maintenanceRequest.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(maintenanceRequest.priority)}`}>
                    {maintenanceRequest.priority} Priority
                  </span>
                </div>
                <button
                  onClick={() => setShowStatusUpdate(true)}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Status
                </button>
              </div>

              {/* Request Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                  <AlertTriangle className="h-5 w-5 mr-2 text-purple-600" />
                  Request Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <p className="mt-1 text-sm text-gray-900">{maintenanceRequest.title}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <p className="mt-1 text-sm text-gray-900">{maintenanceRequest.issueCategory}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{maintenanceRequest.description}</p>
                  </div>
                </div>
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
                    <p className="mt-1 text-sm text-gray-900">{maintenanceRequest.apartmentTitle}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="mt-1 text-sm text-gray-900">{maintenanceRequest.apartmentLocation}</p>
                  </div>
                </div>
              </div>

              {/* Requester Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                  <User className="h-5 w-5 mr-2 text-purple-600" />
                  Requester Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{maintenanceRequest.requester.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <p className="mt-1 text-sm text-gray-900">{maintenanceRequest.requester.type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {maintenanceRequest.requester.phone}
                    </p>
                  </div>
                  {maintenanceRequest.requester.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900 flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {maintenanceRequest.requester.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Access Details */}
              {maintenanceRequest.accessDetails && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                    <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                    Access Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {maintenanceRequest.accessDetails.preferredDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Preferred Date</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {format(new Date(maintenanceRequest.accessDetails.preferredDate), 'MMMM dd, yyyy')}
                        </p>
                      </div>
                    )}
                    {maintenanceRequest.accessDetails.preferredTime && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Preferred Time</label>
                        <p className="mt-1 text-sm text-gray-900">{maintenanceRequest.accessDetails.preferredTime}</p>
                      </div>
                    )}
                    {maintenanceRequest.accessDetails.keyLocation && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Key Location</label>
                        <p className="mt-1 text-sm text-gray-900">{maintenanceRequest.accessDetails.keyLocation}</p>
                      </div>
                    )}
                    {maintenanceRequest.accessDetails.specialInstructions && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Special Instructions</label>
                        <p className="mt-1 text-sm text-gray-900">{maintenanceRequest.accessDetails.specialInstructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Assignment and Cost Information */}
              {(maintenanceRequest.assignedTo?.name || maintenanceRequest.estimatedCost || maintenanceRequest.actualCost) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment & Cost</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {maintenanceRequest.assignedTo?.name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                        <p className="mt-1 text-sm text-gray-900">{maintenanceRequest.assignedTo.name}</p>
                        {maintenanceRequest.assignedTo.company && (
                          <p className="text-xs text-gray-500">{maintenanceRequest.assignedTo.company}</p>
                        )}
                      </div>
                    )}
                    {maintenanceRequest.scheduledDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Scheduled Date</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {format(new Date(maintenanceRequest.scheduledDate), 'MMMM dd, yyyy')}
                        </p>
                      </div>
                    )}
                    {maintenanceRequest.estimatedCost && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Estimated Cost</label>
                        <p className="mt-1 text-sm text-gray-900">{formatCurrency(maintenanceRequest.estimatedCost)}</p>
                      </div>
                    )}
                    {maintenanceRequest.actualCost && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Actual Cost</label>
                        <p className="mt-1 text-sm text-gray-900">{formatCurrency(maintenanceRequest.actualCost)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {maintenanceRequest.adminNotes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Notes</h3>
                  <p className="text-sm text-gray-900">{maintenanceRequest.adminNotes}</p>
                </div>
              )}

              {/* Status Update Form */}
              {showStatusUpdate && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Update Request Status</h3>
                  <div className="space-y-4">
                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <CustomDropdown
                        options={statusOptions}
                        value={statusUpdateData.status}
                        onChange={(value) => setStatusUpdateData(prev => ({ ...prev, status: value }))}
                        placeholder="Select status"
                      />
                    </div>

                    {/* Assignment Details */}
                    {(statusUpdateData.status === 'Assigned' || statusUpdateData.status === 'In Progress') && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Assignment Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="Technician Name"
                            value={statusUpdateData.assignedTo.name}
                            onChange={(e) => setStatusUpdateData(prev => ({
                              ...prev,
                              assignedTo: { ...prev.assignedTo, name: e.target.value }
                            }))}
                            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                          />
                          <input
                            type="tel"
                            placeholder="Phone Number"
                            value={statusUpdateData.assignedTo.phone}
                            onChange={(e) => setStatusUpdateData(prev => ({
                              ...prev,
                              assignedTo: { ...prev.assignedTo, phone: e.target.value }
                            }))}
                            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                          />
                          <input
                            type="email"
                            placeholder="Email Address"
                            value={statusUpdateData.assignedTo.email}
                            onChange={(e) => setStatusUpdateData(prev => ({
                              ...prev,
                              assignedTo: { ...prev.assignedTo, email: e.target.value }
                            }))}
                            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                          />
                          <input
                            type="text"
                            placeholder="Company"
                            value={statusUpdateData.assignedTo.company}
                            onChange={(e) => setStatusUpdateData(prev => ({
                              ...prev,
                              assignedTo: { ...prev.assignedTo, company: e.target.value }
                            }))}
                            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                          />
                          <input
                            type="date"
                            placeholder="Scheduled Date"
                            value={statusUpdateData.scheduledDate}
                            onChange={(e) => setStatusUpdateData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}

                    {/* Cost Information */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Cost Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="number"
                          placeholder="Estimated Cost (₦)"
                          value={statusUpdateData.estimatedCost}
                          onChange={(e) => setStatusUpdateData(prev => ({ ...prev, estimatedCost: e.target.value }))}
                          className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                          min="0"
                        />
                        {statusUpdateData.status === 'Completed' && (
                          <input
                            type="number"
                            placeholder="Actual Cost (₦)"
                            value={statusUpdateData.actualCost}
                            onChange={(e) => setStatusUpdateData(prev => ({ ...prev, actualCost: e.target.value }))}
                            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                            min="0"
                          />
                        )}
                      </div>
                    </div>

                    {/* Admin Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                      <textarea
                        placeholder="Additional notes about this update..."
                        value={statusUpdateData.adminNotes}
                        onChange={(e) => setStatusUpdateData(prev => ({ ...prev, adminNotes: e.target.value }))}
                        className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                        rows="3"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleStatusUpdate}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
                      >
                        {loading ? 'Updating...' : 'Update Request'}
                      </button>
                      <button
                        onClick={() => setShowStatusUpdate(false)}
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
                <p>Request created: {format(new Date(maintenanceRequest.createdAt), 'MMMM dd, yyyy HH:mm')}</p>
                {maintenanceRequest.updatedAt && maintenanceRequest.updatedAt !== maintenanceRequest.createdAt && (
                  <p>Last updated: {format(new Date(maintenanceRequest.updatedAt), 'MMMM dd, yyyy HH:mm')}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Failed to load maintenance request details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
