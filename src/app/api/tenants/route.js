import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Tenant from '@/models/Tenant';
import Apartment from '@/models/Apartment';

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const paymentStatus = searchParams.get('paymentStatus');
    
    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query['paymentDetails.paymentStatus'] = paymentStatus;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const tenants = await Tenant.find(query)
      .populate('apartment', 'title location price type')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Tenant.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: tenants,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    // Validate apartment exists
    const apartment = await Apartment.findById(body.apartment);
    if (!apartment) {
      return NextResponse.json(
        { success: false, error: 'Apartment not found' },
        { status: 400 }
      );
    }
    
    // Check for conflicting bookings using proper date overlap logic
    const conflictingBooking = await Tenant.findOne({
      apartment: body.apartment,
      $or: [
        {
          'stayDetails.checkInDate': {
            $lt: new Date(body.stayDetails.checkOutDate) // Changed from $lte to $lt
          },
          'stayDetails.checkOutDate': {
            $gt: new Date(body.stayDetails.checkInDate) // Changed from $gte to $gt
          }
        }
      ],
      status: { $in: ['Confirmed', 'Checked-In'] }
    });
    
    if (conflictingBooking) {
      return NextResponse.json(
        { success: false, error: 'Apartment is already booked for these dates' },
        { status: 400 }
      );
    }
    
    const tenant = new Tenant(body);
    await tenant.save();
    
    // Populate apartment details for response
    await tenant.populate('apartment', 'title location price type');
    
    return NextResponse.json({
      success: true,
      data: tenant,
      message: 'Guest booking created successfully'
    }, { status: 201 });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create guest booking' },
      { status: 500 }
    );
  }
}
