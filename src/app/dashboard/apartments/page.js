'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CreateApartmentModal from '@/components/modals/CreateApartmentModal';
import EditApartmentModal from '@/components/modals/EditApartmentModal';
import ApartmentDetails from '@/components/apartments/ApartmentDetails';
import { Building, Plus, Search, Edit, Trash2, Eye, ChevronRight } from 'lucide-react';
import CustomDropdown from '@/components/ui/CustomDropdown';

export default function Apartments() {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingApartmentId, setEditingApartmentId] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'details'
  const [selectedApartmentId, setSelectedApartmentId] = useState(null);

  useEffect(() => {
    fetchApartments();
  }, []);

  const fetchApartments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/apartments');
      const data = await response.json();
      
      if (data.success) {
        setApartments(data.data);
      } else {
        console.error('Failed to fetch apartments:', data.error);
      }
    } catch (error) {
      console.error('Error fetching apartments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewApartment = (id) => {
    setSelectedApartmentId(id);
    setCurrentView('details');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedApartmentId(null);
  };

  const handleEditApartment = (id) => {
    setEditingApartmentId(id);
    setIsEditModalOpen(true);
  };

  const handleDeleteApartment = async (id) => {
    if (window.confirm('Are you sure you want to delete this apartment?')) {
      try {
        const response = await fetch(`/api/apartments/${id}`, {
          method: 'DELETE',
        });
        
        const data = await response.json();
        
        if (data.success) {
          fetchApartments(); // Refresh the list
          handleBackToList(); // Go back to list if viewing details
        } else {
          alert(data.error || 'Failed to delete apartment');
        }
      } catch (error) {
        alert('Error deleting apartment');
      }
    }
  };

  const Breadcrumb = () => (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <button
        onClick={handleBackToList}
        className="hover:text-purple-600 transition-colors"
      >
        Apartments
      </button>
      {currentView === 'details' && (
        <>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Apartment Details</span>
        </>
      )}
    </nav>
  );

  const filteredApartments = apartments.filter(apt => {
    const matchesSearch = apt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         apt.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === '' || apt.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statusFilterOptions = [
    { value: '', label: 'All Status' },
    { value: 'Available', label: 'Available' },
    { value: 'Occupied', label: 'Occupied' },
    { value: 'Maintenance', label: 'Maintenance' }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb />

        {currentView === 'list' ? (
          <>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Building className="h-6 w-6 text-purple-600 mr-2" />
                <h1 className="text-2xl font-semibold text-gray-900">Apartments</h1>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Apartment
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search apartments..."
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
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading apartments...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beds/Baths</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredApartments.map((apt) => (
                        <tr key={apt._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{apt.title}</div>
                            <div className="text-sm text-gray-500">{apt.area}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{apt.location}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{apt.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{apt.price}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {apt.bedrooms}BR / {apt.bathrooms}BA
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              apt.status === 'Available' ? 'bg-green-100 text-green-800' :
                              apt.status === 'Occupied' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {apt.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleViewApartment(apt._id)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleEditApartment(apt._id)}
                                className="text-purple-600 hover:text-purple-900"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteApartment(apt._id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredApartments.length === 0 && !loading && (
                    <div className="p-8 text-center text-gray-500">
                      {searchTerm || filterStatus ? 'No apartments match your search.' : 'No apartments found. Create your first apartment!'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <ApartmentDetails
            apartmentId={selectedApartmentId}
            onBack={handleBackToList}
            onEdit={handleEditApartment}
            onDelete={handleDeleteApartment}
          />
        )}
      </div>

      <CreateApartmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchApartments}
      />

      <EditApartmentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingApartmentId(null);
        }}
        onSuccess={fetchApartments}
        apartmentId={editingApartmentId}
      />
    </DashboardLayout>
  );
}
