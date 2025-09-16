import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BookingRequest from '@/models/BookingRequest';

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const bookingRequests = await BookingRequest.find(query)
      .populate('property', 'title location images price type')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await BookingRequest.countDocuments(query);
    
    // Get status counts
    const statusCounts = await BookingRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    return NextResponse.json({
      success: true,
      data: bookingRequests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching booking requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking requests' },
      { status: 500 }
    );
  }
}
