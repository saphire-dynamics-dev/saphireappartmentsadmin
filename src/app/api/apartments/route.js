import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Apartment from '@/models/Apartment';
import Tenant from '@/models/Tenant';
import { updateApartmentAvailability } from '../../../../utils/availability';

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    
    const apartments = await Apartment.find(query)
      .populate('currentTenant', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    // Fetch all active tenants to check availability
    const tenants = await Tenant.find({
      status: { $in: ['Confirmed', 'Checked-In'] }
    }).lean();
    
    // Update apartment availability status based on current bookings
    const apartmentsWithUpdatedStatus = updateApartmentAvailability(apartments, tenants);
    
    const total = await Apartment.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: apartmentsWithUpdatedStatus,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching apartments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch apartments' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    console.log("body");
    const apartment = new Apartment(body);
    await apartment.save();
    
    return NextResponse.json({
      success: true,
      data: apartment,
      message: 'Apartment created successfully'
    }, { status: 201 });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create apartment' },
      { status: 500 }
    );
  }
}
