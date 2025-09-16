'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { BarChart3, Download, Calendar, TrendingUp, DollarSign, Wrench, Home } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Reports() {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('6months');

  const periodOptions = [
    { value: '1month', label: 'Last Month' },
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '1year', label: 'Last Year' }
  ];

  useEffect(() => {
    fetchReportsData();
  }, [period]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reports/dashboard?period=${period}`);
      const data = await response.json();
      
      if (data.success) {
        setReportsData(data.data);
      }
    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthLabel = (monthString) => {
    const [year, month] = monthString.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Chart configurations
  const revenueChartData = {
    labels: reportsData?.revenueByMonth.map(item => getMonthLabel(item.month)) || [],
    datasets: [
      {
        label: 'Revenue',
        data: reportsData?.revenueByMonth.map(item => item.revenue) || [],
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const maintenanceChartData = {
    labels: reportsData?.maintenanceByMonth.map(item => getMonthLabel(item.month)) || [],
    datasets: [
      {
        label: 'Maintenance Costs',
        data: reportsData?.maintenanceByMonth.map(item => item.cost) || [],
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderColor: 'rgb(249, 115, 22)',
        borderWidth: 1,
      },
    ],
  };

  const propertyTypesData = {
    labels: reportsData?.propertyTypes.map(item => item._id) || [],
    datasets: [
      {
        data: reportsData?.propertyTypes.map(item => item.count) || [],
        backgroundColor: [
          'rgba(147, 51, 234, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const maintenanceCategoryData = {
    labels: reportsData?.maintenanceByCategory.slice(0, 5).map(item => item._id) || [],
    datasets: [
      {
        label: 'Requests',
        data: reportsData?.maintenanceByCategory.slice(0, 5).map(item => item.count) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reports...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6 text-purple-600 mr-2" />
            <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-48">
              <CustomDropdown
                options={periodOptions}
                value={period}
                onChange={setPeriod}
                placeholder="Select period"
              />
            </div>
            <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {reportsData?.overview.occupancyRate || 0}%
                </p>
              </div>
              <Home className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {reportsData?.overview.collectionRate || 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Transaction</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(reportsData?.overview.avgRent || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Maintenance Cost</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(reportsData?.overview.totalMaintenanceCost || 0)}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trends */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trends</h3>
            <div className="h-64">
              {reportsData?.revenueByMonth.length > 0 ? (
                <Line data={revenueChartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No revenue data available
                </div>
              )}
            </div>
          </div>

          {/* Maintenance Costs */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance Costs</h3>
            <div className="h-64">
              {reportsData?.maintenanceByMonth.length > 0 ? (
                <Bar data={maintenanceChartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No maintenance data available
                </div>
              )}
            </div>
          </div>

          {/* Property Types Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Property Types</h3>
            <div className="h-64">
              {reportsData?.propertyTypes.length > 0 ? (
                <Doughnut data={propertyTypesData} options={doughnutOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No property type data available
                </div>
              )}
            </div>
          </div>

          {/* Maintenance by Category */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Maintenance Categories</h3>
            <div className="h-64">
              {reportsData?.maintenanceByCategory.length > 0 ? (
                <Bar data={maintenanceCategoryData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No maintenance category data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Reports */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Calendar className="h-5 w-5 text-purple-600 mr-3" />
              <div className="text-left">
                <div className="font-medium">Monthly Summary</div>
                <div className="text-sm text-gray-500">Detailed monthly breakdown</div>
              </div>
            </button>
            
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <BarChart3 className="h-5 w-5 text-purple-600 mr-3" />
              <div className="text-left">
                <div className="font-medium">Financial Report</div>
                <div className="text-sm text-gray-500">Revenue and expenses</div>
              </div>
            </button>
            
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="h-5 w-5 text-purple-600 mr-3" />
              <div className="text-left">
                <div className="font-medium">Tenant Report</div>
                <div className="text-sm text-gray-500">Occupancy and tenant data</div>
              </div>
            </button>
          </div>
        </div>

        {/* Data Tables */}
        {reportsData?.maintenanceByCategory.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requests
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportsData.maintenanceByCategory.map((category, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {category._id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {category.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(category.totalCost || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(category.count > 0 ? (category.totalCost || 0) / category.count : 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
