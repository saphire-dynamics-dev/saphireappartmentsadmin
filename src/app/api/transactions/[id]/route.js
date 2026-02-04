import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction ID' },
        { status: 400 }
      );
    }
    
    const transaction = await Transaction.findById(id)
      .populate('bookingRequest', 'propertyTitle guestDetails')
      .populate('tenant', 'firstName lastName email');
    
    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const updateData = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction ID' },
        { status: 400 }
      );
    }
    
    const transaction = await Transaction.findById(id);
    
    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Track status changes for audit
    const oldStatus = transaction.status;
    const newStatus = updateData.status;

    // Update transaction fields
    if (updateData.status) transaction.status = updateData.status;
    if (updateData.paymentMethod) transaction.paymentMethod = updateData.paymentMethod;
    if (updateData.paidAt) transaction.paidAt = new Date(updateData.paidAt);
    
    // Add metadata for admin updates
    if (!transaction.metadata) transaction.metadata = {};
    transaction.metadata.adminUpdates = transaction.metadata.adminUpdates || [];
    transaction.metadata.adminUpdates.push({
      date: new Date(),
      oldStatus,
      newStatus,
      updatedBy: 'Admin',
      notes: updateData.adminNotes || `Status changed from ${oldStatus} to ${newStatus}`
    });

    await transaction.save();
    
    // Populate related data for response
    await transaction.populate('bookingRequest', 'propertyTitle guestDetails');
    await transaction.populate('tenant', 'firstName lastName email');
    
    return NextResponse.json({
      success: true,
      data: transaction,
      message: 'Transaction updated successfully'
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}
