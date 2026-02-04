import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Tenant from '@/models/Tenant';
import mongoose from 'mongoose';

export async function POST(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const { checkInDate, checkOutDate, excludeBookingId } = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid apartment ID' },
        { status: 400 }
      );
    }

    if (!checkInDate || !checkOutDate) {
      return NextResponse.json(
        { success: false, error: 'Check-in and check-out dates are required' },
        { status: 400 }
      );
    }

    console.log('Checking availability for apartment:', id);
    console.log('Date range:', checkInDate, 'to', checkOutDate);

    // Build query to check for conflicting bookings
    // A conflict occurs when:
    // - New booking starts before existing booking ends AND
    // - New booking ends after existing booking starts
    const query = {
      apartment: id,
      $or: [
        {
          'stayDetails.checkInDate': {
            $lt: new Date(checkOutDate) // New booking checkout must be after existing checkin
          },
          'stayDetails.checkOutDate': {
            $gt: new Date(checkInDate) // Existing checkout must be after new checkin
          }
        }
      ],
      status: { $in: ['Confirmed', 'Checked-In'] }
    };

    // Exclude a specific booking if provided (useful for editing existing bookings)
    if (excludeBookingId && mongoose.Types.ObjectId.isValid(excludeBookingId)) {
      query._id = { $ne: excludeBookingId };
    }

    const conflictingBooking = await Tenant.findOne(query)
      .select('stayDetails.checkInDate stayDetails.checkOutDate firstName lastName');

    console.log('Conflicting booking found:', conflictingBooking);

    if (conflictingBooking) {
      return NextResponse.json({
        success: false,
        error: 'Apartment is already booked for these dates',
        conflictingBooking: {
          guestName: `${conflictingBooking.firstName} ${conflictingBooking.lastName}`,
          stayDetails: {
            checkInDate: conflictingBooking.stayDetails.checkInDate,
            checkOutDate: conflictingBooking.stayDetails.checkOutDate
          }
        }
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Dates are available'
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}
