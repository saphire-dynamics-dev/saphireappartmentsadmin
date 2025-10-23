'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Trash2, MapPin, Home, DollarSign, Users, Calendar, Phone, Mail, MessageCircle, Wifi, Car, Shield, Clock, CreditCard, Building2 } from 'lucide-react';

export default function ApartmentDetails({ apartmentId, onBack, onEdit, onDelete }) {
  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (apartmentId) {
      fetchApartmentDetails();
    }
  }, [apartmentId]);

  const fetchApartmentDetails = async () => {
    try {
      const response = await fetch(`/api/apartments/${apartmentId}`);
      const data = await response.json();
      
      if (data.success) {
        setApartment(data.data);
      } else {
        console.error('Failed to fetch apartment details:', data.error);
      }
    } catch (error) {
      console.error('Error fetching apartment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this apartment? This action cannot be undone.')) {
      onDelete(apartmentId);
    }
  };

  const handleEdit = () => {
    onEdit(apartmentId);
  };

  const getFeatureIcon = (feature) => {
    if (feature.toLowerCase().includes('wifi')) return <Wifi className="h-4 w-4" />;
    if (feature.toLowerCase().includes('parking')) return <Car className="h-4 w-4" />;
    if (feature.toLowerCase().includes('security')) return <Shield className="h-4 w-4" />;
    if (feature.toLowerCase().includes('24/7')) return <Clock className="h-4 w-4" />;
    return <Home className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!apartment) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Apartment not found</p>
        <button onClick={onBack} className="mt-4 text-purple-600 hover:text-purple-700">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Apartments
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleEdit}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Enhanced Image Gallery */}
          <div className="space-y-4 transition-all duration-1000">
            {/* Main Image */}
            <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-300"
                 onClick={() => setCurrentImageIndex(0)}>
              {apartment.images && apartment.images.length > 0 ? (
                <img
                  src={apartment.images[currentImageIndex]}
                  alt={apartment.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <Home className="h-12 w-12 text-gray-400" />
                </div>
              )}
              
              {/* Type Badge */}
              <div className="absolute top-4 left-4">
                <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-md">
                  {apartment.type}
                </span>
              </div>
              
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 text-sm rounded-full shadow-md ${
                  apartment.status === 'Available' ? 'bg-green-500 text-white' :
                  apartment.status === 'Occupied' ? 'bg-blue-500 text-white' :
                  'bg-yellow-500 text-white'
                }`}>
                  {apartment.status}
                </span>
              </div>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 hover:opacity-100 transition-opacity duration-300 bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Horizontal Scrolling Thumbnails */}
            {apartment.images && apartment.images.length > 1 && (
              <div className="relative">
                <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                  {apartment.images.map((image, index) => (
                    <div 
                      key={index} 
                      className={`relative h-20 w-28 md:h-24 md:w-32 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border-2 transition-all duration-300 transform hover:scale-105 ${
                        currentImageIndex === index ? 'border-purple-500' : 'border-transparent hover:border-purple-300'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <img
                        src={image}
                        alt={`${apartment.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-300"></div>
                    </div>
                  ))}
                </div>
                
                {/* Scroll indicator */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden"></div>
              </div>
            )}

            {/* View All Photos Button */}
            {apartment.images && apartment.images.length > 1 && (
              <div className="text-center">
                <button 
                  onClick={() => setCurrentImageIndex(0)}
                  className="inline-flex items-center px-4 py-2 border border-purple-600 rounded-lg text-purple-600 bg-white hover:bg-purple-600 hover:text-white transition-all duration-300 text-sm font-medium transform hover:scale-105"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  View all {apartment.images.length} photos
                </button>
              </div>
            )}
          </div>

          {/* Apartment Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{apartment.title}</h1>
              
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{apartment.location}</span>
              </div>
              
              <div className="flex items-center text-2xl font-bold text-purple-600 mb-4">
                <DollarSign className="h-6 w-6 mr-1" />
                <span>{apartment.price}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg transform hover:scale-105 transition-transform duration-300">
                <div className="text-lg font-semibold text-gray-900">{apartment.bedrooms}</div>
                <div className="text-sm text-gray-600">Bedrooms</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg transform hover:scale-105 transition-transform duration-300">
                <div className="text-lg font-semibold text-gray-900">{apartment.bathrooms}</div>
                <div className="text-sm text-gray-600">Bathrooms</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg transform hover:scale-105 transition-transform duration-300">
                <div className="text-lg font-semibold text-gray-900">{apartment.area}</div>
                <div className="text-sm text-gray-600">Area</div>
              </div>
            </div>

            {/* Property Type */}
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Property Type</span>
              <span className="text-sm font-semibold text-purple-700">{apartment.type}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {apartment.description && (
          <div className="px-6 pb-8 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
            <p className="text-gray-600 leading-relaxed">{apartment.description}</p>
          </div>
        )}

        {/* Features, Amenities, and Rules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 pb-8 mt-8">
          {/* Features */}
          {apartment.features && apartment.features.length > 0 && (
            <div className="transform hover:scale-105 transition-transform duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
              <div className="space-y-3">
                {apartment.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-300">
                    {getFeatureIcon(feature)}
                    <span className="ml-2">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          {apartment.amenities && apartment.amenities.length > 0 && (
            <div className="transform hover:scale-105 transition-transform duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
              <div className="space-y-3">
                {apartment.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-300">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
          {apartment.rules && apartment.rules.length > 0 && (
            <div className="transform hover:scale-105 transition-transform duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rules</h3>
              <div className="space-y-3">
                {apartment.rules.map((rule, index) => (
                  <div key={index} className="flex items-start text-sm text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-300">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contact Information */}
        {apartment.contact && (
          <div className="px-6 pb-8 border-t border-gray-200 pt-8 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {apartment.contact.phone && (
                <div className="flex items-center p-4 bg-gray-50 rounded-lg transform hover:scale-105 transition-transform duration-300">
                  <Phone className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Phone</div>
                    <div className="text-sm text-gray-600">{apartment.contact.phone}</div>
                  </div>
                </div>
              )}
              
              {apartment.contact.email && (
                <div className="flex items-center p-4 bg-gray-50 rounded-lg transform hover:scale-105 transition-transform duration-300">
                  <Mail className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Email</div>
                    <div className="text-sm text-gray-600">{apartment.contact.email}</div>
                  </div>
                </div>
              )}
              
              {apartment.contact.whatsapp && (
                <div className="flex items-center p-4 bg-gray-50 rounded-lg transform hover:scale-105 transition-transform duration-300">
                  <MessageCircle className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">WhatsApp</div>
                    <div className="text-sm text-gray-600">{apartment.contact.whatsapp}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bank Account Details */}
        {apartment.bankDetails && (
          <div className="px-6 pb-8 border-t border-gray-200 pt-8 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <CreditCard className="h-5 w-5 text-purple-600 mr-2" />
              Bank Account Details
            </h3>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center p-4 bg-white rounded-lg shadow-sm transform hover:scale-105 transition-transform duration-300">
                  <Building2 className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Bank Name</div>
                    <div className="text-sm text-gray-600 font-semibold">{apartment.bankDetails.bankName}</div>
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-white rounded-lg shadow-sm transform hover:scale-105 transition-transform duration-300">
                  <CreditCard className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Account Number</div>
                    <div className="text-sm text-gray-600 font-mono font-semibold tracking-wider">
                      {apartment.bankDetails.accountNumber}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-white rounded-lg shadow-sm transform hover:scale-105 transition-transform duration-300">
                  <Users className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Account Name</div>
                    <div className="text-sm text-gray-600 font-semibold">{apartment.bankDetails.accountName}</div>
                  </div>
                </div>
              </div>
              
              {/* Copy to clipboard functionality */}
              <div className="mt-4 pt-4 border-t border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-purple-700">
                    <span className="font-medium">Account Details:</span> Ready for payment transfers
                  </div>
                  <button
                    onClick={() => {
                      const accountDetails = `Bank: ${apartment.bankDetails.bankName}\nAccount Number: ${apartment.bankDetails.accountNumber}\nAccount Name: ${apartment.bankDetails.accountName}`;
                      navigator.clipboard.writeText(accountDetails);
                      alert('Bank details copied to clipboard!');
                    }}
                    className="text-xs px-3 py-1 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors duration-300"
                  >
                    Copy Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="px-6 pb-6 border-t border-gray-200 pt-8 mt-8">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Created: {new Date(apartment.createdAt).toLocaleDateString()}
            </div>
            {apartment.updatedAt !== apartment.createdAt && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Updated: {new Date(apartment.updatedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
