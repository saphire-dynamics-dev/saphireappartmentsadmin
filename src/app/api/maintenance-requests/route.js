import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MaintenanceRequest from '@/models/MaintenanceRequest';

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const apartmentId = searchParams.get('apartmentId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;
    if (category && category !== 'all') query.issueCategory = category;
    if (apartmentId) query.apartment = apartmentId;
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const maintenanceRequests = await MaintenanceRequest.find(query)
      .populate('apartment', 'title location images')
      .populate('requester.tenant', 'firstName lastName email phone')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await MaintenanceRequest.countDocuments(query);
    
    // Get status counts
    const statusCounts = await MaintenanceRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get priority counts
    const priorityCounts = await MaintenanceRequest.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);
    
    return NextResponse.json({
      success: true,
      data: maintenanceRequests,
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
      }, {}),
      priorityCounts: priorityCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch maintenance requests' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.apartment || !body.requester || !body.title || !body.description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const maintenanceRequest = new MaintenanceRequest(body);
    await maintenanceRequest.save();
    
    // Populate the created request
    await maintenanceRequest.populate([
      { path: 'apartment', select: 'title location images' },
      { path: 'requester.tenant', select: 'firstName lastName email phone' }
    ]);
    
    return NextResponse.json({
      success: true,
      data: maintenanceRequest,
      message: 'Maintenance request created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { success: false, error: `Validation error: ${validationErrors.join(', ')}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create maintenance request' },
      { status: 500 }
    );
  }
}
