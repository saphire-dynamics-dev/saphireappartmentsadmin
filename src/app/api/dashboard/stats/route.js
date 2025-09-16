import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Apartment from '@/models/Apartment';
import Tenant from '@/models/Tenant';
import Transaction from '@/models/Transaction';
import BookingRequest from '@/models/BookingRequest';
import MaintenanceRequest from '@/models/MaintenanceRequest';

export async function GET() {
  try {
    await dbConnect();

    // Get current month start and end dates
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get total apartments
    const totalApartments = await Apartment.countDocuments();

    // Get active tenants (Confirmed or Checked-In)
    const activeTenants = await Tenant.countDocuments({
      status: { $in: ['Confirmed', 'Checked-In'] }
    });

    // Calculate monthly revenue from successful transactions
    const monthlyRevenueResult = await Transaction.aggregate([
      {
        $match: {
          status: 'success',
          paidAt: {
            $gte: monthStart,
            $lte: monthEnd
          }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]);

    // Convert from kobo to naira (Paystack uses kobo)
    const monthlyRevenue = monthlyRevenueResult.length > 0 
      ? monthlyRevenueResult[0].totalRevenue / 100 
      : 0;

    // Get open maintenance requests
    const openRequests = await MaintenanceRequest.countDocuments({
      status: { $nin: ['Completed', 'Cancelled'] }
    });

    // Calculate occupancy rate
    const occupiedApartments = await Apartment.countDocuments({ status: 'Occupied' });
    const occupancyRate = totalApartments > 0 ? Math.round((occupiedApartments / totalApartments) * 100) : 0;

    // Get available units
    const availableUnits = await Apartment.countDocuments({ status: 'Available' });

    // Calculate on-time payments (assuming most payments are on-time for now)
    const totalPayments = await Transaction.countDocuments({ status: 'success' });
    const onTimePayments = totalPayments > 0 ? 95 : 0; // Mock percentage

    // Get recent activity
    const recentActivity = [];
    
    // Recent successful transactions
    const recentTransactions = await Transaction.find({ status: 'success' })
      .sort({ paidAt: -1 })
      .limit(3)
      .select('customer.firstName customer.lastName amount paidAt')
      .lean();

    recentTransactions.forEach(transaction => {
      recentActivity.push({
        action: `Payment received from ${transaction.customer.firstName} ${transaction.customer.lastName} - ₦${(transaction.amount / 100).toLocaleString()}`,
        timestamp: transaction.paidAt
      });
    });

    // Recent tenant check-ins
    const recentCheckIns = await Tenant.find({ status: 'Checked-In' })
      .sort({ updatedAt: -1 })
      .limit(2)
      .select('firstName lastName updatedAt')
      .lean();

    recentCheckIns.forEach(tenant => {
      recentActivity.push({
        action: `${tenant.firstName} ${tenant.lastName} checked in`,
        timestamp: tenant.updatedAt
      });
    });

    // Recent booking requests
    const recentBookings = await BookingRequest.find({ status: 'Pending' })
      .sort({ createdAt: -1 })
      .limit(2)
      .select('guestDetails.firstName guestDetails.lastName createdAt')
      .lean();

    recentBookings.forEach(booking => {
      recentActivity.push({
        action: `New booking request from ${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`,
        timestamp: booking.createdAt
      });
    });

    // Sort recent activity by timestamp (most recent first)
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return NextResponse.json({
      success: true,
      data: {
        totalApartments,
        activeTenants,
        monthlyRevenue,
        openRequests,
        occupancyRate,
        onTimePayments,
        availableUnits,
        recentActivity: recentActivity.slice(0, 10) // Limit to 10 most recent activities
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
