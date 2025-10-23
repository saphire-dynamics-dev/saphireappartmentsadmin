import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import BookingRequest from '@/models/BookingRequest';
import Tenant from '@/models/Tenant';

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const customer = searchParams.get('customer');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.type = type;
    if (customer) {
      query.$or = [
        { 'customer.email': { $regex: customer, $options: 'i' } },
        { 'customer.firstName': { $regex: customer, $options: 'i' } },
        { 'customer.lastName': { $regex: customer, $options: 'i' } }
      ];
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const transactions = await Transaction.find(query)
      .populate('bookingRequest', 'propertyTitle guestDetails')
      .populate('tenant', 'firstName lastName email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Transaction.countDocuments(query);
    
    // Get status counts
    const statusCounts = await Transaction.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get revenue summary
    const revenuePipeline = [
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          successfulRevenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'success'] }, '$amount', 0]
            }
          },
          pendingRevenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
            }
          },
          totalTransactions: { $sum: 1 },
          successfulTransactions: {
            $sum: {
              $cond: [{ $eq: ['$status', 'success'] }, 1, 0]
            }
          }
        }
      }
    ];
    
    const revenueResult = await Transaction.aggregate(revenuePipeline);
    const revenueSummary = revenueResult[0] || {
      totalRevenue: 0,
      successfulRevenue: 0,
      pendingRevenue: 0,
      totalTransactions: 0,
      successfulTransactions: 0
    };
    
    // Calculate average transaction from successful payments
    revenueSummary.averageTransaction = revenueSummary.successfulTransactions > 0 
      ? revenueSummary.successfulRevenue / revenueSummary.successfulTransactions 
      : 0;

    return NextResponse.json({
      success: true,
      data: transactions,
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
      revenueSummary: revenueSummary
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
