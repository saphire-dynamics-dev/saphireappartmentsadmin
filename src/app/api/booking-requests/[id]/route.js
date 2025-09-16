import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BookingRequest from '@/models/BookingRequest';
import mongoose from 'mongoose';
import { sendBookingStatusEmail } from '@/lib/emailService';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking request ID' },
        { status: 400 }
      );
    }
    
    const bookingRequest = await BookingRequest.findById(id)
      .populate('property', 'title location images price type')
      .lean();
    
    if (!bookingRequest) {
      return NextResponse.json(
        { success: false, error: 'Booking request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: bookingRequest
    });
  } catch (error) {
    console.error('Error fetching booking request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking request' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    const body = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking request ID' },
        { status: 400 }
      );
    }
    
    // Get the current booking request to check for status changes
    const currentBookingRequest = await BookingRequest.findById(id);
    if (!currentBookingRequest) {
      return NextResponse.json(
        { success: false, error: 'Booking request not found' },
        { status: 404 }
      );
    }
    
    const oldStatus = currentBookingRequest.status;
    const newStatus = body.status;
    
    const bookingRequest = await BookingRequest.findByIdAndUpdate(
      id,
      { 
        ...body,
        responseDate: new Date(),
        respondedBy: 'Admin' // You can get this from session
      },
      { new: true, runValidators: true }
    ).populate('property', 'title location images price type');
    
    // Send email notification if status changed to Approved or Rejected
    if (oldStatus !== newStatus && (newStatus === 'Approved' || newStatus === 'Rejected')) {
      try {
        const emailResult = await sendBookingStatusEmail(
          bookingRequest, 
          newStatus, 
          body.rejectionReason || body.adminNotes || ''
        );
        
        if (emailResult.success) {
          console.log(`${newStatus} email sent successfully to ${bookingRequest.guestDetails.email}`);
          
          // Add communication log
          await BookingRequest.findByIdAndUpdate(id, {
            $push: {
              communications: {
                type: 'Email',
                message: `${newStatus} notification email sent to guest`,
                sentBy: 'System'
              }
            }
          });
        } else {
          console.error('Failed to send email:', emailResult.error);
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the request if email fails, just log it
      }
    }
    
    return NextResponse.json({
      success: true,
      data: bookingRequest,
      message: 'Booking request updated successfully'
    });
  } catch (error) {
    console.error('Error updating booking request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update booking request' },
      { status: 500 }
    );
  }
}
