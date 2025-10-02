'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CustomDropdown from '@/components/ui/CustomDropdown';
import BookingRequestDetailsModal from '@/components/modals/BookingRequestDetailsModal';
import { Clipboard, Search, Eye, Trash2 } from 'lucide-react';

export default function BookingRequestsPage() {
  const [bookingRequests, setBookingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({});
  const [statusCounts, setStatusCounts] = useState({});

  const statusOptions = [
    { value: 'all', label: 'All Requests' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Converted', label: 'Converted' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Date Created' },
    { value: 'bookingDetails.checkInDate', label: 'Check-in Date' },
    { value: 'bookingDetails.totalAmount', label: 'Total Amount' },
    { value: 'guestDetails.lastName', label: 'Guest Name' }
  ];

  const orderOptions = [
    { value: 'desc', label: 'Newest First' },
    { value: 'asc', label: 'Oldest First' }
  ];

  const fetchBookingRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/booking-requests?${params}`);
      const data = await response.json();

      if (data.success) {
        setBookingRequests(data.data);
        setPagination(data.pagination);
        setStatusCounts(data.statusCounts);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to fetch booking requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingRequests();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'status' ? 1 : prev.page
    }));
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Converted': 'bg-blue-100 text-blue-800',
      'Cancelled': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const filteredRequests = bookingRequests.filter(request => {
    const matchesSearch = 
      request.guestDetails.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.guestDetails.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.guestDetails.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleViewDetails = (bookingId) => {
    setSelectedBookingId(bookingId);
    setShowDetailsModal(true);
  };

  const handleStatusUpdate = (updatedRequest) => {
    setBookingRequests(prev => 
      prev.map(req => 
        req._id === updatedRequest._id ? updatedRequest : req
      )
    );
    fetchBookingRequests(); // Refresh to update counts
  };

  const handleConvertToTenant = (conversionData) => {
    // Refresh the list after conversion
    fetchBookingRequests();
  };

  const handleDeleteRequest = async (requestId) => {
    if (!confirm('Are you sure you want to delete this booking request? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/booking-requests/${requestId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove the deleted request from the list
        setBookingRequests(prev => prev.filter(req => req._id !== requestId));
        fetchBookingRequests(); // Refresh to update counts
        alert('Booking request deleted successfully');
      } else {
        alert(data.error || 'Failed to delete booking request');
      }
    } catch (error) {
      console.error('Error deleting booking request:', error);
      alert('Error deleting booking request');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Clipboard className="h-6 w-6 text-purple-600 mr-2" />
            <h1 className="text-2xl font-semibold text-gray-900">Booking Requests</h1>
          </div>
          
          {/* Status Summary */}
          <div className="flex gap-2">
            {statusOptions.slice(1).map(status => (
              <div key={status.value} className="text-center">
                <div className="px-3 py-1 rounded-lg text-sm font-medium bg-purple-100 text-purple-800">
                  {statusCounts[status.value] || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">{status.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search guests or properties..."
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
                  options={sortOptions}
                  value={filters.sortBy}
                  onChange={(value) => handleFilterChange('sortBy', value)}
                  placeholder="Sort by"
                />
              </div>
              
              <div className="w-40">
                <CustomDropdown
                  options={orderOptions}
                  value={filters.sortOrder}
                  onChange={(value) => handleFilterChange('sortOrder', value)}
                  placeholder="Order"
                />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading booking requests...</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Guest & Property
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dates
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
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
                            <div className="text-sm font-medium text-gray-900">
                              {request.guestDetails.firstName} {request.guestDetails.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{request.guestDetails.email}</div>
                            <div className="text-xs text-gray-400 mt-1">{request.propertyTitle}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {format(new Date(request.bookingDetails.checkInDate), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-sm text-gray-500">
                            to {format(new Date(request.bookingDetails.checkOutDate), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-gray-400">
                            {request.bookingDetails.numberOfNights} nights
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(request.bookingDetails.totalAmount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {request.bookingDetails.numberOfGuests} guests
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleViewDetails(request._id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteRequest(request._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Request"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Empty State */}
                {filteredRequests.length === 0 && !loading && (
                  <div className="p-8 text-center text-gray-500">
                    {searchTerm || filters.status !== 'all' 
                      ? 'No booking requests match your search.' 
                      : 'No booking requests found.'}
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

      {/* Booking Request Details Modal */}
      <BookingRequestDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedBookingId(null);
        }}
        bookingRequestId={selectedBookingId}
        onStatusUpdate={handleStatusUpdate}
        onConvertToTenant={handleConvertToTenant}
      />
    </DashboardLayout>
  );
}
