'use client';
import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, User, Calendar, CreditCard, Home, AlertTriangle } from 'lucide-react';
import CustomDropdown from '@/components/ui/CustomDropdown';
import CustomCalendar from '@/components/ui/CustomCalendar';

export default function CreateTenantModal({ isOpen, onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apartments, setApartments] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    apartment: '',
    stayDetails: {
      checkInDate: '',
      checkOutDate: '',
      numberOfGuests: 1,
      numberOfNights: 0,
      totalAmount: 0,
      pricePerNight: 0
    },
    paymentDetails: {
      paymentMethod: 'Bank Transfer',
      paymentStatus: 'Pending',
      amountPaid: 0,
      transactionReference: ''
    },
    specialRequests: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [unavailableRanges, setUnavailableRanges] = useState([]);
  const [dateValidationError, setDateValidationError] = useState('');
  const [isDateValidationLoading, setIsDateValidationLoading] = useState(false);
  const [isDateValid, setIsDateValid] = useState(false);

  const steps = [
    { id: 1, title: 'Guest Info', icon: User },
    { id: 2, title: 'Apartment', icon: Home },
    { id: 3, title: 'Stay Details', icon: Calendar },
    { id: 4, title: 'Payment', icon: CreditCard }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchApartments();
    }
  }, [isOpen]);

  useEffect(() => {
    calculateStayDetails();
  }, [formData.stayDetails.checkInDate, formData.stayDetails.checkOutDate, formData.stayDetails.pricePerNight]);

  // Update formData when calendar dates change
  useEffect(() => {
    if (checkInDate) {
      handleInputChange('stayDetails.checkInDate', checkInDate.toISOString().split('T')[0]);
    }
  }, [checkInDate]);

  useEffect(() => {
    if (checkOutDate) {
      handleInputChange('stayDetails.checkOutDate', checkOutDate.toISOString().split('T')[0]);
    }
  }, [checkOutDate]);

  // Fetch unavailable dates when apartment changes
  useEffect(() => {
    if (formData.apartment) {
      fetchUnavailableDates();
    } else {
      setUnavailableDates([]);
      setUnavailableRanges([]);
    }
  }, [formData.apartment]);

  const fetchApartments = async () => {
    try {
      const response = await fetch('/api/apartments?status=Available');
      const data = await response.json();
      if (data.success) {
        setApartments(data.data);
      }
    } catch (error) {
      console.error('Error fetching apartments:', error);
    }
  };

  const fetchUnavailableDates = async () => {
    try {
      const response = await fetch(`/api/apartments/${formData.apartment}/unavailable-dates`);
      const data = await response.json();
      
      if (data.success) {
        setUnavailableDates(data.data.dates);
        setUnavailableRanges(data.data.ranges);
      }
    } catch (error) {
      console.error('Error fetching unavailable dates:', error);
    }
  };

  const calculateStayDetails = () => {
    const { checkInDate, checkOutDate, pricePerNight } = formData.stayDetails;
    
    if (checkInDate && checkOutDate && new Date(checkOutDate) > new Date(checkInDate)) {
      const diffTime = new Date(checkOutDate) - new Date(checkInDate);
      const numberOfNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const totalAmount = numberOfNights * (pricePerNight || 0);
      
      setFormData(prev => ({
        ...prev,
        stayDetails: {
          ...prev.stayDetails,
          numberOfNights,
          totalAmount
        }
      }));
    }
  };

  // Validate date selection using the same logic as the API
  const validateDateSelection = async () => {
    if (!checkInDate || !checkOutDate) {
      setDateValidationError('Please select both check-in and check-out dates.');
      setIsDateValid(false);
      return false;
    }

    if (!formData.apartment) {
      setDateValidationError('Please select an apartment first.');
      setIsDateValid(false);
      return false;
    }

    setIsDateValidationLoading(true);

    try {
      // Check for conflicting bookings using the same logic as the API
      const response = await fetch(`/api/apartments/${formData.apartment}/check-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkInDate: checkInDate.toISOString().split('T')[0],
          checkOutDate: checkOutDate.toISOString().split('T')[0]
        }),
      });

      const data = await response.json();

      if (!data.success) {
        if (data.conflictingBooking) {
          const conflictStart = new Date(data.conflictingBooking.stayDetails.checkInDate).toLocaleDateString();
          const conflictEnd = new Date(data.conflictingBooking.stayDetails.checkOutDate).toLocaleDateString();
          setDateValidationError(`Selected dates conflict with an existing booking (${conflictStart} - ${conflictEnd}). Please choose different dates.`);
        } else {
          setDateValidationError(data.error || 'Selected dates are not available.');
        }
        setIsDateValid(false);
        return false;
      }

      setDateValidationError('');
      setIsDateValid(true);
      return true;
    } catch (error) {
      console.error('Error validating dates:', error);
      setDateValidationError('Error checking date availability. Please try again.');
      setIsDateValid(false);
      return false;
    } finally {
      setIsDateValidationLoading(false);
    }
  };

  // Validate dates whenever they change
  useEffect(() => {
    if (checkInDate && checkOutDate && formData.apartment) {
      validateDateSelection();
    } else {
      setIsDateValid(false);
      setDateValidationError('');
    }
  }, [checkInDate, checkOutDate, formData.apartment]);

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
      const priceString = selectedApartment.price;
      const priceMatch = priceString.match(/[\d,]+/);
      const pricePerNight = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
      
      setFormData(prev => ({
        ...prev,
        apartment: apartmentId,
        stayDetails: {
          ...prev.stayDetails,
          pricePerNight
        }
      }));
    }
  };

  const nextStep = async () => {
    // Validate dates on step 3 before proceeding
    if (currentStep === 3) {
      if (!isDateValid) {
        await validateDateSelection();
        return;
      }
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          firstName: '', lastName: '', email: '', phone: '', apartment: '',
          stayDetails: { checkInDate: '', checkOutDate: '', numberOfGuests: 1, numberOfNights: 0, totalAmount: 0, pricePerNight: 0 },
          paymentDetails: { paymentMethod: 'Bank Transfer', paymentStatus: 'Pending', amountPaid: 0, transactionReference: '' },
          specialRequests: '', emergencyContact: { name: '', phone: '', relationship: '' }
        });
        setCurrentStep(1);
      } else {
        alert(data.error || 'Failed to create booking');
      }
    } catch (error) {
      alert('Error creating booking');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const paymentMethodOptions = [
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Cash', label: 'Cash' },
    { value: 'Credit Card', label: 'Credit Card' },
    { value: 'Online Payment', label: 'Online Payment' }
  ];

  const paymentStatusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Partial', label: 'Partial' }
  ];

  const formatDateRange = (range) => {
    const startDate = new Date(range.start);
    const endDate = new Date(range.end);
    
    return `${startDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })} - ${endDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })}`;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="+234 901 234 5678"
              />
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Emergency Contact</h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={formData.emergencyContact.name}
                  onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                  className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Contact Name"
                />
                <input
                  type="tel"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                  className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Contact Phone"
                />
              </div>
              <input
                type="text"
                value={formData.emergencyContact.relationship}
                onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Relationship (e.g., Father, Friend)"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Apartment</label>
              <CustomDropdown
                options={apartments.map(apt => ({
                  value: apt._id,
                  label: `${apt.title} - ${apt.location} (${apt.price})`
                }))}
                value={formData.apartment}
                onChange={handleApartmentChange}
                placeholder="Choose an apartment"
              />
            </div>
            
            {formData.apartment && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                {(() => {
                  const selectedApt = apartments.find(apt => apt._id === formData.apartment);
                  return selectedApt ? (
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedApt.title}</h4>
                      <p className="text-sm text-gray-600">{selectedApt.location}</p>
                      <p className="text-sm text-gray-600">{selectedApt.bedrooms}BR / {selectedApt.bathrooms}BA - {selectedApt.area}</p>
                      <p className="text-sm font-medium text-purple-600">{selectedApt.price}</p>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
              <textarea
                rows="3"
                value={formData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Any special requests or requirements..."
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            {/* Unavailable Date Ranges Display */}
            {formData.apartment && unavailableRanges.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                  <h4 className="text-sm font-medium text-red-800">Unavailable Date Ranges</h4>
                </div>
                <div className="text-sm text-red-700">
                  <p className="mb-2">The following dates are already booked:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {unavailableRanges.map((range, index) => (
                      <div key={index} className="bg-red-100 px-3 py-2 rounded text-xs">
                        {formatDateRange(range)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Date Selection Error */}
            {dateValidationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                  <p className="text-sm text-red-700">{dateValidationError}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
                <CustomCalendar
                  selectedDate={checkInDate}
                  onDateSelect={(date) => {
                    setCheckInDate(date);
                    setDateValidationError('');
                    setIsDateValid(false);
                  }}
                  apartmentId={formData.apartment}
                  placeholder="Select check-in date"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
                <CustomCalendar
                  selectedDate={checkOutDate}
                  onDateSelect={(date) => {
                    setCheckOutDate(date);
                    setDateValidationError('');
                    setIsDateValid(false);
                  }}
                  apartmentId={formData.apartment}
                  minDate={checkInDate ? new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000) : null}
                  placeholder="Select check-out date"
                  className="w-full"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.stayDetails.numberOfGuests || ''}
                onChange={(e) => handleInputChange('stayDetails.numberOfGuests', parseInt(e.target.value) || 1)}
                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {formData.stayDetails.numberOfNights > 0 && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Stay Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex text-gray-700 justify-between">
                    <span>Number of nights:</span>
                    <span>{formData.stayDetails.numberOfNights}</span>
                  </div>
                  <div className="flex text-gray-700 justify-between">
                    <span>Price per night:</span>
                    <span>₦{formData.stayDetails.pricePerNight?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium text-purple-600 pt-2 border-t">
                    <span>Total Amount:</span>
                    <span>₦{formData.stayDetails.totalAmount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Availability Confirmation */}
            {isDateValidationLoading && checkInDate && checkOutDate && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <p className="text-sm text-blue-700 font-medium">
                    Checking availability...
                  </p>
                </div>
              </div>
            )}

            {!isDateValidationLoading && checkInDate && checkOutDate && !dateValidationError && isDateValid && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <p className="text-sm text-green-700 font-medium">
                    Selected dates are available for booking
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <CustomDropdown
                options={paymentMethodOptions}
                value={formData.paymentDetails.paymentMethod}
                onChange={(value) => handleInputChange('paymentDetails.paymentMethod', value)}
                placeholder="Select payment method"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <CustomDropdown
                options={paymentStatusOptions}
                value={formData.paymentDetails.paymentStatus}
                onChange={(value) => handleInputChange('paymentDetails.paymentStatus', value)}
                placeholder="Select payment status"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
              <input
                type="number"
                min="0"
                value={formData.paymentDetails.amountPaid || ''}
                onChange={(e) => handleInputChange('paymentDetails.amountPaid', parseFloat(e.target.value) || 0)}
                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Reference (Optional)</label>
              <input
                type="text"
                value={formData.paymentDetails.transactionReference}
                onChange={(e) => handleInputChange('paymentDetails.transactionReference', e.target.value)}
                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="TXN123456789"
              />
            </div>

            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Payment Summary</h4>
              <div className="space-y-1 text-gray-700 text-sm">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span>₦{formData.stayDetails.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="flex text-gray-700 justify-between">
                  <span>Amount Paid:</span>
                  <span>₦{formData.paymentDetails.amountPaid?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Balance:</span>
                  <span className={`${(formData.stayDetails.totalAmount - formData.paymentDetails.amountPaid) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₦{(formData.stayDetails.totalAmount - formData.paymentDetails.amountPaid)?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-[80vw] h-[90vh] max-w-4xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Create New Booking</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    isActive ? 'border-purple-600 bg-purple-600 text-white' :
                    isCompleted ? 'border-green-600 bg-green-600 text-white' :
                    'border-gray-300 text-gray-400'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`ml-2 text-xs font-medium ${
                    isActive || isCompleted ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </button>
          
          <span className="text-sm text-gray-500">
            Step {currentStep} of {steps.length}
          </span>
          
          {currentStep < steps.length ? (
            <button
              onClick={nextStep}
              disabled={currentStep === 3 && (!checkInDate || !checkOutDate || dateValidationError || !isDateValid || isDateValidationLoading)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
