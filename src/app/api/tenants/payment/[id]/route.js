import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Tenant from '@/models/Tenant';
import mongoose from 'mongoose';

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    const { amountPaid, paymentMethod, paymentStatus, transactionReference } = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking ID' },
        { status: 400 }
      );
    }
    
    const tenant = await Tenant.findById(id);
    
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Guest booking not found' },
        { status: 404 }
      );
    }
    
    // Update payment details
    if (amountPaid !== undefined) {
      tenant.paymentDetails.amountPaid = amountPaid;
    }
    if (paymentMethod) {
      tenant.paymentDetails.paymentMethod = paymentMethod;
    }
    if (paymentStatus) {
      tenant.paymentDetails.paymentStatus = paymentStatus;
    }
    if (transactionReference) {
      tenant.paymentDetails.transactionReference = transactionReference;
    }
    
    // Set payment date if status is paid
    if (paymentStatus === 'Paid') {
      tenant.paymentDetails.paymentDate = new Date();
    }
    
    await tenant.save();
    await tenant.populate('apartment', 'title location');
    
    return NextResponse.json({
      success: true,
      data: tenant,
      message: 'Payment details updated successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update payment details' },
      { status: 500 }
    );
  }
}
