import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AdminNotification from '@/models/AdminNotification';

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const isRead = searchParams.get('isRead');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    
    const query = {};
    if (isRead !== null && isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    if (type && type !== 'all') query.type = type;
    if (priority && priority !== 'all') query.priority = priority;
    
    const notifications = await AdminNotification.find(query)
      .populate('relatedRecords.bookingRequest', 'guestDetails propertyTitle')
      .populate('relatedRecords.tenant', 'firstName lastName')
      .populate('relatedRecords.apartment', 'title location')
      .populate('relatedRecords.transaction', 'amount customer')
      .populate('relatedRecords.maintenanceRequest', 'title priority')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await AdminNotification.countDocuments(query);
    const unreadCount = await AdminNotification.getUnreadCount();
    
    // Get type counts
    const typeCounts = await AdminNotification.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      unreadCount,
      typeCounts: typeCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const notification = await AdminNotification.createNotification(body);
    
    return NextResponse.json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'mark_all_read') {
      await AdminNotification.markAllAsRead();
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
