import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Apartment from '@/models/Apartment';
import Tenant from '@/models/Tenant';
import Transaction from '@/models/Transaction';
import MaintenanceRequest from '@/models/MaintenanceRequest';

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '6months'; // 1month, 3months, 6months, 1year
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '1month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 6);
    }
    
    // Get occupancy rate
    const totalApartments = await Apartment.countDocuments();
    const occupiedApartments = await Apartment.countDocuments({ status: 'Occupied' });
    const occupancyRate = totalApartments > 0 ? Math.round((occupiedApartments / totalApartments) * 100) : 0;
    
    // Get collection rate (successful payments vs total payments)
    const totalTransactions = await Transaction.countDocuments({
      createdAt: { $gte: startDate }
    });
    const successfulTransactions = await Transaction.countDocuments({
      status: 'success',
      createdAt: { $gte: startDate }
    });
    const collectionRate = totalTransactions > 0 ? Math.round((successfulTransactions / totalTransactions) * 100) : 0;
    
    // Get average rent from successful transactions
    const avgRentResult = await Transaction.aggregate([
      {
        $match: {
          status: 'success',
          type: { $in: ['booking_payment', 'rent'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          averageAmount: { $avg: '$amount' }
        }
      }
    ]);
    const avgRent = avgRentResult.length > 0 ? avgRentResult[0].averageAmount / 100 : 0; // Convert from kobo
    
    // Get maintenance costs
    const maintenanceCosts = await MaintenanceRequest.aggregate([
      {
        $match: {
          status: 'Completed',
          actualCost: { $exists: true, $gt: 0 },
          completedDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$actualCost' }
        }
      }
    ]);
    const totalMaintenanceCost = maintenanceCosts.length > 0 ? maintenanceCosts[0].totalCost : 0;
    
    // Get revenue trends (monthly breakdown)
    const revenueByMonth = await Transaction.aggregate([
      {
        $match: {
          status: 'success',
          paidAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paidAt' },
            month: { $month: '$paidAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    // Get maintenance costs by month
    const maintenanceByMonth = await MaintenanceRequest.aggregate([
      {
        $match: {
          status: 'Completed',
          actualCost: { $exists: true, $gt: 0 },
          completedDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$completedDate' },
            month: { $month: '$completedDate' }
          },
          cost: { $sum: '$actualCost' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    // Get occupancy trends
    const occupancyTrends = await Tenant.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          checkIns: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    // Get property type distribution
    const propertyTypes = await Apartment.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get maintenance by category
    const maintenanceByCategory = await MaintenanceRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$issueCategory',
          count: { $sum: 1 },
          totalCost: { $sum: { $ifNull: ['$actualCost', '$estimatedCost'] } }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        overview: {
          occupancyRate,
          collectionRate,
          avgRent,
          totalMaintenanceCost
        },
        revenueByMonth: revenueByMonth.map(item => ({
          month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
          revenue: item.revenue / 100, // Convert from kobo
          count: item.count
        })),
        maintenanceByMonth: maintenanceByMonth.map(item => ({
          month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
          cost: item.cost,
          count: item.count
        })),
        occupancyTrends: occupancyTrends.map(item => ({
          month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
          checkIns: item.checkIns
        })),
        propertyTypes,
        maintenanceByCategory
      }
    });
  } catch (error) {
    console.error('Error fetching reports data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports data' },
      { status: 500 }
    );
  }
}
