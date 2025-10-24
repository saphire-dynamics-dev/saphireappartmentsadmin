import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DiscountCode from '@/models/DiscountCode';
import Transaction from '@/models/Transaction';
export async function POST(request) {
  try {
    await dbConnect();
    const { code, orderAmount, userId } = await request.json();
    
    const discountCode = await DiscountCode.findOne({ 
      code: code.toUpperCase(),
      isActive: true 
    });
    
    if (!discountCode) {
      return NextResponse.json(
        { error: 'Invalid discount code' },
        { status: 400 }
      );
    }
    
    // Check if expired
    if (new Date() > discountCode.expiryDate) {
      return NextResponse.json(
        { error: 'Discount code has expired' },
        { status: 400 }
      );
    }
    
    // Check if fully used
    if (discountCode.currentUsageCount >= discountCode.maxUsageCount) {
      return NextResponse.json(
        { error: 'Discount code has been fully used' },
        { status: 400 }
      );
    }
    
    // Check minimum order amount
    if (orderAmount < discountCode.minOrderAmount) {
      return NextResponse.json(
        { error: `Minimum order amount of $${discountCode.minOrderAmount} required` },
        { status: 400 }
      );
    }
    
    // Check if user has already used this code (for one-time codes)
    const hasUsed = discountCode.usedBy.some(usage => 
      usage.userId?.toString() === userId
    );
    
    if (hasUsed && discountCode.maxUsageCount === 1) {
      return NextResponse.json(
        { error: 'You have already used this discount code' },
        { status: 400 }
      );
    }
    
    // Calculate discount amount
    let discountAmount;
    if (discountCode.discountType === 'percentage') {
      discountAmount = (orderAmount * discountCode.discountValue) / 100;
      if (discountCode.maxDiscountAmount && discountAmount > discountCode.maxDiscountAmount) {
        discountAmount = discountCode.maxDiscountAmount;
      }
    } else {
      discountAmount = Math.min(discountCode.discountValue, orderAmount);
    }
    
    return NextResponse.json({
      valid: true,
      discountAmount,
      finalAmount: orderAmount - discountAmount,
      code: discountCode.code,
      description: discountCode.description
    });
    
  } catch (error) {
    console.error('Error validating discount code:', error);
    return NextResponse.json(
      { error: 'Failed to validate discount code' },
      { status: 500 }
    );
  }
}
