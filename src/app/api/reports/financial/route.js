import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import MaintenanceRequest from '@/models/MaintenanceRequest';

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const startDate = new Date(searchParams.get('startDate') || new Date(new Date().getFullYear(), 0, 1));
    const endDate = new Date(searchParams.get('endDate') || new Date());
    
    // Revenue breakdown
    const revenueBreakdown = await Transaction.aggregate([
      {
        $match: {
          status: 'success',
          paidAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Monthly financial summary
    const monthlyFinancials = await Transaction.aggregate([
      {
        $match: {
          status: 'success',
          paidAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paidAt' },
            month: { $month: '$paidAt' }
          },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    // Get maintenance expenses for the same period
    const maintenanceExpenses = await MaintenanceRequest.aggregate([
      {
        $match: {
          status: 'Completed',
          completedDate: { $gte: startDate, $lte: endDate },
          actualCost: { $exists: true, $gt: 0 }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$completedDate' },
            month: { $month: '$completedDate' }
          },
          expenses: { $sum: '$actualCost' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    // Total summary
    const totalRevenue = revenueBreakdown.reduce((sum, item) => sum + item.totalAmount, 0) / 100;
    const totalMaintenance = await MaintenanceRequest.aggregate([
      {
        $match: {
          status: 'Completed',
          completedDate: { $gte: startDate, $lte: endDate },
          actualCost: { $exists: true, $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$actualCost' }
        }
      }
    ]);
    
    const totalMaintenanceExpenses = totalMaintenance.length > 0 ? totalMaintenance[0].total : 0;
    const netIncome = totalRevenue - totalMaintenanceExpenses;
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalMaintenanceExpenses,
          netIncome,
          period: { startDate, endDate }
        },
        revenueBreakdown: revenueBreakdown.map(item => ({
          type: item._id,
          amount: item.totalAmount / 100,
          count: item.count
        })),
        monthlyFinancials: monthlyFinancials.map(item => ({
          month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
          revenue: item.revenue / 100,
          transactions: item.transactions
        })),
        maintenanceExpenses: maintenanceExpenses.map(item => ({
          month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
          expenses: item.expenses,
          count: item.count
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching financial report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch financial report' },
      { status: 500 }
    );
  }
}
