'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { CreditCard, Search, Eye, Download, TrendingUp, DollarSign } from 'lucide-react';

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({});
  const [statusCounts, setStatusCounts] = useState({});
  const [revenueSummary, setRevenueSummary] = useState({});

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'success', label: 'Successful' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'abandoned', label: 'Abandoned' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'booking_payment', label: 'Booking Payment' },
    { value: 'deposit', label: 'Deposit' },
    { value: 'rent', label: 'Rent' },
    { value: 'fee', label: 'Fee' },
    { value: 'refund', label: 'Refund' }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Date Created' },
    { value: 'amount', label: 'Amount' },
    { value: 'paidAt', label: 'Payment Date' },
    { value: 'customer.lastName', label: 'Customer Name' }
  ];

  const orderOptions = [
    { value: 'desc', label: 'Newest First' },
    { value: 'asc', label: 'Oldest First' }
  ];

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...filters,
        customer: searchTerm
      });
      const response = await fetch(`/api/transactions?${params}`);
      const data = await response.json();

      if (data.success) {
        setTransactions(data.data);
        setPagination(data.pagination);
        setStatusCounts(data.statusCounts);
        setRevenueSummary(data.revenueSummary);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'status' || key === 'type' ? 1 : prev.page
    }));
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchTransactions();
  };

  const getStatusColor = (status) => {
    const colors = {
      'success': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800',
      'abandoned': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type) => {
    const colors = {
      'booking_payment': 'bg-blue-100 text-blue-800',
      'deposit': 'bg-purple-100 text-purple-800',
      'rent': 'bg-indigo-100 text-indigo-800',
      'fee': 'bg-orange-100 text-orange-800',
      'refund': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount / 100); // Convert from kobo to naira
  };

  const formatType = (type) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 text-purple-600 mr-2" />
            <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
          </div>
          
          <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(revenueSummary.totalRevenue || 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Successful Payments</p>
                <p className="text-2xl font-semibold text-green-600">{statusCounts.success || 0}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Payments</p>
                <p className="text-2xl font-semibold text-yellow-600">{statusCounts.pending || 0}</p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-yellow-600 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Transaction</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(revenueSummary.averageTransaction || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex gap-4 flex-wrap">
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers or references..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full text-gray-700 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div className="w-48">
                <CustomDropdown
                  options={statusOptions}
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                  placeholder="Filter by status"
                />
              </div>
              
              <div className="w-48">
                <CustomDropdown
                  options={typeOptions}
                  value={filters.type}
                  onChange={(value) => handleFilterChange('type', value)}
                  placeholder="Filter by type"
                />
              </div>
              
              <div className="w-48">
                <CustomDropdown
                  options={sortOptions}
                  value={filters.sortBy}
                  onChange={(value) => handleFilterChange('sortBy', value)}
                  placeholder="Sort by"
                />
              </div>
              
              <div className="w-40">
                <CustomDropdown
                  options={orderOptions}
                  value={filters.sortOrder}
                  onChange={(value) => handleFilterChange('sortOrder', value)}
                  placeholder="Order"
                />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading transactions...</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer & Reference
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.customer.firstName} {transaction.customer.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{transaction.customer.email}</div>
                            <div className="text-xs text-gray-400 mt-1">{transaction.reference}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(transaction.amount)}
                          </div>
                          {transaction.fees.paystackFee > 0 && (
                            <div className="text-xs text-gray-500">
                              Fee: {formatCurrency(transaction.fees.paystackFee)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                            {formatType(transaction.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {transaction.paymentMethod ? (
                              transaction.paymentMethod.charAt(0).toUpperCase() + transaction.paymentMethod.slice(1)
                            ) : '-'}
                          </div>
                          {transaction.authorization?.last4 && (
                            <div className="text-xs text-gray-500">
                              **** {transaction.authorization.last4}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                          </div>
                          {transaction.paidAt && (
                            <div className="text-xs text-gray-500">
                              Paid: {format(new Date(transaction.paidAt), 'MMM dd, HH:mm')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Empty State */}
                {transactions.length === 0 && !loading && (
                  <div className="p-8 text-center text-gray-500">
                    {searchTerm || filters.status !== 'all' || filters.type !== 'all'
                      ? 'No transactions match your search.' 
                      : 'No transactions found.'}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-700">
                      Showing {((pagination.currentPage - 1) * filters.limit) + 1} to{' '}
                      {Math.min(pagination.currentPage * filters.limit, pagination.totalItems)} of{' '}
                      {pagination.totalItems} results
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-700">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
