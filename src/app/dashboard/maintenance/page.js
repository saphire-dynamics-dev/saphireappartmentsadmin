'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CustomDropdown from '@/components/ui/CustomDropdown';
import CreateMaintenanceRequestModal from '@/components/modals/CreateMaintenanceRequestModal';
import MaintenanceRequestDetailsModal from '@/components/modals/MaintenanceRequestDetailsModal';
import { Wrench, Search, Eye, Plus, AlertTriangle } from 'lucide-react';

export default function MaintenancePage() {
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({});
  const [statusCounts, setStatusCounts] = useState({});
  const [priorityCounts, setPriorityCounts] = useState({});

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Assigned', label: 'Assigned' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'On Hold', label: 'On Hold' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Emergency', label: 'Emergency' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
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

  const sortOptions = [
    { value: 'createdAt', label: 'Date Created' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
    { value: 'title', label: 'Title' }
  ];

  const orderOptions = [
    { value: 'desc', label: 'Newest First' },
    { value: 'asc', label: 'Oldest First' }
  ];

  useEffect(() => {
    fetchMaintenanceRequests();
  }, [filters]);

  const fetchMaintenanceRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/maintenance-requests?${params}`);
      const data = await response.json();

      if (data.success) {
        setMaintenanceRequests(data.data);
        setPagination(data.pagination);
        setStatusCounts(data.statusCounts);
        setPriorityCounts(data.priorityCounts);
      }
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'status' || key === 'priority' || key === 'category' ? 1 : prev.page
    }));
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

  const filteredRequests = maintenanceRequests.filter(request => {
    const matchesSearch = 
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.apartmentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleViewDetails = (requestId) => {
    setSelectedRequestId(requestId);
    setShowDetailsModal(true);
  };

  const handleStatusUpdate = (updatedRequest) => {
    setMaintenanceRequests(prev => 
      prev.map(req => 
        req._id === updatedRequest._id ? updatedRequest : req
      )
    );
    fetchMaintenanceRequests(); // Refresh to update counts
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Wrench className="h-6 w-6 text-purple-600 mr-2" />
            <h1 className="text-2xl font-semibold text-gray-900">Maintenance Requests</h1>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-semibold text-gray-900">{pagination.totalItems || 0}</p>
              </div>
              <Wrench className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-yellow-600">{statusCounts.Pending || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-semibold text-blue-600">{statusCounts['In Progress'] || 0}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-blue-600 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Emergency</p>
                <p className="text-2xl font-semibold text-red-600">{priorityCounts.Emergency || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex gap-4 flex-wrap">
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-gray-700 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div className="w-48">
                <CustomDropdown
                  options={statusOptions}
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                  placeholder="Filter by status"
                />
              </div>
              
              <div className="w-48">
                <CustomDropdown
                  options={priorityOptions}
                  value={filters.priority}
                  onChange={(value) => handleFilterChange('priority', value)}
                  placeholder="Filter by priority"
                />
              </div>
              
              <div className="w-48">
                <CustomDropdown
                  options={categoryOptions}
                  value={filters.category}
                  onChange={(value) => handleFilterChange('category', value)}
                  placeholder="Filter by category"
                />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading maintenance requests...</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Request Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requester
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{request.title}</div>
                            <div className="text-sm text-gray-500">{request.issueCategory}</div>
                            {request.estimatedCost && (
                              <div className="text-xs text-gray-400">Est: {formatCurrency(request.estimatedCost)}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.apartmentTitle}</div>
                          <div className="text-sm text-gray-500">{request.apartmentLocation}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.requester.name}</div>
                          <div className="text-sm text-gray-500">{request.requester.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                            {request.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => handleViewDetails(request._id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Empty State */}
                {filteredRequests.length === 0 && !loading && (
                  <div className="p-8 text-center text-gray-500">
                    {searchTerm || filters.status !== 'all' || filters.priority !== 'all' || filters.category !== 'all'
                      ? 'No maintenance requests match your search.' 
                      : 'No maintenance requests found.'}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-700">
                      Showing {((pagination.currentPage - 1) * filters.limit) + 1} to{' '}
                      {Math.min(pagination.currentPage * filters.limit, pagination.totalItems)} of{' '}
                      {pagination.totalItems} results
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-700">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Maintenance Request Modal */}
      <CreateMaintenanceRequestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchMaintenanceRequests}
      />

      {/* Maintenance Request Details Modal */}
      <MaintenanceRequestDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedRequestId(null);
        }}
        maintenanceRequestId={selectedRequestId}
        onStatusUpdate={handleStatusUpdate}
      />
    </DashboardLayout>
  );
}
