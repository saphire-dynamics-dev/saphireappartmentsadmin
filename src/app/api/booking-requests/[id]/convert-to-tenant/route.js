import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BookingRequest from '@/models/BookingRequest';
import Tenant from '@/models/Tenant';
import Apartment from '@/models/Apartment';
import mongoose from 'mongoose';

export async function POST(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    const conversionData = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking request ID' },
        { status: 400 }
      );
    }
    
    // Get the booking request
    const bookingRequest = await BookingRequest.findById(id);
    if (!bookingRequest) {
      return NextResponse.json(
        { success: false, error: 'Booking request not found' },
        { status: 404 }
      );
    }
    
    if (bookingRequest.status !== 'Approved') {
      return NextResponse.json(
        { success: false, error: 'Booking request must be approved before conversion' },
        { status: 400 }
      );
    }
    
    // Check if apartment exists and is available
    const apartment = await Apartment.findById(bookingRequest.property);
    if (!apartment) {
      return NextResponse.json(
        { success: false, error: 'Associated apartment not found' },
        { status: 404 }
      );
    }
    
    // Create tenant from booking request data
    const tenantData = {
      // Personal Information
      firstName: bookingRequest.guestDetails.firstName,
      lastName: bookingRequest.guestDetails.lastName,
      email: bookingRequest.guestDetails.email,
      phone: bookingRequest.guestDetails.phone,
      
      // Property Assignment
      apartment: bookingRequest.property,
      
      // Stay Details
      stayDetails: {
        checkInDate: bookingRequest.bookingDetails.checkInDate,
        checkOutDate: bookingRequest.bookingDetails.checkOutDate,
        numberOfGuests: bookingRequest.bookingDetails.numberOfGuests,
        numberOfNights: bookingRequest.bookingDetails.numberOfNights,
        totalAmount: bookingRequest.bookingDetails.totalAmount,
        pricePerNight: bookingRequest.bookingDetails.pricePerNight
      },
      
      // Payment Details
      paymentDetails: {
        paymentMethod: conversionData.paymentDetails.paymentMethod,
        paymentStatus: conversionData.paymentDetails.paymentStatus,
        amountPaid: conversionData.paymentDetails.amountPaid || 0,
        paymentDate: conversionData.paymentDetails.paymentStatus === 'Paid' ? new Date() : null
      },
      
      // Emergency Contact
      emergencyContact: conversionData.emergencyContact,
      
      // National Identification Number
      nin: conversionData.nin,
      
      // Status
      status: 'Confirmed',
      
      // Special Requests
      specialRequests: bookingRequest.specialRequests || ''
    };
    
    // Create the tenant
    const tenant = new Tenant(tenantData);
    await tenant.save();
    
    // Update booking request status and link to tenant
    bookingRequest.status = 'Converted';
    bookingRequest.convertedToTenant = tenant._id;
    bookingRequest.responseDate = new Date();
    bookingRequest.respondedBy = 'Admin';
    if (conversionData.adminNotes) {
      bookingRequest.adminNotes = conversionData.adminNotes;
    }
    await bookingRequest.save();
    
    // Update apartment current tenant and status
    apartment.currentTenant = tenant._id;
    apartment.status = 'Occupied';
    await apartment.save();
    
    return NextResponse.json({
      success: true,
      data: {
        tenant: tenant,
        bookingRequest: bookingRequest
      },
      message: 'Booking request successfully converted to tenant'
    });
  } catch (error) {
    console.error('Error converting booking request to tenant:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { success: false, error: `Validation error: ${validationErrors.join(', ')}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to convert booking request to tenant' },
      { status: 500 }
    );
  }
}
