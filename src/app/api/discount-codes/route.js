import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';

export async function GET() {
  try {
    await dbConnect();
    
    // Try to import the model, handle if it doesn't exist
    let DiscountCode;
    try {
      DiscountCode = (await import('@/models/DiscountCode')).default;
    } catch (modelError) {
      console.error('DiscountCode model not found:', modelError);
      return NextResponse.json([]);
    }
    
    const discountCodes = await DiscountCode.find({})
      .sort({ createdAt: -1 });
    
    return NextResponse.json(discountCodes || []);
  } catch (error) {
    console.error('Error fetching discount codes:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();
    
    // Try to import the model
    let DiscountCode;
    try {
      DiscountCode = (await import('@/models/DiscountCode')).default;
    } catch (modelError) {
      return NextResponse.json(
        { error: 'DiscountCode model not available' },
        { status: 500 }
      );
    }
    
    // Add createdBy as admin string
    data.createdBy = 'admin';
    
    const discountCode = new DiscountCode(data);
    await discountCode.save();
    
    return NextResponse.json(discountCode, { status: 201 });
  } catch (error) {
    console.error('Error creating discount code:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Discount code already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create discount code' },
      { status: 500 }
    );
  }
}
