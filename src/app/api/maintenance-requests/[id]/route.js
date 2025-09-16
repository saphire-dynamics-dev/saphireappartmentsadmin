import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MaintenanceRequest from '@/models/MaintenanceRequest';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid maintenance request ID' },
        { status: 400 }
      );
    }
    
    const maintenanceRequest = await MaintenanceRequest.findById(id)
      .populate('apartment', 'title location images')
      .populate('requester.tenant', 'firstName lastName email phone')
      .lean();
    
    if (!maintenanceRequest) {
      return NextResponse.json(
        { success: false, error: 'Maintenance request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: maintenanceRequest
    });
  } catch (error) {
    console.error('Error fetching maintenance request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch maintenance request' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    const body = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid maintenance request ID' },
        { status: 400 }
      );
    }
    
    const maintenanceRequest = await MaintenanceRequest.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    )
      .populate('apartment', 'title location images')
      .populate('requester.tenant', 'firstName lastName email phone');
    
    if (!maintenanceRequest) {
      return NextResponse.json(
        { success: false, error: 'Maintenance request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: maintenanceRequest,
      message: 'Maintenance request updated successfully'
    });
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { success: false, error: `Validation error: ${validationErrors.join(', ')}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update maintenance request' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid maintenance request ID' },
        { status: 400 }
      );
    }
    
    const maintenanceRequest = await MaintenanceRequest.findByIdAndDelete(id);
    
    if (!maintenanceRequest) {
      return NextResponse.json(
        { success: false, error: 'Maintenance request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Maintenance request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting maintenance request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete maintenance request' },
      { status: 500 }
    );
  }
}
