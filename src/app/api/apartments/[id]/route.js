import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Apartment from '@/models/Apartment';
import Tenant from '@/models/Tenant';
import mongoose from 'mongoose';
import { checkApartmentAvailability } from '../../../../../utils/availability';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid apartment ID' },
        { status: 400 }
      );
    }
    
    const apartment = await Apartment.findById(id)
      .populate('currentTenant', 'firstName lastName email phone')
      .lean();
    
    if (!apartment) {
      return NextResponse.json(
        { success: false, error: 'Apartment not found' },
        { status: 404 }
      );
    }
    
    // Fetch active tenants to check current availability
    const tenants = await Tenant.find({
      status: { $in: ['Confirmed', 'Checked-In'] }
    }).lean();
    
    // Update apartment status based on current bookings
    apartment.status = checkApartmentAvailability(apartment, tenants);
    
    return NextResponse.json({
      success: true,
      data: apartment
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch apartment' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const body = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid apartment ID' },
        { status: 400 }
      );
    }
    
    const apartment = await Apartment.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    ).populate('currentTenant', 'firstName lastName email phone');
    
    if (!apartment) {
      return NextResponse.json(
        { success: false, error: 'Apartment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: apartment,
      message: 'Apartment updated successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update apartment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid apartment ID' },
        { status: 400 }
      );
    }
    
    const apartment = await Apartment.findByIdAndDelete(id);
    
    if (!apartment) {
      return NextResponse.json(
        { success: false, error: 'Apartment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Apartment deleted successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete apartment' },
      { status: 500 }
    );
  }
}
