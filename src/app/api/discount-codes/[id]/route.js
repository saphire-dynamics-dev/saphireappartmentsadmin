import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DiscountCode from '@/models/DiscountCode';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const discountCode = await DiscountCode.findById(id);
    
    if (!discountCode) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(discountCode);
  } catch (error) {
    console.error('Error fetching discount code:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount code' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const data = await request.json();
    const { id } = await params;
    
    const discountCode = await DiscountCode.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    );
    
    if (!discountCode) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(discountCode);
  } catch (error) {
    console.error('Error updating discount code:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Discount code already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update discount code' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const discountCode = await DiscountCode.findByIdAndDelete(id);
    
    if (!discountCode) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Discount code deleted successfully' });
  } catch (error) {
    console.error('Error deleting discount code:', error);
    return NextResponse.json(
      { error: 'Failed to delete discount code' },
      { status: 500 }
    );
  }
}
