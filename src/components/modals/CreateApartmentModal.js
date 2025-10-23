'use client';
import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Building, MapPin, DollarSign, Home, FileText, Image, Phone, CreditCard } from 'lucide-react';
import CustomDropdown from '@/components/ui/CustomDropdown';
import ImageUpload from '@/components/ui/ImageUpload';

export default function CreateApartmentModal({ isOpen, onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    price: '',
    bedrooms: 1,
    bathrooms: 1,
    area: '',
    type: 'Shortlet',
    description: '',
    features: [],
    images: [],
    amenities: [],
    rules: [],
    contact: {
      phone: '',
      email: '',
      whatsapp: ''
    },
    bankDetails: {
      bankName: '',
      accountNumber: '',
      accountName: ''
    }
  });

  const steps = [
    { id: 1, title: 'Basic Info', icon: Building },
    { id: 2, title: 'Details', icon: Home },
    { id: 3, title: 'Description', icon: FileText },
    { id: 4, title: 'Features', icon: MapPin },
    { id: 5, title: 'Images', icon: Image },
    { id: 6, title: 'Contact', icon: Phone },
    { id: 7, title: 'Bank Details', icon: CreditCard }
  ];

  const commonFeatures = [
    '24/7 Electricity', 'Air Conditioning', 'Fully Furnished', 'High-Speed Wi-Fi',
    'Secure Estate', 'Hot Water', 'Refrigerator', 'Microwave', 'Dishwasher', 'Prepaid Meter'
  ];

  const commonAmenities = [
    'Swimming Pool', 'Gym', '24/7 Security', 'Parking Space', 'Elevator',
    'Backup Generator', 'Water Supply', 'Waste Management'
  ];

  const commonRules = [
    'No smoking inside the apartment', 'No pets allowed', 'Maximum 2 guests',
    'Check-in: 1:00 PM', 'Check-out: 12:00 PM', 'Quiet hours: 10:00 PM - 6:00 AM'
  ];

  const typeOptions = [
    { value: 'Shortlet', label: 'Shortlet' },
    { value: 'Rental', label: 'Rental' },
    { value: 'Sale', label: 'Sale' }
  ];

  const nigerianBanks = [
    'Access Bank',
    'Zenith Bank',
    'Guaranty Trust Bank (GTBank)',
    'First Bank of Nigeria',
    'United Bank for Africa (UBA)',
    'Fidelity Bank',
    'Union Bank of Nigeria',
    'Stanbic IBTC Bank',
    'Sterling Bank',
    'Ecobank Nigeria',
    'Wema Bank',
    'Polaris Bank',
    'Unity Bank',
    'Keystone Bank',
    'FCMB (First City Monument Bank)',
    'Jaiz Bank',
    'Heritage Bank',
    'Providus Bank',
    'SunTrust Bank',
    'Titan Trust Bank'
  ];

  const bankOptions = nigerianBanks.map(bank => ({
    value: bank,
    label: bank
  }));

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

  const handleArrayToggle = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const handleImagesChange = (newImages) => {
    setFormData(prev => ({
      ...prev,
      images: newImages // Store full image objects (with files for local images)
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }}

  const uploadImages = async (imageData) => {
    setUploadingImages(true);
    
    try {
      const uploadPromises = imageData.map(async (image) => {
        // If it's already uploaded (has url but no file), return the URL
        if (image.url && !image.isLocal) {
          return image.url;
        }
        
        // If it's a local file, upload it
        if (image.file && image.isLocal) {
          const formData = new FormData();
          formData.append('file', image.file);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();
          
          if (data.success) {
            // Clean up local preview URL
            if (image.url) {
              URL.revokeObjectURL(image.url);
            }
            return data.url;
          } else {
            throw new Error(data.error || 'Upload failed');
          }
        }
        
        return null;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      return uploadedUrls.filter(url => url !== null);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Upload images first
      let imageUrls = [];
      if (formData.images.length > 0) {
        imageUrls = await uploadImages(formData.images);
      }

      // Create apartment data with uploaded image URLs
      const apartmentData = {
        ...formData,
        images: imageUrls
      };

      const response = await fetch('/api/apartments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apartmentData),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          title: '', location: '', price: '', bedrooms: 1, bathrooms: 1,
          area: '', type: 'Shortlet', description: '', features: [],
          images: [], amenities: [], rules: [],
          contact: { phone: '', email: '', whatsapp: '' },
          bankDetails: { bankName: '', accountNumber: '', accountName: '' }
        });
        setCurrentStep(1);
      } else {
        alert(data.error || 'Failed to create apartment');
      }
    } catch (error) {
      alert('Error creating apartment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Luxury Shortlet Apartment"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Stargate Estate, Durumi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., ₦60,000/night"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <CustomDropdown
                options={typeOptions}
                value={formData.type}
                onChange={(value) => handleInputChange('type', value)}
                placeholder="Select apartment type"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                <input
                  type="number"
                  min="0"
                  value={formData.bedrooms || ''}
                  onChange={(e) => handleInputChange('bedrooms', e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                <input
                  type="number"
                  min="0"
                  value={formData.bathrooms || ''}
                  onChange={(e) => handleInputChange('bathrooms', e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => handleInputChange('area', e.target.value)}
                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., 65 sqm"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows="6"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Detailed description of the apartment..."
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Features</label>
              <div className="grid grid-cols-2 gap-2">
                {commonFeatures.map((feature) => (
                  <label key={feature} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.features.includes(feature)}
                      onChange={() => handleArrayToggle('features', feature)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{feature}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Amenities</label>
              <div className="grid grid-cols-2 gap-2">
                {commonAmenities.map((amenity) => (
                  <label key={amenity} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={() => handleArrayToggle('amenities', amenity)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Rules</label>
              <div className="space-y-2">
                {commonRules.map((rule) => (
                  <label key={rule} className="flex items-start">
                    <input
                      type="checkbox"
                      checked={formData.rules.includes(rule)}
                      onChange={() => handleArrayToggle('rules', rule)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 mt-1"
                    />
                    <span className="ml-2 text-sm text-gray-700">{rule}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <ImageUpload
              images={formData.images}
              onImagesChange={handleImagesChange}
              maxImages={10}
              uploading={uploadingImages}
            />
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.contact.phone}
                onChange={(e) => handleInputChange('contact.phone', e.target.value)}
                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="+234 901 234 5678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.contact.email}
                onChange={(e) => handleInputChange('contact.email', e.target.value)}
                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="info@saphireapartments.ng"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input
                type="tel"
                value={formData.contact.whatsapp}
                onChange={(e) => handleInputChange('contact.whatsapp', e.target.value)}
                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="+234 901 234 5678"
              />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Bank Account Information</h4>
              <p className="text-sm text-blue-700">
                Please provide the bank account details where payments for this apartment will be received.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name <span className="text-red-500">*</span>
              </label>
              <CustomDropdown
                options={bankOptions}
                value={formData.bankDetails.bankName}
                onChange={(value) => handleInputChange('bankDetails.bankName', value)}
                placeholder="Select bank"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bankDetails.accountNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  handleInputChange('bankDetails.accountNumber', value);
                }}
                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter 10-digit account number"
                maxLength="10"
                pattern="\d{10}"
              />
              {formData.bankDetails.accountNumber && formData.bankDetails.accountNumber.length !== 10 && (
                <p className="text-sm text-red-600 mt-1">Account number must be exactly 10 digits</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bankDetails.accountName}
                onChange={(e) => handleInputChange('bankDetails.accountName', e.target.value)}
                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter account holder name"
              />
            </div>

            {/* Bank Details Preview */}
            {formData.bankDetails.bankName && formData.bankDetails.accountNumber && formData.bankDetails.accountName && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Bank Details Summary</h5>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Bank:</span> {formData.bankDetails.bankName}</p>
                  <p><span className="font-medium">Account Number:</span> {formData.bankDetails.accountNumber}</p>
                  <p><span className="font-medium">Account Name:</span> {formData.bankDetails.accountName}</p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.location && formData.price && formData.type;
      case 2:
        return formData.bedrooms && formData.bathrooms && formData.area;
      case 3:
        return formData.description;
      case 4:
        return true; // Features are optional
      case 5:
        return true; // Images are optional
      case 6:
        return formData.contact.phone && formData.contact.email && formData.contact.whatsapp;
      case 7:
        return formData.bankDetails.bankName && 
               formData.bankDetails.accountNumber && 
               formData.bankDetails.accountNumber.length === 10 &&
               formData.bankDetails.accountName;
      default:
        return true;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-[80vw] h-[80vh] max-w-4xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Create New Apartment</h2>
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
              disabled={!isStepValid()}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || uploadingImages || !isStepValid()}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? (uploadingImages ? 'Uploading Images...' : 'Creating...') : 'Create Apartment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
