'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CreateTenantModal from '@/components/modals/CreateTenantModal';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { Users, Plus, Search, Phone, Mail, Calendar, CreditCard, Eye, Grid3X3, List } from 'lucide-react';

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'gallery' or 'list'

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tenants');
      const data = await response.json();
      
      if (data.success) {
        setTenants(data.data);
      } else {
        console.error('Failed to fetch tenants:', data.error);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (id) => {
    try {
      const response = await fetch(`/api/tenants/check-in/${id}`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchTenants(); // Refresh the list
      } else {
        alert(data.error || 'Failed to check in guest');
      }
    } catch (error) {
      alert('Error checking in guest');
    }
  };

  const handleCheckOut = async (id) => {
    try {
      const response = await fetch(`/api/tenants/check-out/${id}`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchTenants(); // Refresh the list
      } else {
        alert(data.error || 'Failed to check out guest');
      }
    } catch (error) {
      alert('Error checking out guest');
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.phone.includes(searchTerm);
    const matchesFilter = filterStatus === '' || tenant.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-blue-100 text-blue-800';
      case 'Checked-In': return 'bg-green-100 text-green-800';
      case 'Checked-Out': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'No-Show': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Partial': return 'bg-orange-100 text-orange-800';
      case 'Refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statusFilterOptions = [
    { value: '', label: 'All Status' },
    { value: 'Confirmed', label: 'Confirmed' },
    { value: 'Checked-In', label: 'Checked-In' },
    { value: 'Checked-Out', label: 'Checked-Out' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'No-Show', label: 'No-Show' }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-purple-600 mr-2" />
            <h1 className="text-2xl font-semibold text-gray-900">Guest Bookings</h1>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search guests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-gray-700 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="w-48">
                <CustomDropdown
                  options={statusFilterOptions}
                  value={filterStatus}
                  onChange={setFilterStatus}
                  placeholder="Filter by status"
                />
              </div>
              
              {/* View Toggle */}
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('gallery')}
                  className={`p-2 rounded-l-lg transition-colors ${
                    viewMode === 'gallery' 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Gallery View"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-r-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading bookings...</p>
            </div>
          ) : (
            <>
              {/* Gallery View */}
              {viewMode === 'gallery' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {filteredTenants.map((tenant) => (
                    <div key={tenant._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          {tenant.firstName} {tenant.lastName}
                        </h3>
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 text-xs rounded-full text-center ${getStatusColor(tenant.status)}`}>
                            {tenant.status}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full text-center ${getPaymentStatusColor(tenant.paymentDetails.paymentStatus)}`}>
                            {tenant.paymentDetails.paymentStatus}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {tenant.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2" />
                          {tenant.email}
                        </div>
                        {tenant.apartment && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Apartment:</span> {tenant.apartment.title}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 ">Check-in:</span>
                          <span className="font-medium text-purple-600">{new Date(tenant.stayDetails.checkInDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 ">Check-out:</span>
                          <span className="font-medium text-purple-600">{new Date(tenant.stayDetails.checkOutDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Guests:</span>
                          <span className="font-medium text-purple-600">{tenant.stayDetails.numberOfGuests}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium text-purple-600">₦{tenant.stayDetails.totalAmount?.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        {tenant.status === 'Confirmed' && (
                          <button 
                            onClick={() => handleCheckIn(tenant._id)}
                            className="flex-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Check In
                          </button>
                        )}
                        {tenant.status === 'Checked-In' && (
                          <button 
                            onClick={() => handleCheckOut(tenant._id)}
                            className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Check Out
                          </button>
                        )}
                        <button className="flex-1 px-3 py-1 text-sm border border-purple-600 text-purple-600 rounded hover:bg-purple-50">
                          <Eye className="h-4 w-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apartment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stay Details</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTenants.map((tenant) => (
                        <tr key={tenant._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {tenant.firstName} {tenant.lastName}
                              </div>
                              <div className="text-sm text-gray-500">NIN: {tenant.nin}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{tenant.phone}</div>
                            <div className="text-sm text-gray-500">{tenant.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {tenant.apartment?.title || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {tenant.apartment?.location || ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(tenant.stayDetails.checkInDate).toLocaleDateString()} - {new Date(tenant.stayDetails.checkOutDate).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {tenant.stayDetails.numberOfGuests} guests • {tenant.stayDetails.numberOfNights} nights
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ₦{tenant.stayDetails.totalAmount?.toLocaleString()}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full inline-block ${getPaymentStatusColor(tenant.paymentDetails.paymentStatus)}`}>
                              {tenant.paymentDetails.paymentStatus}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(tenant.status)}`}>
                              {tenant.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {tenant.status === 'Confirmed' && (
                                <button 
                                  onClick={() => handleCheckIn(tenant._id)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Check In"
                                >
                                  Check In
                                </button>
                              )}
                              {tenant.status === 'Checked-In' && (
                                <button 
                                  onClick={() => handleCheckOut(tenant._id)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Check Out"
                                >
                                  Check Out
                                </button>
                              )}
                              <button 
                                className="text-purple-600 hover:text-purple-900"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
          
          {filteredTenants.length === 0 && !loading && (
            <div className="p-8 text-center text-gray-500">
              {searchTerm || filterStatus ? 'No bookings match your search.' : 'No bookings found. Create your first booking!'}
            </div>
          )}
        </div>
      </div>

      <CreateTenantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTenants}
      />
    </DashboardLayout>
  );
}
